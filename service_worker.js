// service_worker.js (MV3, type: "module")

/* ============================
   Storage helpers
============================ */
const DEFAULTS = {
  geminiKey: "",
  geminiModel: "gemini-1.5-flash-latest",
  temperature: 0.3,
};

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, (data) => resolve(data || DEFAULTS));
  });
}

async function callGemini({ system, user }) {
  const { geminiKey, geminiModel, temperature } = await getSettings();
  if (!geminiKey) {
    throw new Error(
      "Missing Gemini API key. Open the extension Options and save your key."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    geminiModel
  )}:generateContent?key=${encodeURIComponent(geminiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: system || "" }] },
    contents: [{ role: "user", parts: [{ text: user || "" }] }],
    generationConfig: {
      temperature: Number.isFinite(temperature) ? temperature : 0.3,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${t.slice(0, 500)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((p) => p.text || "")
    .join("")
    .trim();
  if (!text)
    throw new Error(
      "Gemini returned no text (possibly blocked by safety settings)."
    );

  return text;
}

/* ============================
     Options opener
  ============================ */
function openOptions() {
  return new Promise((resolve, reject) => {
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage(() => {
        const err = chrome.runtime.lastError;
        if (err) {
          try {
            chrome.tabs.create(
              { url: chrome.runtime.getURL("options.html") },
              () => resolve({ ok: true, via: "tabs.create" })
            );
          } catch (e) {
            reject(err);
          }
        } else {
          resolve({ ok: true, via: "openOptionsPage" });
        }
      });
    } else {
      try {
        chrome.tabs.create({ url: chrome.runtime.getURL("options.html") }, () =>
          resolve({ ok: true, via: "tabs.create" })
        );
      } catch (e) {
        reject(e);
      }
    }
  });
}

/* ============================
     Message router
  ============================ */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (!msg || typeof msg !== "object") {
        sendResponse({ error: "Invalid message." });
        return;
      }

      if (msg.type === "OPEN_OPTIONS") {
        try {
          const result = await openOptions();
          sendResponse(result);
        } catch (e) {
          sendResponse({ ok: false, error: String(e?.message || e) });
        }
        return;
      }

      if (msg.type === "ASK") {
        const { system, user } = msg.payload || {};
        const text = await callGemini({ system, user });
        sendResponse({ text });
        return;
      }

      // Unknown type
      sendResponse({ error: `Unknown message type: ${msg.type}` });
    } catch (e) {
      sendResponse({ error: String(e?.message || e) });
    }
  })();

  return true;
});

/* ============================
     Optional: install/update hook
  ============================ */
chrome.runtime.onInstalled.addListener(() => {
  // You could initialize defaults or migrate settings here if needed.
  // chrome.storage.sync.set(DEFAULTS);
});
