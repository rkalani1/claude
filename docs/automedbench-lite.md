# AutoMedBench-Lite for Claude Workflows

Use this page as a teaching aid when Claude is asked to complete multi-step medical, research, evidence, or regulated-domain work.

This is not a medical benchmark harness. It is a lightweight prompt and review pattern that helps users notice whether Claude planned, set up, validated, executed, and submitted a task responsibly.

## S1-S5 Prompt Pattern

```text
Use an AutoMedBench-Lite workflow for this task.

S1 Plan: state the objective, scope, assumptions, risks, and stop conditions.
S2 Setup: identify sources, files, tools, constraints, and data boundaries.
S3 Validate: perform concrete source, privacy, format, edge-case, and contradiction checks.
S4 Execute: complete the scoped task after validation planning.
S5 Submit: return the final artifact with provenance, validation status, residual risk, and next action.

Use only public, synthetic, or de-identified examples. Do not make clinical, regulatory, or operational claims beyond the provided sources. Stop if validation cannot be completed.
```

## Best Uses

- Evidence updates.
- Research methods text.
- Clinical education content.
- Agent/tool workflow review.
- Repo changes that need source and format validation.

## Do Not Use For

- Patient care decisions.
- Diagnosis or treatment recommendations.
- Handling PHI or confidential institutional data.
- Claiming that a public demo is clinically validated or officially approved.

## Quick Review Rubric

| Stage | Pass question |
|---|---|
| S1 Plan | Did Claude state the task, risks, scope, and stop conditions? |
| S2 Setup | Did it identify the right sources, files, tools, and data boundary? |
| S3 Validate | Did it run or specify real checks before trusting the output? |
| S4 Execute | Did it keep the work scoped and preserve safety language? |
| S5 Submit | Did it include provenance, validation status, residual risk, and next action? |
