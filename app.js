(function () {
  "use strict";

  const pathDescriptions = {
    beginner: "<strong>Beginner path:</strong> finish Day 0, create one Project, run the core prompt loop, and save your best prompt.",
    professional: "<strong>Professional path:</strong> set account instructions, build a Project for one weekly workflow, add only trusted files, and test the output checklist.",
    researcher: "<strong>Researcher path:</strong> create a source-grounded Project, upload a small evidence set, use the accuracy guard, and separate confirmed facts from inference.",
    developer: "<strong>Developer path:</strong> install Claude Code only after the chat workflow is clear, add repository instructions, require a plan before edits, and run tests after changes."
  };

  const storageKey = "claude-site:mastery-progress:v1";
  const tabs = Array.from(document.querySelectorAll(".path-tab"));
  const output = document.getElementById("path-output");
  const checks = Array.from(document.querySelectorAll("[data-checklist] input[type='checkbox']"));
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const resetButton = document.getElementById("reset-progress");

  function setPath(path) {
    tabs.forEach((tab) => {
      const active = tab.getAttribute("data-path") === path;
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (output) output.innerHTML = pathDescriptions[path] || pathDescriptions.beginner;
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

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setPath(tab.getAttribute("data-path") || "beginner"));
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

  Array.from(document.querySelectorAll(".copy")).forEach((button) => {
    button.addEventListener("click", () => copyTemplate(button.getAttribute("data-copy-target"), button));
  });

  loadProgress();
})();
