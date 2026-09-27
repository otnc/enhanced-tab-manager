// Pattern syntax version stored in chrome.storage.local. Bump this when
// the pattern syntax changes again and extend convertPattern() below.
const PATTERN_VERSION = 2;

// Convert a v1 (pre-glob) pattern to the v2 glob-style syntax:
// - "quoted" exact match -> unquoted exact match (no wildcard)
// - patterns containing "*" or "?" -> kept as-is (glob semantics)
// - bare word (word-boundary partial match) -> "*word*" partial match,
//   the broader of the two possible conversions
// Patterns that cannot be converted are kept unchanged.
function convertPattern(pattern) {
  if (typeof pattern !== "string" || pattern === "") return pattern;

  if (pattern.length >= 2 && pattern.startsWith('"') && pattern.endsWith('"')) {
    return pattern.slice(1, -1);
  }

  if (pattern.includes("*") || pattern.includes("?")) return pattern;

  return `*${pattern}*`;
}

// Migrate stored group patterns to the current pattern syntax. Runs at
// most once per syntax version (guarded by the patternVersion flag) and
// is also called when groups are replaced (e.g. via settings import) so
// that backups saved by older versions are converted too.
export async function migratePatterns() {
  const res = await chrome.storage.local.get(["groups", "patternVersion"]);
  if (res.patternVersion === PATTERN_VERSION) return;

  if (Array.isArray(res.groups)) {
    const groups = res.groups.map((g) => {
      if (!g || !Array.isArray(g.patterns)) return g;
      return { ...g, patterns: g.patterns.map(convertPattern) };
    });
    if (JSON.stringify(groups) !== JSON.stringify(res.groups)) {
      await chrome.storage.local.set({ groups });
    }
  }

  await chrome.storage.local.set({ patternVersion: PATTERN_VERSION });
}
