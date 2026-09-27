import { getNormalWindowIds } from "./window";
import type { GroupingSettings, TabGroup, TabGroupColor } from "./types";

let isGrouping = false;

function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 300) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function punycodeToUnicode(domain: string): string {
  const base = 36;
  const tMin = 1;
  const tMax = 26;
  const skew = 38;
  const damp = 700;
  const initialBias = 72;
  const initialN = 128;
  const delimiter = "-";

  let output: string[] = [];
  let input = domain.split("");
  const i = domain.lastIndexOf(delimiter);
  let n = initialN;
  let bias = initialBias;
  let index = 0;

  if (i > 0) {
    output = input.slice(0, i);
    input = input.slice(i + 1);
  }

  while (input.length > 0) {
    const oldi = index;
    let w = 1;

    for (let k = base; ; k += base) {
      const shifted = input.shift();
      if (shifted === undefined) break;
      const charCode = shifted.charCodeAt(0);
      const digit = charCode - (charCode < 58 ? 22 : charCode < 91 ? 65 : 97);
      index += digit * w;

      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

      if (digit < t) break;
      w *= base - t;
    }

    bias = adapt(index - oldi, output.length + 1, oldi === 0);
    n += Math.floor(index / (output.length + 1));
    index %= output.length + 1;
    output.splice(index++, 0, String.fromCharCode(n));
  }

  return output.join("");

  function adapt(delta: number, numPoints: number, firstTime: boolean): number {
    delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    let k = 0;
    while (delta > ((base - tMin) * tMax) >> 1) {
      delta = Math.floor(delta / (base - tMin));
      k += base;
    }
    return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
  }
}

function decodePunycodeUrl(url: string): string {
  try {
    const punycodePattern = /\bxn--[a-zA-Z0-9-]+/i;
    if (!punycodePattern.test(url)) return url;

    try {
      const urlObj = new URL(url.includes("://") ? url : `http://${url}`);
      const hostname = urlObj.hostname;
      if (hostname.includes("xn--")) {
        const decodedHost = hostname
          .split(".")
          .map((part) =>
            part.startsWith("xn--") ? punycodeToUnicode(part.slice(4)) : part,
          )
          .join(".");
        return url.replace(hostname, decodedHost);
      }
    } catch {
      return url
        .split(".")
        .map((part) => {
          if (part.startsWith("xn--")) return punycodeToUnicode(part.slice(4));
          return part;
        })
        .join(".");
    }
    return url;
  } catch {
    return url;
  }
}

function normalizeUrl(url: string, settings: GroupingSettings): string {
  let processed = decodePunycodeUrl(url);

  if (settings.optIgnoreProtocol) {
    processed = processed.replace(/^https?:\/\//, "");
  }

  if (settings.optIgnoreWww) {
    processed = processed.replace(/^www\d*\./, "");
  }

  if (settings.optDomainOnly) {
    const slashIndex = processed.indexOf("/");
    if (slashIndex !== -1) {
      processed = processed.substring(0, slashIndex);
    }
    return processed;
  }

  if (settings.optIgnoreQuery) {
    const qIndex = processed.indexOf("?");
    if (qIndex !== -1) {
      processed = processed.substring(0, qIndex);
    }
  }

  if (settings.optIgnoreHash) {
    const hIndex = processed.indexOf("#");
    if (hIndex !== -1) {
      processed = processed.substring(0, hIndex);
    }
  }

  return processed;
}

// Glob-style pattern matching:
// - "*" matches any sequence of characters (including none)
// - "?" matches exactly one character
// - a pattern without wildcards requires an exact match
// Examples: "*.example.com" (subdomains), "example.*" (any TLD), "*keyword*" (partial match), "example.com" (exact match).
function globToRegExp(pattern: string): RegExp {
  let source = "";
  for (const ch of pattern) {
    if (ch === "*") {
      source += ".*";
    } else if (ch === "?") {
      source += ".";
    } else {
      source += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

function isMatch(
  url: string,
  pattern: string,
  disableWildcards?: boolean,
): boolean {
  if (!pattern) return false;

  if (disableWildcards) {
    // Treat "*" and "?" as literal characters and require an exact match.
    return url === pattern;
  }

  return globToRegExp(pattern).test(url);
}

export const scheduleGrouping = debounce(() => {
  if (isGrouping) return;

  chrome.storage.local.get(
    [
      "groups",
      "optIgnoreProtocol",
      "optIgnoreWww",
      "optIgnoreQuery",
      "optIgnoreHash",
      "optDomainOnly",
      "optDisableWildcards",
    ],
    (settings: { groups?: TabGroup[] } & GroupingSettings) => {
      const groups = settings.groups || [];
      applyTabGrouping(groups, settings);
    },
  );
}, 500);

async function applyTabGrouping(
  groups: TabGroup[],
  settings: GroupingSettings,
): Promise<void> {
  isGrouping = true;
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

    for (const group of groups) {
      if (
        !group.name ||
        !Array.isArray(group.patterns) ||
        group.patterns.length === 0
      )
        continue;

      const matched = tabs.filter((t) => {
        if (
          t.id === undefined ||
          processedTabIds.has(t.id) ||
          typeof t.url !== "string"
        )
          return false;
        const cleanUrl = normalizeUrl(t.url, settings);
        return group.patterns.some((p) =>
          isMatch(cleanUrl, p, settings.optDisableWildcards),
        );
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
          const cleanUrl = normalizeUrl(t.url, settings);
          const matchesAny = groups.some((g) =>
            g.patterns.some((p) =>
              isMatch(cleanUrl, p, settings.optDisableWildcards),
            ),
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
  } finally {
    isGrouping = false;
  }
}
