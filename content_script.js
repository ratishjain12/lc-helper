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

// Templates are now imported from templates.js

function generateTemplateResponse(problem) {
  const problemText = problem.contentText.toLowerCase();
  const title = problem.title.toLowerCase();
  const topics = problem.topicTags.map((t) => t.toLowerCase());

  // Keywords that suggest different patterns
  const slidingWindowKeywords = [
    "subarray",
    "substring",
    "window",
    "sum",
    "average",
    "minimum",
    "maximum",
    "consecutive",
    "continuous",
    "k elements",
    "size",
    "length",
  ];

  const twoPointersKeywords = [
    "sorted",
    "two sum",
    "three sum",
    "palindrome",
    "container",
    "water",
    "height",
    "area",
    "volume",
  ];

  const binarySearchKeywords = [
    "sorted",
    "search",
    "find",
    "position",
    "insert",
    "sqrt",
    "square root",
    "peak",
    "mountain",
    "rotated",
  ];

  const dfsKeywords = [
    "tree",
    "graph",
    "island",
    "matrix",
    "grid",
    "path",
    "traversal",
    "inorder",
    "preorder",
    "postorder",
    "clone",
    "word search",
  ];

  const bfsKeywords = [
    "level",
    "breadth",
    "shortest",
    "path",
    "distance",
    "ladder",
    "queue",
    "level order",
    "hierarchy",
  ];

  // Score each template based on keywords
  const scores = {
    "sliding-window": 0,
    "two-pointers": 0,
    "binary-search": 0,
    dfs: 0,
    bfs: 0,
  };

  // Check problem text
  slidingWindowKeywords.forEach((keyword) => {
    if (problemText.includes(keyword) || title.includes(keyword)) {
      scores["sliding-window"] += 1;
    }
  });

  twoPointersKeywords.forEach((keyword) => {
    if (problemText.includes(keyword) || title.includes(keyword)) {
      scores["two-pointers"] += 1;
    }
  });

  binarySearchKeywords.forEach((keyword) => {
    if (problemText.includes(keyword) || title.includes(keyword)) {
      scores["binary-search"] += 1;
    }
  });

  dfsKeywords.forEach((keyword) => {
    if (problemText.includes(keyword) || title.includes(keyword)) {
      scores["dfs"] += 1;
    }
  });

  bfsKeywords.forEach((keyword) => {
    if (problemText.includes(keyword) || title.includes(keyword)) {
      scores["bfs"] += 1;
    }
  });

  // Check topic tags
  topics.forEach((topic) => {
    if (topic.includes("array") || topic.includes("string")) {
      scores["sliding-window"] += 0.5;
      scores["two-pointers"] += 0.5;
    }
    if (topic.includes("binary search")) {
      scores["binary-search"] += 2;
    }
    if (topic.includes("tree") || topic.includes("graph")) {
      scores["dfs"] += 1;
      scores["bfs"] += 1;
    }
    if (topic.includes("breadth-first")) {
      scores["bfs"] += 2;
    }
    if (topic.includes("depth-first")) {
      scores["dfs"] += 2;
    }
  });

  // Get top 2-3 templates
  const sortedTemplates = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3);

  let response = `# Algorithmic Templates for "${problem.title}"\n\n`;

  if (sortedTemplates.length === 0) {
    response += `## No specific template detected\n\n`;
    response += `Based on the problem description, no specific algorithmic pattern was strongly detected. Here are all available templates:\n\n`;

    Object.entries(TEMPLATES).forEach(([key, template]) => {
      response += `### ${template.name}\n`;
      response += `${template.description}\n\n`;
      response += `**Examples:** ${template.examples.join(", ")}\n\n`;
      response += `\`\`\`javascript\n${template.code}\n\`\`\`\n\n`;
    });
  } else {
    response += `## Recommended Templates\n\n`;

    sortedTemplates.forEach(([templateKey, score]) => {
      const template = TEMPLATES[templateKey];
      response += `### ${template.name} (Relevance: ${score.toFixed(1)})\n`;
      response += `${template.description}\n\n`;
      response += `**Why this fits:** Based on keywords found in the problem.\n\n`;
      response += `**Examples:** ${template.examples.join(", ")}\n\n`;
      response += `\`\`\`javascript\n${template.code}\n\`\`\`\n\n`;
    });

    if (sortedTemplates.length < 3) {
      response += `## Other Available Templates\n\n`;
      Object.entries(TEMPLATES).forEach(([key, template]) => {
        if (!sortedTemplates.find(([k, _]) => k === key)) {
          response += `### ${template.name}\n`;
          response += `${template.description}\n\n`;
          response += `**Examples:** ${template.examples.join(", ")}\n\n`;
          response += `\`\`\`javascript\n${template.code}\n\`\`\`\n\n`;
        }
      });
    }
  }

  response += `## How to Use Templates\n\n`;
  response += `1. **Identify the pattern** that best fits your problem\n`;
  response += `2. **Adapt the template** by filling in the specific conditions and logic\n`;
  response += `3. **Handle edge cases** like empty arrays, single elements, etc.\n`;
  response += `4. **Test thoroughly** with the provided examples\n\n`;

  return response;
}

function createTemplateSelector() {
  return `
    <div class="template-selector">
      <div class="template-header">
        <h3>📋 Algorithm Templates</h3>
        <p class="muted">Choose a template and language, then copy to your LeetCode editor</p>
      </div>
      
      <div class="template-controls">
        <div class="select-wrapper">
          <select id="language-select">
            <option value="">Choose language...</option>
            ${Object.entries(TEMPLATE_LANGUAGES)
              .map(
                ([key, lang]) => `<option value="${key}">${lang.name}</option>`
              )
              .join("")}
          </select>
        </div>
        
        <div class="select-wrapper">
          <select id="template-select" disabled>
            <option value="">Choose template first...</option>
          </select>
        </div>
        
        <button id="copy-template" class="copy-btn" style="display: none;">
          <span class="copy-text">Copy to Editor</span>
          <span class="copy-icon">📋</span>
        </button>
      </div>
      
      <div id="template-description" class="template-description" style="display: none;"></div>
      
      <div class="template-code-container">
        <div class="code-header">
          <span class="code-label">Template Code</span>
          <span class="code-hint">Click to select all, Ctrl+C to copy</span>
        </div>
        <pre id="template-code" class="code-block">Select a language and template above to see the code...</pre>
      </div>
      
      <div class="template-categories">
        <h4>📚 Template Categories</h4>
        <div class="category-grid">
          ${Object.entries(TEMPLATE_CATEGORIES)
            .map(
              ([category, templateKeys]) =>
                `<div class="category-card">
              <h5>${category}</h5>
              <ul>
                ${templateKeys
                  .map((key) => {
                    const template = TEMPLATE_PATTERNS[key];
                    return `<li>${
                      template.name
                    } <span class="difficulty ${template.difficulty
                      .toLowerCase()
                      .replace("/", "-")}">${template.difficulty}</span></li>`;
                  })
                  .join("")}
              </ul>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

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
    case "template":
      return (
        base +
        "\n\nTask: Based on the problem description, suggest the most appropriate algorithmic template(s) from the available patterns. For each suggested template, explain why it fits this problem and provide the template code with comments on how to adapt it for this specific problem. Available templates: " +
        Object.keys(TEMPLATES)
          .map((key) => TEMPLATES[key].name)
          .join(", ")
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
          <button id="lc-toggle-options" title="Hide Options">▼</button>
          <button id="lc-minimize" title="Minimize Panel">—</button>
          <button id="lc-close" title="Close">×</button>
        </div>
      </header>
      <div class="body">
        <div class="msg muted">Pick an action below.</div>
      </div>
      <div class="buttons" id="options-buttons">
        <button data-mode="explain">Explain</button>
        <button class="secondary" data-mode="hint1">Hint 1</button>
        <button class="secondary" data-mode="hint2">Hint 2</button>
        <button class="secondary" data-mode="hint3">Hint 3</button>
        <button data-mode="strategy">Strategy</button>
        <button class="secondary" data-mode="edges">Edge cases</button>
        <button class="secondary" data-mode="complexity">Complexity</button>
        <button data-mode="template">Template</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const body = root.querySelector(".body");
  const buttons = root.querySelectorAll(".buttons button");
  const settingsBtn = root.querySelector("#lc-settings");
  const toggleOptionsBtn = root.querySelector("#lc-toggle-options");
  const minimizeBtn = root.querySelector("#lc-minimize");
  const closeBtn = root.querySelector("#lc-close");
  const optionsButtons = root.querySelector("#options-buttons");

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

  // Toggle options buttons visibility
  toggleOptionsBtn.addEventListener("click", () => {
    const isVisible = optionsButtons.style.display !== "none";

    if (isVisible) {
      // Hide options
      optionsButtons.style.display = "none";
      toggleOptionsBtn.textContent = "▲";
      toggleOptionsBtn.title = "Show Options";
    } else {
      // Show options - restore original grid layout
      optionsButtons.style.display = "grid";
      toggleOptionsBtn.textContent = "▼";
      toggleOptionsBtn.title = "Hide Options";
    }
  });

  // Toggle panel content visibility (minimize/maximize)
  minimizeBtn.addEventListener("click", () => {
    const isMinimized = body.style.display === "none";

    if (isMinimized) {
      // Maximize - show body and buttons
      body.style.display = "block";
      optionsButtons.style.display = "grid";
      minimizeBtn.textContent = "—";
      minimizeBtn.title = "Minimize Panel";
    } else {
      // Minimize - hide body and buttons
      body.style.display = "none";
      optionsButtons.style.display = "none";
      minimizeBtn.textContent = "+";
      minimizeBtn.title = "Maximize Panel";
    }
  });

  async function handle(mode) {
    body.innerHTML = `<div class="msg muted">Fetching problem…</div>`;
    try {
      const slug = getSlugFromUrl();
      const problem = await fetchProblemViaGraphQL(slug);

      if (mode === "template") {
        // Handle template mode with selector
        const templateSelector = createTemplateSelector();
        body.innerHTML = templateSelector;

        // Add event listeners for template selection
        const languageSelect = body.querySelector("#language-select");
        const templateSelect = body.querySelector("#template-select");
        const copyBtn = body.querySelector("#copy-template");
        const codeArea = body.querySelector("#template-code");
        const description = body.querySelector("#template-description");

        // Language selection handler
        languageSelect.addEventListener("change", () => {
          const selectedLanguage = languageSelect.value;

          if (selectedLanguage) {
            // Enable template select and populate with templates
            templateSelect.disabled = false;
            templateSelect.innerHTML =
              '<option value="">Choose a template...</option>';

            Object.entries(TEMPLATE_CATEGORIES).forEach(
              ([category, templateKeys]) => {
                const optgroup = document.createElement("optgroup");
                optgroup.label = category;

                templateKeys.forEach((key) => {
                  const template = TEMPLATE_PATTERNS[key];
                  const option = document.createElement("option");
                  option.value = key;
                  option.textContent = `${template.name} (${template.difficulty})`;
                  optgroup.appendChild(option);
                });

                templateSelect.appendChild(optgroup);
              }
            );
          } else {
            templateSelect.disabled = true;
            templateSelect.innerHTML =
              '<option value="">Choose template first...</option>';
            codeArea.textContent =
              "Select a language and template above to see the code...";
            copyBtn.style.display = "none";
            description.style.display = "none";
          }
        });

        // Template selection handler
        templateSelect.addEventListener("change", () => {
          const selectedLanguage = languageSelect.value;
          const selectedTemplateKey = templateSelect.value;
          const selectedTemplate = TEMPLATE_PATTERNS[selectedTemplateKey];

          // Remove active class from all category cards
          body.querySelectorAll(".category-card").forEach((card) => {
            card.classList.remove("active");
          });

          if (selectedLanguage && selectedTemplate) {
            // Load template content for selected language and pattern
            const templateContent = loadTemplateContent(
              selectedLanguage,
              selectedTemplateKey
            );
            codeArea.textContent = templateContent;
            copyBtn.style.display = "block";
            description.innerHTML = `
              <div class="template-desc">
                <strong>${selectedTemplate.name} (${
              TEMPLATE_LANGUAGES[selectedLanguage].name
            })</strong><br>
                ${selectedTemplate.description}<br>
                <small class="muted">Examples: ${
                  selectedTemplate.examples?.join(", ") || "Various problems"
                }</small>
              </div>
            `;
            description.style.display = "block";

            // Highlight the corresponding category card
            const categoryCards = body.querySelectorAll(".category-card");
            categoryCards.forEach((card) => {
              const categoryTitle = card.querySelector("h5").textContent;
              if (selectedTemplate.category === categoryTitle) {
                card.classList.add("active");
              }
            });
          } else {
            codeArea.textContent =
              "Select a language and template above to see the code...";
            copyBtn.style.display = "none";
            description.style.display = "none";
          }
        });

        copyBtn.addEventListener("click", () => {
          const code = codeArea.textContent;
          navigator.clipboard
            .writeText(code)
            .then(() => {
              const copyText = copyBtn.querySelector(".copy-text");
              const copyIcon = copyBtn.querySelector(".copy-icon");
              copyText.textContent = "Copied!";
              copyIcon.textContent = "✓";
              copyBtn.style.background =
                "linear-gradient(135deg, #22c55e, #16a34a)";
              setTimeout(() => {
                copyText.textContent = "Copy to Editor";
                copyIcon.textContent = "📋";
                copyBtn.style.background =
                  "linear-gradient(135deg, #22c55e, #16a34a)";
              }, 2000);
            })
            .catch(() => {
              // Fallback for older browsers
              codeArea.select();
              document.execCommand("copy");
              const copyText = copyBtn.querySelector(".copy-text");
              const copyIcon = copyBtn.querySelector(".copy-icon");
              copyText.textContent = "Copied!";
              copyIcon.textContent = "✓";
              setTimeout(() => {
                copyText.textContent = "Copy to Editor";
                copyIcon.textContent = "📋";
              }, 2000);
            });
        });

        // Add keyboard shortcut (Ctrl/Cmd + C) for copying
        document.addEventListener("keydown", (e) => {
          if (
            (e.ctrlKey || e.metaKey) &&
            e.key === "c" &&
            document.activeElement === codeArea
          ) {
            e.preventDefault();
            copyBtn.click();
          }
        });

        // Make category cards clickable
        const categoryCards = body.querySelectorAll(".category-card");
        categoryCards.forEach((card) => {
          card.addEventListener("click", () => {
            const categoryTitle = card.querySelector("h5").textContent;
            const templateKey = Object.keys(TEMPLATE_PATTERNS).find((key) => {
              const template = TEMPLATE_PATTERNS[key];
              return template.category === categoryTitle;
            });

            if (templateKey) {
              // If no language is selected, default to JavaScript
              if (!languageSelect.value) {
                languageSelect.value = "javascript";
                languageSelect.dispatchEvent(new Event("change"));
              }

              // Select the template
              templateSelect.value = templateKey;
              templateSelect.dispatchEvent(new Event("change"));
            }
          });
        });
      } else {
        // Handle other modes with AI
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
