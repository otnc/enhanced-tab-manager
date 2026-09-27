import { getNormalWindowIds } from "./window";
import type { ClosedTab } from "./types";

export async function saveAndCloseAllTabs(): Promise<void> {
  // Only manage tabs in normal windows; popup/panel windows are left alone (closing their only tab would close the window itself).
  const normalWindowIds = await getNormalWindowIds();
  const tabs = (await chrome.tabs.query({ currentWindow: true })).filter((t) =>
    normalWindowIds.has(t.windowId),
  );
  const newTabs = tabs
    .filter((tab) => typeof tab.url === "string")
    .map((tab) => ({
      title: tab.title || tab.url,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
    }));

  const res = await chrome.storage.local.get<{
    closedTabs?: ClosedTab[];
    keepWindowOpen?: boolean;
  }>(["closedTabs", "keepWindowOpen"]);
  const existing: ClosedTab[] = res.closedTabs || [];
  const keepWindowOpen = res.keepWindowOpen || false;

  await chrome.storage.local.set({ closedTabs: [...existing, ...newTabs] });

  if (keepWindowOpen) {
    await chrome.tabs.create({});
  }

  const ids = tabs
    .map((t) => t.id)
    .filter((id): id is number => Number.isInteger(id));
  if (ids.length > 0) {
    try {
      await chrome.tabs.remove(ids);
    } catch (err) {
      console.error("Failed to close tabs", err);
    }
  }
}

export async function restoreAllTabs(): Promise<void> {
  const { closedTabs = [] }: { closedTabs?: ClosedTab[] } =
    await chrome.storage.local.get("closedTabs");
  for (const { url } of closedTabs) {
    try {
      await chrome.tabs.create({ url, active: false });
    } catch (err) {
      console.error("Failed to restore tab", url, err);
    }
  }
  await chrome.storage.local.set({ closedTabs: [] });
}

export async function clearAllSavedTabs(): Promise<void> {
  await chrome.storage.local.set({ closedTabs: [] });
}
