// options.js — robust + MV3-safe
const defaults = {
  geminiKey: "",
  geminiModel: "gemini-1.5-flash-latest",
  temperature: 0.3,
};

function getSettings() {
  return new Promise((resolve, reject) => {
    if (!chrome || !chrome.storage || !chrome.storage.sync)
      return reject(new Error("Not in extension context"));
    chrome.storage.sync.get(defaults, (data) => resolve(data));
  });
}
function setSettings(values) {
  return new Promise((resolve, reject) => {
    if (!chrome || !chrome.storage || !chrome.storage.sync)
      return reject(new Error("Not in extension context"));
    chrome.storage.sync.set(values, () => resolve());
  });
}

function qs(id) {
  return document.getElementById(id);
}

const els = {
  key: qs("geminiKey"),
  toggleKey: qs("toggleKey"),
  model: qs("geminiModel"),
  temp: qs("temperature"),
  save: qs("save"),
  reset: qs("reset"),
  openLC: qs("openLeetCode"),
  status: qs("status"),
  warn: qs("notExtensionWarning"),
};

function setStatus(msg) {
  if (!els.status) return;
  els.status.textContent = msg || "";
  if (msg) setTimeout(() => (els.status.textContent = ""), 1600);
}

async function load() {
  try {
    const s = await getSettings();
    if (els.warn) els.warn.style.display = "none";
    if (els.key) els.key.value = s.geminiKey || "";
    if (els.model) els.model.value = s.geminiModel || defaults.geminiModel;
    if (els.temp)
      els.temp.value = Number.isFinite(s.temperature)
        ? s.temperature
        : defaults.temperature;
  } catch (err) {
    // Opened as a normal web page (chrome.* unavailable)
    if (els.warn) els.warn.style.display = "block";
  }
}

function wireEvents() {
  if (els.save) {
    els.save.addEventListener("click", async () => {
      try {
        const geminiKey = (els.key?.value || "").trim();
        const geminiModel = els.model?.value || defaults.geminiModel;
        const temperature = Math.min(
          1,
          Math.max(0, Number(els.temp?.value || defaults.temperature))
        );
        await setSettings({ geminiKey, geminiModel, temperature });
        setStatus("Saved!");
      } catch (e) {
        setStatus("Failed to save (open via extension options).");
      }
    });
  }

  if (els.reset) {
    els.reset.addEventListener("click", async () => {
      try {
        await setSettings(defaults);
        await load();
        setStatus("Defaults restored.");
      } catch {
        setStatus("Failed (open via extension options).");
      }
    });
  }

  if (els.openLC) {
    els.openLC.addEventListener("click", () => {
      window.open(
        "https://leetcode.com/problems/two-sum/",
        "_blank",
        "noopener"
      );
    });
  }

  if (els.toggleKey) {
    els.toggleKey.addEventListener("click", () => {
      if (!els.key) return;
      const isPwd = els.key.type === "password";
      els.key.type = isPwd ? "text" : "password";
      els.toggleKey.textContent = isPwd ? "Hide" : "Show";
      els.toggleKey.setAttribute("aria-pressed", String(isPwd));
      els.toggleKey.setAttribute(
        "aria-label",
        isPwd ? "Hide API key" : "Show API key"
      );
    });
  }
}

function init() {
  wireEvents();
  load();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
