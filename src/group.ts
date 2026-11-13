import { matchingPatterns } from "./group-matching";
import { getNormalWindowIds } from "./window";
import type { GroupingSettings, TabGroup, TabGroupColor } from "./types";

let isGrouping = false;
let regroupAfterCurrentRun = false;

function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 300) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

const runGrouping = debounce(async () => {
  if (isGrouping) return;
  isGrouping = true;

  try {
    const settings = await chrome.storage.local.get<
      { groups?: TabGroup[]; enableGrouping?: boolean } & GroupingSettings
    >([
      "groups",
      "enableGrouping",
      "optIgnoreProtocol",
      "optIgnoreWww",
      "optIgnoreQuery",
      "optIgnoreHash",
      "optDomainOnly",
      "optDisableWildcards",
      "optGroupForeignTabs",
    ]);
    if (settings.enableGrouping !== false) {
      await applyTabGrouping(settings.groups ?? [], settings);
    }
  } catch (err) {
    console.error("Grouping failed", err);
  } finally {
    isGrouping = false;
    if (regroupAfterCurrentRun) {
      regroupAfterCurrentRun = false;
      runGrouping();
    }
  }
}, 500);

/**
 * Schedules grouping for the current window. Settings changes during a pass
 * request another pass so the latest rules are applied.
 *
 * @example
 * scheduleGrouping(true);
 */
export const scheduleGrouping = (settingsChanged = false) => {
  if (isGrouping && settingsChanged) regroupAfterCurrentRun = true;
  else runGrouping();
};

async function applyTabGrouping(
  groups: TabGroup[],
  settings: GroupingSettings,
): Promise<void> {
  try {
    // Brave crashes when chrome.tabs.group() targets a tab inside a popup window (brave/brave-browser#59347). Only touch tabs that live in normal windows.
    const normalWindowIds = await getNormalWindowIds();
    const tabs = (await chrome.tabs.query({ currentWindow: true })).filter(
      (t) => normalWindowIds.has(t.windowId),
    );
    const usedGroupIds = new Set();
    const processedTabIds = new Set();
    const groupPositions = [];

    const desiredNames = groups.map((g) => g.name).filter(Boolean);

    // Tabs inside groups this extension does not manage (e.g. the Claude in Chrome MCP tab group) are left untouched unless optGroupForeignTabs is on, otherwise they would be pulled out of that group.
    const foreignGroupIds = new Set<number>();
    const seenGroupIds = new Set<number>();
    for (const t of tabs) {
      if (
        settings.optGroupForeignTabs ||
        t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE ||
        seenGroupIds.has(t.groupId)
      )
        continue;
      seenGroupIds.add(t.groupId);
      try {
        const tg = await chrome.tabGroups.get(t.groupId);
        if (tg.title === undefined || !desiredNames.includes(tg.title)) {
          foreignGroupIds.add(t.groupId);
        }
      } catch {
        foreignGroupIds.add(t.groupId);
      }
    }

    // Each tab goes to the first matching group in the saved list.
    for (const group of groups) {
      const matched = tabs.filter((t) => {
        if (
          t.id === undefined ||
          processedTabIds.has(t.id) ||
          foreignGroupIds.has(t.groupId) ||
          typeof t.url !== "string"
        )
          return false;
        return matchingPatterns(t.url, group, settings).length > 0;
      });

      if (matched.length === 0) continue;

      let existingGid: number | null = null;
      for (const t of matched) {
        if (
          t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE &&
          !usedGroupIds.has(t.groupId)
        ) {
          try {
            const tg = await chrome.tabGroups.get(t.groupId);
            if (tg.title === group.name) {
              existingGid = t.groupId;
              break;
            }
          } catch {}
        }
      }

      // chrome.tabs.group() types tabIds as a non-empty tuple; matched is non-empty here and tab ids are integers in practice.
      const ids = matched
        .map((t) => t.id)
        .filter((id): id is number => Number.isInteger(id)) as [
        number,
        ...number[],
      ];
      let groupId = existingGid;
      const color: TabGroupColor = group.color || "grey";

      if (groupId != null) {
        await chrome.tabs.group({ groupId, tabIds: ids });
        await chrome.tabGroups.update(groupId, { color, title: group.name });
      } else {
        groupId = await chrome.tabs.group({ tabIds: ids });
        await chrome.tabGroups.update(groupId, { color, title: group.name });
      }
      usedGroupIds.add(groupId);

      groupPositions.push({
        groupId,
        index: Math.min(...matched.map((t) => t.index)),
      });

      ids.forEach((id) => processedTabIds.add(id));
    }

    for (const t of tabs) {
      if (t.id === undefined) continue;
      if (
        !processedTabIds.has(t.id) &&
        t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
      ) {
        let isManagedGroup = false;
        try {
          const tg = await chrome.tabGroups.get(t.groupId);
          if (tg.title !== undefined && desiredNames.includes(tg.title)) {
            isManagedGroup = true;
          }
        } catch {}

        if (isManagedGroup) {
          if (typeof t.url !== "string") continue;
          const url = t.url;
          const matchesAny = groups.some(
            (group) => matchingPatterns(url, group, settings).length > 0,
          );

          if (!matchesAny) {
            try {
              await chrome.tabs.ungroup([t.id]);
            } catch {}
          }
        }
      }
    }

    groupPositions.sort((a, b) => a.index - b.index);
    for (const { groupId, index } of groupPositions) {
      try {
        await chrome.tabGroups.move(groupId, { index });
      } catch {}
    }
  } catch (err) {
    console.error("Grouping failed", err);
  }
}
