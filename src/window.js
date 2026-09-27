// Helpers to identify tabs that live in normal browser windows.

// Brave crashes when chrome.tabs.group() is called for a tab inside a popup window (brave/brave-browser#59347), so grouping and tab management must only touch tabs of "normal" windows. Window info is fetched in bulk and cached; the cache is dropped on window events and expired by a TTL so a missed event cannot pin stale data forever.

const CACHE_TTL_MS = 10000;

let cachedNormalWindowIds = null;
let cacheExpiresAt = 0;

function invalidateCache() {
  cachedNormalWindowIds = null;
}

chrome.windows.onCreated.addListener(invalidateCache);
chrome.windows.onRemoved.addListener(invalidateCache);

export async function getNormalWindowIds() {
  if (cachedNormalWindowIds && Date.now() < cacheExpiresAt) {
    return cachedNormalWindowIds;
  }
  const windows = await chrome.windows.getAll();
  cachedNormalWindowIds = new Set(
    windows.filter((w) => w.type === "normal").map((w) => w.id),
  );
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cachedNormalWindowIds;
}
