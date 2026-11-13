import { restoreAllTabs, saveAndCloseAllTabs } from "./tab";
import { matchingPatterns, parseGroupingRule } from "./group-matching";
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
  const optGroupForeignTabs = byId<HTMLInputElement>("opt-group-foreign-tabs");

  const managerUI = byId("manager-ui");
  const groupingUI = byId("grouping-ui");

  const closedList = byId<HTMLUListElement>("closed-list");
  const restoreAllBtn = byId<HTMLButtonElement>("restore-all");
  const clearAllBtn = byId<HTMLButtonElement>("clear-all");
  const saveCloseAllBtn = byId<HTMLButtonElement>("save-close-all");

  const groupList = byId<HTMLOListElement>("group-list");
  const addGroupBtn = byId<HTMLButtonElement>("add-group");
  const previewUrl = byId<HTMLInputElement>("preview-url");
  const previewResults = byId<HTMLUListElement>("preview-results");

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
  let groupSave = Promise.resolve();
  let groupSavePending = false;

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
      "optGroupForeignTabs",
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
        optGroupForeignTabs.checked = res.optGroupForeignTabs === true;

        toggleUI(eM, eG);
        renderPreview();
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
  bindCheckbox(optGroupForeignTabs, "optGroupForeignTabs");

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

  const renderPreview = () => {
    previewResults.replaceChildren();
    const url = previewUrl.value.trim();
    if (!url) return;

    const appendResult = (message: string) => {
      const item = document.createElement("li");
      item.textContent = message;
      previewResults.append(item);
    };

    if (!previewUrl.validity.valid) {
      appendResult(chrome.i18n.getMessage("groupPreviewInvalid"));
      return;
    }

    const settings: GroupingSettings = {
      optIgnoreProtocol: optIgnoreProtocol.checked,
      optIgnoreWww: optIgnoreWww.checked,
      optIgnoreQuery: optIgnoreQuery.checked,
      optIgnoreHash: optIgnoreHash.checked,
      optDomainOnly: optDomainOnly.checked,
      optDisableWildcards: optDisableWildcards.checked,
    };

    for (const group of groups) {
      const patterns = matchingPatterns(url, group, settings);
      if (patterns.length === 0) continue;
      const key = previewResults.childElementCount
        ? "groupPreviewAlsoMatches"
        : "groupPreviewWinner";
      appendResult(
        chrome.i18n.getMessage(key, [group.name, patterns.join(", ")]),
      );
    }

    if (!previewResults.childElementCount) {
      appendResult(chrome.i18n.getMessage("groupPreviewNoMatch"));
    }
  };

  previewUrl.addEventListener("input", renderPreview);

  const updateGroups = (updatedGroups: TabGroup[]) => {
    if (JSON.stringify(updatedGroups) === JSON.stringify(groups)) return;
    groups = updatedGroups;
    renderGroups();
    renderPreview();
  };

  const saveGroups = () => {
    renderPreview();
    const snapshot = groups.map((group) => ({ ...group }));
    groupSavePending = true;
    const save = groupSave.then(async () => {
      try {
        await chrome.storage.local.set({ groups: snapshot });
      } catch (error) {
        console.error("Failed to save groups", error);
        alert(chrome.i18n.getMessage("groupSaveFailed"));
      }

      if (groupSave !== save) return;
      try {
        const saved = await chrome.storage.local.get<{ groups?: TabGroup[] }>(
          "groups",
        );
        if (groupSave === save) updateGroups(saved.groups ?? []);
      } catch (error) {
        console.error("Failed to load groups", error);
      } finally {
        if (groupSave === save) groupSavePending = false;
      }
    });
    groupSave = save;
  };

  function renderGroups() {
    const scrollTop = groupList.scrollTop;
    groupList.innerHTML = "";
    groups.forEach((g, idx) => {
      const li = document.createElement("li");
      li.className = "group-row";

      const colorSel = document.createElement("select");
      colorSel.className = "color-select";
      colorSel.setAttribute("aria-label", chrome.i18n.getMessage("groupColor"));
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
        colorSel.style.borderLeftColor = colorSel.value;
        saveGroups();
      });

      const nameInp = document.createElement("input");
      nameInp.className = "group-name";
      nameInp.value = g.name;
      nameInp.placeholder = phGroupName;
      nameInp.setAttribute("aria-label", phGroupName);
      nameInp.addEventListener("change", () => {
        nameInp.value = nameInp.value.trim();
        groups[idx].name = nameInp.value;
        saveGroups();
      });

      const patInp = document.createElement("input");
      patInp.className = "group-patterns";
      patInp.value = g.patterns.join(" ");
      patInp.placeholder = phPatterns;
      patInp.setAttribute(
        "aria-label",
        chrome.i18n.getMessage("groupPatterns"),
      );
      const ruleError = document.createElement("p");
      ruleError.className = "rule-error";
      ruleError.id = `group-rule-error-${idx}`;
      ruleError.setAttribute("role", "status");
      patInp.setAttribute("aria-describedby", ruleError.id);
      const readPatterns = () =>
        patInp.value.trim().split(/\s+/).filter(Boolean);
      const updatePatternError = () => {
        const invalidRule =
          g.matchTarget === "rules"
            ? readPatterns().find((pattern) => !parseGroupingRule(pattern))
            : undefined;
        ruleError.hidden = invalidRule === undefined;
        ruleError.textContent =
          invalidRule === undefined
            ? ""
            : chrome.i18n.getMessage("groupRuleInvalid", invalidRule);
        patInp.setAttribute("aria-invalid", String(invalidRule !== undefined));
      };
      updatePatternError();
      patInp.addEventListener("input", updatePatternError);
      patInp.addEventListener("change", () => {
        g.patterns = readPatterns();
        saveGroups();
      });

      const matchTarget = document.createElement("select");
      matchTarget.className = "match-target";
      matchTarget.setAttribute(
        "aria-label",
        chrome.i18n.getMessage("groupMatchTarget"),
      );
      matchTarget.add(
        new Option(chrome.i18n.getMessage("groupMatchDefault"), ""),
      );
      matchTarget.add(
        new Option(chrome.i18n.getMessage("groupMatchHostname"), "hostname"),
      );
      matchTarget.add(
        new Option(chrome.i18n.getMessage("groupMatchUrl"), "url"),
      );
      matchTarget.add(
        new Option(chrome.i18n.getMessage("groupMatchRules"), "rules"),
      );
      matchTarget.value = g.matchTarget ?? "";
      matchTarget.addEventListener("change", () => {
        switch (matchTarget.value) {
          case "hostname":
          case "url":
          case "rules":
            g.matchTarget = matchTarget.value;
            break;
          default:
            delete g.matchTarget;
        }
        updatePatternError();
        saveGroups();
      });

      const actions = document.createElement("div");
      actions.className = "group-actions";
      const addMoveButton = (
        direction: -1 | 1,
        glyph: string,
        message: string,
      ) => {
        const button = document.createElement("button");
        const nextIndex = idx + direction;
        const label = chrome.i18n.getMessage(message);
        button.className = direction === -1 ? "move-up" : "move-down";
        button.textContent = glyph;
        button.title = label;
        button.setAttribute("aria-label", label);
        button.disabled = nextIndex < 0 || nextIndex >= groups.length;
        button.addEventListener("click", () => {
          [groups[idx], groups[nextIndex]] = [groups[nextIndex], groups[idx]];
          renderGroups();
          const movedRow = groupList.children[nextIndex];
          const moveButton = movedRow.querySelector<HTMLButtonElement>(
            `.${button.className}:enabled`,
          );
          const availableButton = movedRow.querySelector<HTMLButtonElement>(
            ".group-actions button:enabled",
          );
          (moveButton ?? availableButton)?.focus({ preventScroll: true });
          movedRow.scrollIntoView({ block: "nearest" });
          saveGroups();
        });
        actions.append(button);
      };
      addMoveButton(-1, "↑", "groupMoveUp");
      addMoveButton(1, "↓", "groupMoveDown");

      const del = document.createElement("button");
      del.textContent = "×";
      del.title = chrome.i18n.getMessage("groupRemove");
      del.setAttribute("aria-label", del.title);
      del.addEventListener("click", () => {
        groups.splice(idx, 1);
        renderGroups();
        saveGroups();
      });

      actions.append(del);
      li.append(colorSel, nameInp, actions, matchTarget, patInp, ruleError);
      groupList.append(li);
    });
    groupList.scrollTop = scrollTop;
  }

  addGroupBtn.addEventListener("click", () => {
    groups.push({
      name: "",
      patterns: [],
      color: "grey",
      matchTarget: "hostname",
    });
    renderGroups();
    groupList.lastElementChild?.querySelector("input")?.focus();
    saveGroups();
  });

  chrome.storage.local.get<{ groups?: TabGroup[] }>("groups", (res) => {
    updateGroups(res.groups ?? []);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.closedTabs) {
      closedTabs = (changes.closedTabs.newValue as ClosedTab[]) || [];
      renderClosedTabs();
    }
    if (changes.groups && !groupSavePending) {
      updateGroups((changes.groups.newValue as TabGroup[]) ?? []);
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
    if (changes.optGroupForeignTabs)
      optGroupForeignTabs.checked = changes.optGroupForeignTabs
        .newValue as boolean;
    renderPreview();
  });
});
