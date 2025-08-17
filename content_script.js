const log = (...a) => console.log("[LC Helper]", ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isProblemPage = () => /\/problems\//.test(location.pathname);

function getSlugFromUrl() {
  const m = location.pathname.match(/\/problems\/([^/]+)/);
  return m ? m[1] : null;
}

function htmlToText(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  d.querySelectorAll("code, pre, script, style").forEach((n) => n.remove());
  const text = (d.innerText || d.textContent || "").trim();
  return text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n");
}

function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function splitTableRow(raw) {
  // split by pipes, trim cells, drop leading/trailing empties from leading/ending |
  const cells = raw.split("|").map((c) => c.trim());
  if (cells.length && cells[0] === "") cells.shift();
  if (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}
function parseTables(escapedText) {
  const lines = escapedText.split("\n");
  const out = [];
  let i = 0;

  const isSep = (ln) =>
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(ln || "");

  while (i < lines.length) {
    const hdr = lines[i];
    const sep = lines[i + 1];

    if (hdr && hdr.includes("|") && isSep(sep)) {
      // collect table block
      const bodyLines = [];
      i += 2;
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim() !== ""
      ) {
        bodyLines.push(lines[i]);
        i++;
      }

      // build table HTML
      const headers = splitTableRow(hdr);
      const aligns = splitTableRow(sep).map((s) => {
        const left = /^\s*:/.test(s);
        const right = /:\s*$/.test(s);
        if (left && right) return "center";
        if (right) return "right";
        return "left";
      });

      const thead =
        "<thead><tr>" +
        headers
          .map(
            (h, idx) =>
              `<th style="text-align:${aligns[idx] || "left"}">${h}</th>`
          )
          .join("") +
        "</tr></thead>";

      const tbody =
        "<tbody>" +
        bodyLines
          .map((ln) => {
            const cells = splitTableRow(ln);
            return (
              "<tr>" +
              cells
                .map(
                  (c, idx) =>
                    `<td style="text-align:${aligns[idx] || "left"}">${c}</td>`
                )
                .join("") +
              "</tr>"
            );
          })
          .join("") +
        "</tbody>";

      out.push(`<table class="md-table">${thead}${tbody}</table>`);
      continue;
    }

    out.push(hdr);
    i++;
  }
  return out.join("\n");
}

function renderMarkdown(md = "") {
  let text = md.replace(/\r\n?/g, "\n");

  const blocks = [];
  text = text.replace(
    /```(\w+)?\n([\s\S]*?)\n```/g,
    (_, lang = "", code = "") => {
      const id = blocks.push({ lang: lang.trim(), code }) - 1;
      return `\uE000${id}\uE001`;
    }
  );

  text = escapeHTML(text);

  text = parseTables(text);

  text = text
    .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");

  text = text.replace(/^\s*---\s*$/gm, "<hr>");

  text = text.replace(/(^|\n)(?:> ?(.*)(?:\n|$))+?/g, (m) => {
    const lines = m
      .split("\n")
      .map((l) => l.replace(/^> ?/, "").trim())
      .filter(Boolean);
    return `\n<blockquote>${lines.join("<br>")}</blockquote>\n`;
  });

  text = text.replace(/(?:^|\n)((?:[-*] .*(?:\n|$))+)/g, (_m, block) => {
    const items = block
      .trim()
      .split("\n")
      .filter((l) => /^[-*] /.test(l))
      .map((l) => `<li>${l.replace(/^[-*] +/, "")}</li>`)
      .join("");
    return `\n<ul>${items}</ul>\n`;
  });
  text = text.replace(/(?:^|\n)((?:(?:\d+)\. .*(?:\n|$))+)/g, (_m, block) => {
    const items = block
      .trim()
      .split("\n")
      .filter((l) => /^\d+\. /.test(l))
      .map((l) => `<li>${l.replace(/^\d+\. +/, "")}</li>`)
      .join("");
    return `\n<ol>${items}</ol>\n`;
  });

  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener">$1</a>`
  );

  text = text
    .split(/\n{2,}/)
    .map((chunk) =>
      /<(h\d|ul|ol|blockquote|hr|table|pre)/.test(chunk.trim())
        ? chunk
        : `<p>${chunk.trim()}</p>`
    )
    .join("\n");

  text = text.replace(/\uE000(\d+)\uE001/g, (_m, i) => {
    const { lang, code } = blocks[Number(i)] || { lang: "", code: "" };
    return `<pre><code class="language-${lang}">${escapeHTML(
      code
    )}</code></pre>`;
  });

  return text;
}

async function fetchProblemViaGraphQL(slug) {
  if (!slug) throw new Error("No problem slug found in URL.");
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        difficulty
        content
        topicTags { name }
      }
    }
  `;
  const res = await fetch("/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { titleSlug: slug } }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`GraphQL ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const q = data?.data?.question;
  if (!q)
    throw new Error(
      "Problem not available via GraphQL (login or premium required)."
    );
  return {
    title: q.title,
    difficulty: q.difficulty || "Unknown",
    contentText: htmlToText(q.content || "").slice(0, 8000),
    topicTags: (q.topicTags || []).map((t) => t.name),
    url: location.href,
    slug,
  };
}

const SYSTEM_PROMPT = `
You are a LeetCode helper.
Your job:
- Explain the problem in simple English with a tiny illustrative example.
- Provide progressive hints on request (Hint 1 = mild nudge; Hint 2 = stronger; Hint 3 = near-solution reasoning).
- When asked, offer likely patterns/strategies, list edge cases with a short test plan, and state typical time/space complexity.
Rules:
- Do NOT output code unless the user explicitly asks for "code" or "solution".
- Keep answers concise and focused on the requested button.
`.trim();

function makeUserPrompt(mode, p) {
  const base = `
Problem: ${p.title} (${p.difficulty})
URL: ${p.url}
Topics: ${p.topicTags.join(", ") || "Unknown"}
Statement (plain text, trimmed):
${p.contentText}
`.trim();

  switch (mode) {
    case "explain":
      return (
        base +
        "\n\nTask: Explain the problem clearly for a beginner. Add a tiny example and clarify inputs/outputs and constraints."
      );
    case "hint1":
      return (
        base + "\n\nTask: Give Hint 1 only. Mild nudge. No spoilers, no code."
      );
    case "hint2":
      return base + "\n\nTask: Give Hint 2. Stronger nudge. Still no code.";
    case "hint3":
      return (
        base +
        "\n\nTask: Give Hint 3. Near-solution reasoning but still no code."
      );
    case "strategy":
      return (
        base +
        "\n\nTask: Propose likely solution strategies/patterns and compare tradeoffs briefly. No code."
      );
    case "edges":
      return (
        base + "\n\nTask: List edge cases and a short test plan (3–6 cases)."
      );
    case "complexity":
      return (
        base +
        "\n\nTask: State typical time/space complexity for the main strategy and why."
      );
    default:
      return base;
  }
}

function createPanel() {
  if (document.getElementById("lc-helper")) return;

  const root = document.createElement("div");
  root.id = "lc-helper";
  root.innerHTML = `
    <div class="card">
      <header>
        <div class="title">LeetCode Helper</div>
        <div class="actions">
          <button id="lc-settings" title="Settings">⚙</button>
          <button id="lc-collapse" title="Collapse">—</button>
          <button id="lc-close" title="Close">×</button>
        </div>
      </header>
      <div class="body">
        <div class="msg muted">Pick an action below.</div>
      </div>
      <div class="buttons">
        <button data-mode="explain">Explain</button>
        <button class="secondary" data-mode="hint1">Hint 1</button>
        <button class="secondary" data-mode="hint2">Hint 2</button>
        <button class="secondary" data-mode="hint3">Hint 3</button>
        <button data-mode="strategy">Strategy</button>
        <button class="secondary" data-mode="edges">Edge cases</button>
        <button class="secondary" data-mode="complexity">Complexity</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector(".body");
  const buttons = root.querySelectorAll(".buttons button");
  const settingsBtn = root.querySelector("#lc-settings");
  const collapseBtn = root.querySelector("#lc-collapse");
  const closeBtn = root.querySelector("#lc-close");

  settingsBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const res = await chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
      if (!res?.ok)
        window.open(
          chrome.runtime.getURL("options.html"),
          "_blank",
          "noopener"
        );
    } catch {
      window.open(chrome.runtime.getURL("options.html"), "_blank", "noopener");
    }
  });

  async function handle(mode) {
    body.innerHTML = `<div class="msg muted">Fetching problem…</div>`;
    try {
      const slug = getSlugFromUrl();
      const problem = await fetchProblemViaGraphQL(slug);

      body.innerHTML = `<div class="msg muted">Thinking…</div>`;
      const resp = await chrome.runtime.sendMessage({
        type: "ASK",
        payload: {
          system: SYSTEM_PROMPT,
          user: makeUserPrompt(mode, problem),
        },
      });

      if (resp?.error) {
        body.innerHTML = `<div class="msg">Error: ${resp.error}</div>`;
      } else {
        // Render markdown nicely
        const html = renderMarkdown(resp.text || "");
        body.innerHTML = `<div class="msg markdown">${html}</div>`;
      }
    } catch (e) {
      body.innerHTML = `<div class="msg">Failed: ${
        e && e.message ? e.message : e
      }</div>`;
    }
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => handle(b.dataset.mode))
  );

  collapseBtn.addEventListener("click", () => {
    const hidden = root.dataset.collapsed === "1";
    root.dataset.collapsed = hidden ? "0" : "1";
    root.querySelector(".body").style.display = hidden ? "block" : "none";
    root.querySelector(".buttons").style.display = hidden ? "grid" : "none";
    collapseBtn.textContent = hidden ? "—" : "+";
  });

  closeBtn.addEventListener("click", () => destroyPanel());

  log("panel mounted");
}

function destroyPanel() {
  const el = document.getElementById("lc-helper");
  if (el) el.remove();
}

function ensurePanel() {
  if (isProblemPage()) createPanel();
  else destroyPanel();
}

(function patchHistory() {
  const fire = () => window.dispatchEvent(new Event("lc:urlchange"));
  ["pushState", "replaceState"].forEach((fn) => {
    const orig = history[fn];
    history[fn] = function (...args) {
      const ret = orig.apply(this, args);
      fire();
      return ret;
    };
  });
  window.addEventListener("popstate", fire);
})();

(function observePathname() {
  let last = location.pathname;
  const obs = new MutationObserver(() => {
    if (location.pathname !== last) {
      last = location.pathname;
      window.dispatchEvent(new Event("lc:urlchange"));
    }
  });
  obs.observe(document, { childList: true, subtree: true });
})();

window.addEventListener("lc:urlchange", () => setTimeout(ensurePanel, 300));

wait(300).then(ensurePanel);
