---
name: free-triager
description: Evidence-based bug bounty report triage against live program rules, scope, known issues, exploitability, PoC requirements, and submission standards. Use when a researcher wants to reduce rejection risk before submitting or revising a vulnerability report.
---

# Free Triager

Triage a vulnerability report as a strict but constructive pre-submission reviewer. Minimize avoidable automated-triage rejection and wasted submission fees without stretching scope, severity, or technical claims.

## Required inputs

For a new run, collect these once. Do not ask again for values already supplied:

- report: file path or pasted report;
- program URL;
- workflow mode: `dynamic` or `oneshot`;
- technical-evidence/codebase path, defaulting to the current working directory when applicable. A local codebase is not mandatory for a valid black-box report.

Also accept optional user-supplied submission standards, authenticated/private policy text, team responses, or attachments. Label every source by provenance. Never claim access to private pages unless the user supplied their contents.

If the invocation supplies `resume=<absolute session directory>`, it is a dynamic resume. Do not ask for the report, program URL, mode, or evidence root again; recover them from the verified ledger.

## Entrypoint

1. Read [core/workflow.md](core/workflow.md) and [core/worker-contract.md](core/worker-contract.md).
2. If `resume=<session-dir>` is present, follow the dynamic resume protocol before doing any phase work. Use the saved platform and URL to resolve the adapter; do not initialize a second session.
3. For a new run, detect the platform from the supplied program URL. Resolve `platforms/<platform>/adapter.yaml`; v1 supports only `immunefi`. If no adapter exists, stop with `unsupported_platform` and identify the missing adapter rather than borrowing another platform's rules.
4. Branch on mode before any persistence action. In `oneshot`, do not initialize a session, invoke `scripts/session.mjs`, create `.free-triager`, copy inputs, or write checkpoints. In `dynamic`, initialize a session using `scripts/session.mjs` when Node is available. Otherwise implement the same append-only schema and transition checks with the harness's filesystem tools. Store dynamic runtime state under `<workspace-or-evidence-root>/.free-triager/runs/<session-id>/`.
5. The orchestrator performs coordination only. Delegate each phase to an isolated worker when the harness supports workers/subagents. If isolated workers are unavailable, execute the phase logic serially using one compact in-memory state; do not simulate workers with separate long transcripts or repeat shared inputs.
6. In dynamic mode, the orchestrator alone appends validated worker results directly to `session.jsonl`. Workers never write the canonical ledger or intermediate payload files.

## Reference routing

All supporting instructions are linked directly from this entrypoint. Read only the references required for the current platform, phase, and technical classification.

### Phase workers

- `prior_art`: [workers/01-prior-art.md](workers/01-prior-art.md)
- `program_policy`: [workers/02-program-policy.md](workers/02-program-policy.md)
- `eligibility_gate`: [workers/03-eligibility-gate.md](workers/03-eligibility-gate.md)
- technology-neutral classifier used by technical validation: [workers/04-target-classifier.md](workers/04-target-classifier.md)
- `technical_validation`: [workers/04-technical-validation.md](workers/04-technical-validation.md)
- `verdict_and_improvement`: [workers/05-verdict-and-improvement.md](workers/05-verdict-and-improvement.md)
- optional, explicitly authorized `report_revision`: [workers/06-report-revision.md](workers/06-report-revision.md)

### Technical profiles

After classification, read only the applicable profile or profiles:

- smart contracts: [core/technical-profiles/smart-contract.md](core/technical-profiles/smart-contract.md)
- web and applications: [core/technical-profiles/web-app.md](core/technical-profiles/web-app.md)
- Blockchain/DLT: [core/technical-profiles/blockchain-dlt.md](core/technical-profiles/blockchain-dlt.md)
- cross-category findings: [core/technical-profiles/mixed.md](core/technical-profiles/mixed.md), in addition to each applicable category profile

### Immunefi adapter references

When the active adapter is Immunefi, use these references only in the named phases:

- adapter interpretation: [platforms/immunefi/triage-rules.md](platforms/immunefi/triage-rules.md) during program research and policy extraction
- PoC requirements: [platforms/immunefi/poc-guidelines.md](platforms/immunefi/poc-guidelines.md) during policy extraction, technical validation, and an authorized revision
- report fields and structure: [platforms/immunefi/report-template.md](platforms/immunefi/report-template.md) during verdict/improvement and an authorized revision
- observed automated-triage checks: [platforms/immunefi/automated-triage-readiness.md](platforms/immunefi/automated-triage-readiness.md) during verdict/improvement and an authorized revision

For dynamic sessions, enforce [schemas/session-event.schema.json](schemas/session-event.schema.json) through the session helper or an equivalent implementation when Node is unavailable.

## Modes

- `dynamic`: create or resume persistent state, complete exactly one pending phase, append one checkpoint, print the resume handoff, and stop. A fresh chat must be able to continue from disk alone. On every `resume=<session-dir>` invocation, re-open the saved program URL before running the pending phase.
- `oneshot`: run phases sequentially using only the current invocation's context. Create nothing on disk: no session, copied report, checkpoint, worker-output file, cache, or ledger. Fetch the program page at the start and reuse that evidence across phases. Stop immediately on a terminal rejection gate, unresolved required input, or unsafe/unsupported action.

Both modes use the same state machine and evidence requirements. Mode changes pacing, not judgment.

## Non-negotiable judgment rules

- In dynamic mode, re-open the saved program URL at initialization and at the start of every resumed invocation, before the pending phase. Treat checkpointed extracts as routing context, not fresh authority. In oneshot mode, read it once at the start and retain that fresh evidence in the current context; do not repeatedly fetch the same page unless access failed or a newly discovered linked source must be opened.
- Apply rules in this order: explicit program-specific terms; the severity system/version selected by that program; platform-wide defaults only where the program is silent.
- Check known issues before spending tokens on deep validation. Match root cause and material impact, not keywords alone.
- Never mark an issue known without a source and a concrete equivalence explanation.
- Keep automated-triage readiness separate from human merits. A bot-risk warning must not silently invalidate a technically sound report.
- Distinguish an ineligible disclosed known issue from an earlier-report match. Apply duplicate consequences only when the program or competition rules make that match disqualifying.
- Never invent scope, impact, PoC, anti-bot, traffic, disclosure, or submission rules.
- Determine the affected category and technology from the report, program, and evidence. Support smart contracts, web/apps, Blockchain/DLT, and mixed paths without assuming a language, framework, virtual machine, client architecture, or source-availability model.
- Distinguish `rejected` from `needs_information`. Missing evidence is not proof that a claim is false.
- Validate the strongest realistic version of the report, but do not repair an impossible exploit path by introducing unreported assumptions.
- Severity follows the demonstrated in-scope impact and applicable program rubric.
- Do not blend impact severity and exploit likelihood into a lower severity unless the applicable rubric explicitly requires that combination. Report likelihood separately.
- Do not help conceal AI assistance or evade automation detection. Surface the applicable automation policy and require the researcher to review, verify, and take responsibility for the submission.
- Do not modify the submitted report unless the user explicitly requests revision after seeing the triage result. Write a revised copy by default; preserve the original.

## Completion

Return the current verdict, decisive evidence, unresolved items, and exact next action. Do not report or create a session directory in oneshot mode. In dynamic mode always include:

```text
CHECKPOINT_SAVED: <phase> | session=<absolute session directory>
RESUME: invoke $free-triager with resume=<absolute session directory>
```
