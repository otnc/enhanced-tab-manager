// Shared types for data stored in chrome.storage.local.

// The tab group colors supported by chrome.tabGroups.
export type TabGroupColor =
  | "grey"
  | "blue"
  | "red"
  | "yellow"
  | "green"
  | "pink"
  | "purple"
  | "cyan"
  | "orange";

export interface TabGroup {
  name: string;
  patterns: string[];
  color: TabGroupColor;
}

export interface ClosedTab {
  title: string;
  url: string;
  favIconUrl?: string;
}

// Manager on/off flags read from storage. All keys are optional because storage may predate them; callers treat undefined as the default value.
export interface ManagerSettings {
  enableManager?: boolean;
  enableGrouping?: boolean;
  keepWindowOpen?: boolean;
}

// URL normalization options read from storage. All keys are optional because storage may predate them; callers treat undefined as the default value.
export interface GroupingSettings {
  optIgnoreProtocol?: boolean;
  optIgnoreWww?: boolean;
  optIgnoreQuery?: boolean;
  optIgnoreHash?: boolean;
  optDomainOnly?: boolean;
  optDisableWildcards?: boolean;
}
