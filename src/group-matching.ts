import type { GroupingSettings, TabGroup } from "./types";

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

const normalizeUrl = (url: string, settings: GroupingSettings) => {
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
};

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

const isMatch = (url: string, pattern: string, disableWildcards?: boolean) => {
  if (!pattern) return false;

  if (disableWildcards) {
    // Treat "*" and "?" as literal characters and require an exact match.
    return url === pattern;
  }

  return globToRegExp(pattern).test(url);
};

/**
 * Parses an explicit rule. An invalid token returns undefined.
 * @example parseGroupingRule("!domain:example.com") // { exclude: true, target: "domain", value: "example.com" }
 */
export const parseGroupingRule = (pattern: string) => {
  const exclude = pattern.startsWith("!");
  const rule = exclude ? pattern.slice(1) : pattern;
  const separator = rule.indexOf(":");
  if (separator === -1) return;

  const target = rule.slice(0, separator);
  const value = rule.slice(separator + 1);
  if (!value) return;
  switch (target) {
    case "host": {
      const slash = value.indexOf("/");
      const host = slash === -1 ? value : value.slice(0, slash);
      if (
        !/^(?:[\p{L}\p{M}\p{N}*?_-]+(?:\.[\p{L}\p{M}\p{N}*?_-]+)*\.?|\[[\da-f:]+\])$/iu.test(
          host,
        )
      )
        return;
      return {
        exclude,
        target,
        host,
        path: slash === -1 ? "" : value.slice(slash),
      };
    }
    case "domain":
      if (!/^[\p{L}\p{M}\p{N}-]+(?:\.[\p{L}\p{M}\p{N}-]+)*\.?$/u.test(value))
        return;
      return { exclude, target, value };
    case "url":
      return { exclude, target, value };
  }
};

const normalizeRuleHost = (hostname: string) =>
  decodePunycodeUrl(hostname.toLowerCase().replace(/\.$/, ""));

const matchingRulePatterns = (
  url: string,
  patterns: string[],
  settings: GroupingSettings,
) => {
  const page = (() => {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  })();
  if (!page) return [];

  const hostname = normalizeRuleHost(page.hostname);
  const normalizedUrl = normalizeUrl(url, {
    ...settings,
    optDomainOnly: false,
  });
  const matching: string[] = [];

  for (const pattern of patterns) {
    const rule = parseGroupingRule(pattern);
    // A malformed exclusion could otherwise silently widen a group.
    if (!rule) return [];

    const matches = (() => {
      switch (rule.target) {
        case "host":
          return (
            Boolean(hostname) &&
            isMatch(
              hostname,
              normalizeRuleHost(rule.host),
              settings.optDisableWildcards,
            ) &&
            (!rule.path ||
              isMatch(page.pathname, rule.path, settings.optDisableWildcards))
          );
        case "domain": {
          const domain = normalizeRuleHost(rule.value);
          return hostname === domain || hostname.endsWith(`.${domain}`);
        }
        case "url":
          return isMatch(
            normalizedUrl,
            rule.value,
            settings.optDisableWildcards,
          );
      }
    })();

    if (!matches) continue;
    if (rule.exclude) return [];
    matching.push(pattern);
  }

  return matching;
};

/**
 * Returns the matching patterns for one named group, in the order they were entered.
 * Groups without an explicit target use the shared URL options.
 *
 * @example
 * matchingPatterns("https://github.com/otnc", { name: "GitHub", color: "grey", matchTarget: "hostname", patterns: ["github.com"] }, {}) // ["github.com"]
 */
export const matchingPatterns = (
  url: string,
  group: TabGroup,
  settings: GroupingSettings,
) => {
  if (
    !group.name ||
    !Array.isArray(group.patterns) ||
    group.patterns.length === 0
  )
    return [];

  if (group.matchTarget === "rules") {
    return matchingRulePatterns(url, group.patterns, settings);
  }

  if (group.matchTarget === "hostname") {
    try {
      const { hostname } = new URL(url);
      if (!hostname) return [];
      const host = decodePunycodeUrl(hostname);
      const normalizedHost = settings.optIgnoreWww
        ? host.replace(/^www\d*\./, "")
        : host;
      return group.patterns.filter((pattern) =>
        isMatch(
          normalizedHost.toLowerCase(),
          decodePunycodeUrl(pattern.toLowerCase()),
          settings.optDisableWildcards,
        ),
      );
    } catch {
      return [];
    }
  }

  const normalizedUrl = normalizeUrl(
    url,
    group.matchTarget === "url"
      ? { ...settings, optDomainOnly: false }
      : settings,
  );
  return group.patterns.filter((pattern) =>
    isMatch(normalizedUrl, pattern, settings.optDisableWildcards),
  );
};
