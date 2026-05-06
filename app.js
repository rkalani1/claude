(function () {
  "use strict";

  const pathDescriptions = {
    starter: "<strong>First hour:</strong> ask Claude to interview you, save your preferences, create one Project, and run one useful task.",
    office: "<strong>Office path:</strong> use Claude to read first, suggest changes second, and edit Word, PowerPoint, or Excel only after you approve.",
    creative: "<strong>Design path:</strong> turn a rough idea into an Artifact, then ask Claude to improve layout, clarity, and usefulness.",
    builder: "<strong>Code path:</strong> describe the change in plain English, ask Claude Code to inspect first, then make the smallest useful edit."
  };

  const surfaceHints = {
    chat: "Claude Chat",
    project: "a Claude Project",
    artifact: "an Artifact",
    office: "Word, PowerPoint, or Excel",
    chrome: "Claude in Chrome",
    mobile: "Claude on iOS",
    code: "Claude Code"
  };

  const storageKey = "claude-site:mastery-progress:v2";
  const tabs = Array.from(document.querySelectorAll(".path-tab"));
  const output = document.getElementById("path-output");
  const checks = Array.from(document.querySelectorAll("[data-checklist] input[type='checkbox']"));
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const resetButton = document.getElementById("reset-progress");
  const roughPrompt = document.getElementById("rough-prompt");
  const optimizedPrompt = document.getElementById("optimized-prompt");
  const surfaceButtons = Array.from(document.querySelectorAll("[data-surface]"));
  let selectedSurface = "chat";

  function setPath(path) {
    tabs.forEach((tab) => {
      const active = tab.getAttribute("data-path") === path;
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (output) output.innerHTML = pathDescriptions[path] || pathDescriptions.starter;
  }

  function readProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeProgress(progress) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Storage can fail in private browsing; the page still works for the current session.
    }
  }

  function updateProgress() {
    const total = checks.length;
    const complete = checks.filter((item) => item.checked).length;
    const percent = total ? Math.round((complete / total) * 100) : 0;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${complete} of ${total} complete`;
  }

  function loadProgress() {
    const progress = readProgress();
    checks.forEach((item) => {
      item.checked = Boolean(progress[item.value]);
    });
    updateProgress();
  }

  function saveProgress() {
    const progress = {};
    checks.forEach((item) => {
      progress[item.value] = item.checked;
    });
    writeProgress(progress);
    updateProgress();
  }

  function copyTemplate(targetId, button) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const original = button.textContent;
    const textarea = document.createElement("textarea");
    textarea.value = target.value || target.textContent || "";
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      button.textContent = "Copied";
    } catch {
      target.focus();
      target.select();
      button.textContent = "Selected";
    } finally {
      document.body.removeChild(textarea);
    }

    window.setTimeout(() => {
      button.textContent = original;
    }, 1400);
  }

  function buildOptimizedPrompt() {
    if (!optimizedPrompt) return;
    const task = (roughPrompt && roughPrompt.value.trim()) || "Help me complete this task clearly and well.";
    const surface = surfaceHints[selectedSurface] || surfaceHints.chat;
    optimizedPrompt.value = `You are helping me use ${surface} effectively.

Task:
${task}

Before answering:
1. Restate the goal in one sentence.
2. Ask up to three questions only if you truly need more context.
3. If you have enough context, start the work.

Output rules:
- Start with the useful answer, not a long explanation.
- Use plain language.
- Use headings, bullets, or a table when that makes the result easier to use.
- Flag uncertainty instead of guessing.
- Tell me what I should review before I rely on the result.

After the answer:
- Give me one improved version of this prompt for next time.
- Suggest the best Claude surface for repeating this workflow.`;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setPath(tab.getAttribute("data-path") || "starter"));
  });

  checks.forEach((item) => {
    item.addEventListener("change", saveProgress);
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      checks.forEach((item) => {
        item.checked = false;
      });
      writeProgress({});
      updateProgress();
    });
  }

  surfaceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedSurface = button.getAttribute("data-surface") || "chat";
      surfaceButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      buildOptimizedPrompt();
    });
  });

  if (roughPrompt) roughPrompt.addEventListener("input", buildOptimizedPrompt);

  Array.from(document.querySelectorAll(".copy")).forEach((button) => {
    button.addEventListener("click", () => copyTemplate(button.getAttribute("data-copy-target"), button));
  });

  loadProgress();
  buildOptimizedPrompt();
})();
