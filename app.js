(function () {
  "use strict";

  const pathDescriptions = {
    starter: "<strong>First step:</strong> ask Claude to interview you, save your preferences, create one Project, and run one useful task.",
    office: "<strong>Office path:</strong> use Claude to read first, suggest changes second, and edit Word, PowerPoint, or Excel only after you approve.",
    creative: "<strong>Design path:</strong> turn a rough idea into Claude Design or an Artifact, then ask Claude to improve layout, clarity, and usefulness.",
    cowork: "<strong>Cowork path:</strong> choose a low-risk desktop task, give Claude the files or folder, review its approach, and monitor the handoff.",
    builder: "<strong>Code path:</strong> describe the change in plain English, ask Claude Code to inspect first, then make the smallest useful edit.",
    agent: "<strong>Agent path:</strong> define the repeatable job, the allowed actions, the safety checks, and the handoff before building anything."
  };

  const surfaceHints = {
    chat: "Claude Chat",
    project: "a Claude Project",
    artifact: "an Artifact",
    office: "Word, PowerPoint, or Excel",
    chrome: "Claude in Chrome",
    cowork: "Claude Cowork",
    mobile: "Claude on iOS",
    code: "Claude Code"
  };

  const outputHints = {
    useful: "a useful answer with a clear next step",
    email: "an email draft with subject line, body, and optional shorter version",
    document: "a structured document with headings, bullets, and a review checklist",
    slides: "a slide-by-slide outline with title, key point, and speaker note for each slide",
    spreadsheet: "a spreadsheet-friendly table, formula explanation, or analysis checklist",
    design: "a Claude Design or Artifact brief with layout, audience, and usability checks",
    decision: "a decision memo with options, tradeoffs, recommendation, and risks",
    code: "a small code change path with files to inspect, edit steps, and tests to run",
    agent: "an agent workflow brief with trigger, context, steps, allowed actions, checks, and handoff"
  };

  const missionData = {
    email: {
      title: "Email or message",
      surface: "Chat, mobile, or Word if the message comes from a document.",
      next: "Paste your messy thought, name the recipient, and ask for two versions.",
      prompt: `I need to write an email or message.

Recipient:
[WHO IT IS FOR]

Goal:
[WHAT I WANT TO HAPPEN]

Context:
[PASTE NOTES OR THE THREAD]

Please draft:
1. A clear version.
2. A warmer version.
3. A shorter version.

Use plain language. Do not invent facts. End with what I should verify before sending.`
    },
    document: {
      title: "Document",
      surface: "Word for document editing, Chat for drafting, or a Project for repeated document work.",
      next: "Ask Claude to explain what is already there before changing wording.",
      prompt: `Help me improve this document.

Goal:
[WHAT THE DOCUMENT NEEDS TO DO]

Audience:
[WHO WILL READ IT]

Text or notes:
[PASTE CONTENT]

First, summarize the document in plain language.
Then identify unclear, missing, or risky sections.
Then rewrite the highest-value section first.
Keep the structure easy to review.
End with a short checklist I can use before sharing.`
    },
    slides: {
      title: "Slides",
      surface: "PowerPoint when you have a deck open, or an Artifact when you need a quick visual draft.",
      next: "Start with the story and audience before asking for slide text.",
      prompt: `Help me create or improve slides.

Audience:
[WHO WILL SEE THE DECK]

Goal:
[WHAT THE DECK SHOULD ACCOMPLISH]

Source material:
[PASTE NOTES OR SUMMARY]

Create a slide-by-slide outline with:
- Slide title.
- Main point.
- Suggested visual.
- Speaker note.
- What I should verify.

Keep it simple enough for someone new to the topic.`
    },
    spreadsheet: {
      title: "Spreadsheet",
      surface: "Excel when the workbook is open, or Chat when you only need explanation.",
      next: "Ask Claude to explain the workbook before asking it to analyze or change anything.",
      prompt: `Help me understand this spreadsheet.

Goal:
[WHAT I NEED TO KNOW OR CREATE]

Workbook context:
[PASTE COLUMN NAMES, FORMULAS, OR A SMALL SAMPLE]

First, explain what the data appears to show.
Then identify formulas, columns, or assumptions I should check.
Then suggest the cleanest table, chart, formula, or analysis.
Do not guess missing values.
End with checks that could catch mistakes.`
    },
    design: {
      title: "Design",
      surface: "Artifact or Claude Design for one-pagers, prototypes, visual drafts, and presentation-style work.",
      next: "Tell Claude who will use it and what should be clear at first glance.",
      prompt: `Create a simple, useful design draft.

Thing to create:
[PAGE, ONE-PAGER, PROTOTYPE, VISUAL, OR PRESENTATION]

Audience:
[WHO WILL USE IT]

Job it must do:
[WHAT SHOULD BE CLEAR OR POSSIBLE]

Make it:
- Easy to understand at first glance.
- Practical, not decorative.
- Clear for a beginner.
- Simple to revise.

Before finalizing, critique the layout and improve the weakest part.`
    },
    research: {
      title: "Research",
      surface: "Chat for a quick answer, a Project for repeated research, or Chrome when the answer depends on a live webpage.",
      next: "Ask Claude to separate facts, interpretation, and what still needs checking.",
      prompt: `Help me research this topic.

Question:
[WHAT I NEED TO UNDERSTAND]

Context:
[WHY I NEED IT]

Sources I have:
[PASTE LINKS, NOTES, OR TEXT IF AVAILABLE]

Return:
1. The short answer.
2. Key facts.
3. What is uncertain or needs checking.
4. A beginner-friendly explanation.
5. A practical next step.

Do not make unsupported claims. Tell me what evidence would change the answer.`
    },
    browser: {
      title: "Website task",
      surface: "Claude in Chrome when you want help reading, navigating, comparing, or filling a website.",
      next: "Use low-risk tasks first and ask Claude to explain before acting.",
      prompt: `Help me with this website.

Goal:
[WHAT I AM TRYING TO DO]

Rules:
- Explain what you see before taking action.
- Ask before clicking anything that submits, deletes, posts, sends, changes settings, or shares information.
- Tell me when something looks risky or uncertain.
- Keep me in control of the final decision.

Start by giving me the safest next step.`
    },
    cowork: {
      title: "Cowork task",
      surface: "Claude Cowork when the work needs selected files, folders, desktop apps, or a longer task session.",
      next: "Start with a low-risk review and ask Claude to explain its approach before acting.",
      prompt: `Help me run this Claude Cowork task safely.

Goal:
[WHAT I WANT DONE]

Material Claude may use:
[FILES, FOLDERS, APPS, OR CONNECTORS]

Rules:
- Explain your approach before acting.
- Ask before changing, sending, deleting, posting, sharing, or opening sensitive material.
- Keep a short progress log.
- Stop if access, uncertainty, or risk is unclear.

Start by telling me the safest first action and what you need from me.`
    },
    meeting: {
      title: "Meeting prep",
      surface: "Chat or a Project if you prepare for similar meetings often.",
      next: "Give Claude the meeting goal, people involved, and notes you already have.",
      prompt: `Help me prepare for a meeting.

Meeting goal:
[WHAT I NEED FROM THE MEETING]

People involved:
[WHO WILL BE THERE]

Context:
[PASTE NOTES, EMAILS, OR BACKGROUND]

Create:
1. A short briefing.
2. The five most important talking points.
3. Questions I should ask.
4. Decisions or follow-ups to capture.
5. A simple opening message.

Keep it practical and easy to scan.`
    },
    code: {
      title: "Code help",
      surface: "Claude Code for repository work, or Chat for learning a concept before editing.",
      next: "Describe the change plainly and ask Claude to inspect before editing.",
      prompt: `Help me with this codebase in plain English.

Task:
[WHAT I WANT CHANGED OR EXPLAINED]

Before editing:
- Explain what the relevant part of the project does.
- Identify the files likely involved.
- Tell me the smallest useful change.

While working:
- Keep changes focused.
- Avoid unrelated cleanup.
- Run the relevant check if one exists.

Afterward, summarize what changed and what I should test.`
    },
    agent: {
      title: "Agent workflow",
      surface: "A Project for a repeatable personal workflow, Claude Code for repository automation, or the Agent SDK for a hosted agent.",
      next: "Describe the job, the trigger, allowed actions, review points, and what success looks like.",
      prompt: `Help me design an agentic workflow with Claude.

Workflow goal:
[WHAT THE AGENT SHOULD HELP WITH]

Trigger:
[WHEN IT SHOULD RUN OR WHEN I SHOULD START IT]

Inputs:
[FILES, WEBSITES, NOTES, ISSUES, OR MESSAGES IT CAN USE]

Allowed actions:
[WHAT IT MAY DO]

Actions that need my approval:
[WHAT IT MUST ASK BEFORE DOING]

Success looks like:
[WHAT A GOOD RESULT MEANS]

Return:
1. The simplest version I can try in Claude Chat or a Project.
2. The checks that prevent mistakes.
3. The handoff I should review.
4. What would need Claude Code, GitHub Actions, or the Agent SDK later.`
    }
  };

  const fixData = {
    vague: {
      title: "Too vague",
      next: "Use when Claude sounds reasonable but you still cannot act on the answer.",
      prompt: `Make your last answer specific enough that I can act on it today.

Revise it with:
1. Concrete steps.
2. Examples where helpful.
3. Clear decision points.
4. What I should do first.
5. What I should ignore for now.

Keep the language simple.`
    },
    wrong: {
      title: "Possibly wrong",
      next: "Use when a fact, assumption, calculation, or interpretation may be incorrect.",
      prompt: `Review your last answer for possible errors.

Do not defend the answer.
Compare each important claim to the context I provided.

Return:
1. What might be wrong.
2. What information is missing.
3. What needs checking.
4. A corrected answer that separates confirmed facts from uncertainty.`
    },
    long: {
      title: "Too long",
      next: "Use when the answer is useful but too hard to scan.",
      prompt: `Shorten your last answer.

Give me:
1. The shortest useful version.
2. The three details I should not miss.
3. One optional deeper section only if it truly helps.

Remove repetition and background that does not change what I should do.`
    },
    technical: {
      title: "Too technical",
      next: "Use when the answer assumes too much background knowledge.",
      prompt: `Rewrite your last answer for a beginner.

Rules:
- Use everyday language.
- Define any necessary term in one sentence.
- Replace jargon with examples.
- Keep the steps practical.
- Tell me what matters first.

Do not talk down to me. Make it clear and usable.`
    },
    format: {
      title: "Wrong format",
      next: "Use when the content is good but the shape is not useful.",
      prompt: `Reformat your last answer into this structure:

[PASTE THE FORMAT YOU WANT: table, checklist, email, memo, slides, steps, or bullets]

Keep only the content that supports that format.
Use clear headings.
Make it easy to copy, review, and reuse.`
    },
    stuck: {
      title: "Needs questions",
      next: "Use when Claude needs more context but did not ask for it.",
      prompt: `Pause and ask me the questions that would most improve your answer.

Ask no more than three questions.
For each question, explain why it matters in one short phrase.
After I answer, produce the improved version without restarting from scratch.`
    },
    evidence: {
      title: "Weak evidence",
      next: "Use when facts matter and you need to know what the answer rests on.",
      prompt: `Strengthen the evidence in your last answer.

Separate:
1. Confirmed facts from the material I provided.
2. Reasonable inferences.
3. Claims that need checking.
4. Questions I should verify before relying on this.

If you cannot verify something from the provided material, say so plainly.`
    },
    action: {
      title: "Not actionable",
      next: "Use when the answer explains the topic but does not help you move.",
      prompt: `Turn your last answer into an action checklist.

For each item, include:
- The action.
- Why it matters.
- What good completion looks like.
- The next prompt I should use if I need help.

Put the first action at the top.`
    },
    tone: {
      title: "Tone is off",
      next: "Use when the answer is too stiff, too casual, too forceful, or not right for the audience.",
      prompt: `Rewrite your last answer for this audience:
[AUDIENCE]

Tone:
[WARM, DIRECT, EXECUTIVE, BEGINNER-FRIENDLY, CAREFUL, OR OTHER]

Keep the meaning, improve the wording, and remove anything that sounds unnatural.
Give me one polished version and one shorter version.`
    }
  };

  const tabs = Array.from(document.querySelectorAll(".path-tab"));
  const output = document.getElementById("path-output");
  const roughPrompt = document.getElementById("rough-prompt");
  const optimizedPrompt = document.getElementById("optimized-prompt");
  const surfaceButtons = Array.from(document.querySelectorAll("[data-surface]"));
  const outputButtons = Array.from(document.querySelectorAll("[data-output]"));
  const missionButtons = Array.from(document.querySelectorAll("[data-mission]"));
  const missionTitle = document.getElementById("mission-output-title");
  const missionSurface = document.getElementById("mission-surface");
  const missionNext = document.getElementById("mission-next");
  const missionPrompt = document.getElementById("mission-prompt");
  const fixButtons = Array.from(document.querySelectorAll("[data-fix]"));
  const fixTitle = document.getElementById("fix-output-title");
  const fixNext = document.getElementById("fix-next");
  const fixPrompt = document.getElementById("fix-prompt");
  let selectedSurface = "chat";
  let selectedOutput = "useful";

  function setPath(path) {
    tabs.forEach((tab) => {
      const active = tab.getAttribute("data-path") === path;
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (output) output.innerHTML = pathDescriptions[path] || pathDescriptions.starter;
  }

  function setActiveChoice(buttons, attribute, value) {
    buttons.forEach((button) => {
      const active = button.getAttribute(attribute) === value;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function copyTemplate(targetId, button) {
    if (!targetId) return;
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
    const outputType = outputHints[selectedOutput] || outputHints.useful;
    optimizedPrompt.value = `You are helping me use ${surface} effectively.

Task:
${task}

Preferred output:
${outputType}

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

  function setMission(mission) {
    const detail = missionData[mission] || missionData.email;
    setActiveChoice(missionButtons, "data-mission", mission);
    if (missionTitle) missionTitle.textContent = detail.title;
    if (missionSurface) missionSurface.innerHTML = `<strong>Best Claude surface:</strong> ${detail.surface}`;
    if (missionNext) missionNext.innerHTML = `<strong>Next move:</strong> ${detail.next}`;
    if (missionPrompt) missionPrompt.value = detail.prompt;
  }

  function setFix(fix) {
    const detail = fixData[fix] || fixData.vague;
    setActiveChoice(fixButtons, "data-fix", fix);
    if (fixTitle) fixTitle.textContent = detail.title;
    if (fixNext) fixNext.innerHTML = `<strong>Use when:</strong> ${detail.next}`;
    if (fixPrompt) fixPrompt.value = detail.prompt;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setPath(tab.getAttribute("data-path") || "starter"));
  });

  surfaceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedSurface = button.getAttribute("data-surface") || "chat";
      setActiveChoice(surfaceButtons, "data-surface", selectedSurface);
      buildOptimizedPrompt();
    });
  });

  outputButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedOutput = button.getAttribute("data-output") || "useful";
      setActiveChoice(outputButtons, "data-output", selectedOutput);
      buildOptimizedPrompt();
    });
  });

  missionButtons.forEach((button) => {
    button.addEventListener("click", () => setMission(button.getAttribute("data-mission") || "email"));
  });

  fixButtons.forEach((button) => {
    button.addEventListener("click", () => setFix(button.getAttribute("data-fix") || "vague"));
  });

  if (roughPrompt) roughPrompt.addEventListener("input", buildOptimizedPrompt);

  Array.from(document.querySelectorAll(".copy")).forEach((button) => {
    button.addEventListener("click", () => copyTemplate(button.getAttribute("data-copy-target"), button));
  });

  setActiveChoice(surfaceButtons, "data-surface", selectedSurface);
  setActiveChoice(outputButtons, "data-output", selectedOutput);
  buildOptimizedPrompt();
  setMission("email");
  setFix("vague");
})();
