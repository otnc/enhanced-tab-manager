import { restoreAllTabs, saveAndCloseAllTabs } from "./tab";
import type {
  ClosedTab,
  GroupingSettings,
  ManagerSettings,
  TabGroup,
  TabGroupColor,
} from "./types";

// Throws at startup if the popup HTML is missing an expected element, so the references below can be non-null.
const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el as T;
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });
  const phGroupName = chrome.i18n.getMessage("phGroupName");
  const phPatterns = chrome.i18n.getMessage("phPatterns");
  const msgImportSuccess = chrome.i18n.getMessage("alertImportSuccess");
  const msgImportFail = chrome.i18n.getMessage("alertImportFail");

  const chkEnableManager = byId<HTMLInputElement>("chk-enable-manager");
  const chkEnableGrouping = byId<HTMLInputElement>("chk-enable-grouping");
  const chkKeepWindow = byId<HTMLInputElement>("chk-keep-window");

  const optIgnoreProtocol = byId<HTMLInputElement>("opt-ignore-protocol");
  const optIgnoreWww = byId<HTMLInputElement>("opt-ignore-www");
  const optIgnoreQuery = byId<HTMLInputElement>("opt-ignore-query");
  const optIgnoreHash = byId<HTMLInputElement>("opt-ignore-hash");
  const optDomainOnly = byId<HTMLInputElement>("opt-domain-only");
  const optDisableWildcards = byId<HTMLInputElement>("opt-disable-wildcards");

  const managerUI = byId("manager-ui");
  const groupingUI = byId("grouping-ui");

  const closedList = byId<HTMLUListElement>("closed-list");
  const restoreAllBtn = byId<HTMLButtonElement>("restore-all");
  const clearAllBtn = byId<HTMLButtonElement>("clear-all");
  const saveCloseAllBtn = byId<HTMLButtonElement>("save-close-all");

  const groupList = byId<HTMLUListElement>("group-list");
  const addGroupBtn = byId<HTMLButtonElement>("add-group");

  const btnExport = byId<HTMLButtonElement>("btn-export");
  const btnImportTrigger = byId<HTMLButtonElement>("btn-import-trigger");
  const fileImport = byId<HTMLInputElement>("file-import");

  const availableColors: TabGroupColor[] = [
    "grey",
    "blue",
    "red",
    "yellow",
    "green",
    "pink",
    "purple",
    "cyan",
    "orange",
  ];

  let closedTabs: ClosedTab[] = [];
  let groups: TabGroup[] = [];

  function loadSettings() {
    const keys: (keyof ManagerSettings | keyof GroupingSettings)[] = [
      "enableManager",
      "enableGrouping",
      "keepWindowOpen",
      "optIgnoreProtocol",
      "optIgnoreWww",
      "optIgnoreQuery",
      "optIgnoreHash",
      "optDomainOnly",
      "optDisableWildcards",
    ];
    chrome.storage.local.get<ManagerSettings & GroupingSettings>(
      keys,
      (res) => {
        const eM = res.enableManager !== false;
        const eG = res.enableGrouping !== false;
        const kW = res.keepWindowOpen === true;
        chkEnableManager.checked = eM;
        chkEnableGrouping.checked = eG;
        chkKeepWindow.checked = kW;

        optIgnoreProtocol.checked = res.optIgnoreProtocol !== false;
        optIgnoreWww.checked = res.optIgnoreWww !== false;
        optIgnoreQuery.checked = res.optIgnoreQuery !== false;
        optIgnoreHash.checked = res.optIgnoreHash !== false;
        optDomainOnly.checked = res.optDomainOnly === true;
        optDisableWildcards.checked = res.optDisableWildcards === true;

        toggleUI(eM, eG);
      },
    );
  }
  loadSettings();

  function bindCheckbox(elem: HTMLInputElement, key: string) {
    elem.addEventListener("change", () => {
      chrome.storage.local.set({ [key]: elem.checked });
    });
  }

  bindCheckbox(chkEnableManager, "enableManager");
  bindCheckbox(chkEnableGrouping, "enableGrouping");
  bindCheckbox(chkKeepWindow, "keepWindowOpen");

  bindCheckbox(optIgnoreProtocol, "optIgnoreProtocol");
  bindCheckbox(optIgnoreWww, "optIgnoreWww");
  bindCheckbox(optIgnoreQuery, "optIgnoreQuery");
  bindCheckbox(optIgnoreHash, "optIgnoreHash");
  bindCheckbox(optDomainOnly, "optDomainOnly");
  bindCheckbox(optDisableWildcards, "optDisableWildcards");

  chkEnableManager.addEventListener("change", () =>
    toggleUI(chkEnableManager.checked, chkEnableGrouping.checked),
  );
  chkEnableGrouping.addEventListener("change", () =>
    toggleUI(chkEnableManager.checked, chkEnableGrouping.checked),
  );

  function toggleUI(showManager: boolean, showGrouping: boolean) {
    managerUI.style.display = showManager ? "block" : "none";
    groupingUI.style.display = showGrouping ? "block" : "none";
  }

  btnExport.addEventListener("click", () => {
    chrome.storage.local.get(null, (items) => {
      const json = JSON.stringify(items, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tab-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });

  btnImportTrigger.addEventListener("click", () => {
    fileImport.click();
  });

  fileImport.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = (ev.target as FileReader).result;
        if (typeof text !== "string") throw new Error();
        const data = JSON.parse(text);
        if (typeof data !== "object" || data === null) throw new Error();
        chrome.storage.local.set(data, () => {
          alert(msgImportSuccess);
          window.location.reload();
        });
      } catch {
        alert(msgImportFail);
      }
    };
    reader.readAsText(file);
    fileImport.value = "";
  });

  chrome.commands.getAll((commands) => {
    const shortcuts: Record<string, string> = {};
    commands.forEach((c) => {
      if (c.name && c.shortcut) shortcuts[c.name] = c.shortcut;
    });
    if (shortcuts.restore_all_tabs)
      restoreAllBtn.textContent += ` (${shortcuts.restore_all_tabs})`;
    if (shortcuts.clear_all_saved_tabs)
      clearAllBtn.textContent += ` (${shortcuts.clear_all_saved_tabs})`;
    if (shortcuts.save_and_close_all_tabs)
      saveCloseAllBtn.textContent += ` (${shortcuts.save_and_close_all_tabs})`;
  });

  function saveClosedTabs() {
    chrome.storage.local.set({ closedTabs });
    renderClosedTabs();
  }

  function renderClosedTabs() {
    closedList.innerHTML = "";
    closedTabs.forEach((tab, i) => {
      const li = document.createElement("li");

      const icon = document.createElement("img");
      icon.src = tab.favIconUrl || "../icons/16x16.png";
      icon.style.width = "16px";
      icon.style.height = "16px";
      icon.style.marginRight = "8px";
      icon.onerror = () => {
        icon.src = "../icons/16x16.png";
      };

      const a = document.createElement("a");
      a.textContent = tab.title;
      a.href = "#";
      a.style.flex = "1";
      a.style.textDecoration = "none";
      a.style.color = "inherit";
      a.style.whiteSpace = "nowrap";
      a.style.overflow = "hidden";
      a.style.textOverflow = "ellipsis";

      const restore = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "BUTTON" || target.tagName === "SELECT") return;
        chrome.tabs.create({ url: tab.url, active: false });
        closedTabs.splice(i, 1);
        saveClosedTabs();
      };
      li.addEventListener("click", restore);
      a.addEventListener("click", (e) => {
        e.preventDefault();
      });

      const del = document.createElement("button");
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        closedTabs.splice(i, 1);
        saveClosedTabs();
      });

      li.append(icon, a, del);
      closedList.append(li);
    });
  }

  restoreAllBtn.addEventListener("click", () => {
    // The closed-tabs list re-renders via the storage.onChanged listener.
    restoreAllTabs();
  });

  clearAllBtn.addEventListener("click", () => {
    closedTabs = [];
    saveClosedTabs();
  });

  saveCloseAllBtn.addEventListener("click", () => {
    // The closed-tabs list re-renders via the storage.onChanged listener.
    saveAndCloseAllTabs();
  });

  chrome.storage.local.get<{ closedTabs?: ClosedTab[] }>(
    "closedTabs",
    (res) => {
      closedTabs = res.closedTabs || [];
      renderClosedTabs();
    },
  );

  function saveGroups() {
    chrome.storage.local.set({ groups });
    renderGroups();
  }

  function renderGroups() {
    groupList.innerHTML = "";
    groups.forEach((g, idx) => {
      const li = document.createElement("li");
      li.className = "group-row";

      const colorSel = document.createElement("select");
      colorSel.className = "color-select";
      colorSel.style.borderLeft = `5px solid ${g.color || "grey"}`;
      availableColors.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (c === (g.color || "grey")) opt.selected = true;
        colorSel.appendChild(opt);
      });
      colorSel.addEventListener("change", () => {
        groups[idx].color = colorSel.value as TabGroupColor;
        saveGroups();
      });

      const nameInp = document.createElement("input");
      nameInp.className = "group-name";
      nameInp.value = g.name;
      nameInp.placeholder = phGroupName;
      nameInp.addEventListener("change", () => {
        groups[idx].name = nameInp.value.trim();
        saveGroups();
      });

      const patInp = document.createElement("input");
      patInp.className = "group-patterns";
      patInp.value = g.patterns.join(" ");
      patInp.placeholder = phPatterns;
      patInp.addEventListener("change", () => {
        groups[idx].patterns = patInp.value
          .trim()
          .split(/\s+/)
          .filter((s) => s);
        saveGroups();
      });

      const del = document.createElement("button");
      del.textContent = "×";
      del.addEventListener("click", () => {
        groups.splice(idx, 1);
        saveGroups();
      });

      li.append(colorSel, nameInp, patInp, del);
      groupList.append(li);
    });
  }

  addGroupBtn.addEventListener("click", () => {
    groups.push({ name: "", patterns: [], color: "grey" });
    saveGroups();
  });

  chrome.storage.local.get<{ groups?: TabGroup[] }>("groups", (res) => {
    groups = res.groups || [];
    renderGroups();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.closedTabs) {
      closedTabs = (changes.closedTabs.newValue as ClosedTab[]) || [];
      renderClosedTabs();
    }
    if (changes.groups) {
      groups = (changes.groups.newValue as TabGroup[]) || [];
      renderGroups();
    }

    if (changes.enableManager) {
      chkEnableManager.checked = changes.enableManager.newValue as boolean;
      toggleUI(chkEnableManager.checked, chkEnableGrouping.checked);
    }
    if (changes.enableGrouping) {
      chkEnableGrouping.checked = changes.enableGrouping.newValue as boolean;
      toggleUI(chkEnableManager.checked, chkEnableGrouping.checked);
    }
    if (changes.keepWindowOpen)
      chkKeepWindow.checked = changes.keepWindowOpen.newValue as boolean;

    // URL Options sync
    if (changes.optIgnoreProtocol)
      optIgnoreProtocol.checked = changes.optIgnoreProtocol.newValue as boolean;
    if (changes.optIgnoreWww)
      optIgnoreWww.checked = changes.optIgnoreWww.newValue as boolean;
    if (changes.optIgnoreQuery)
      optIgnoreQuery.checked = changes.optIgnoreQuery.newValue as boolean;
    if (changes.optIgnoreHash)
      optIgnoreHash.checked = changes.optIgnoreHash.newValue as boolean;
    if (changes.optDomainOnly)
      optDomainOnly.checked = changes.optDomainOnly.newValue as boolean;
    if (changes.optDisableWildcards)
      optDisableWildcards.checked = changes.optDisableWildcards
        .newValue as boolean;
  });
});
