# Orchestrator Workflow

## Purpose

Determine whether a report is likely to be accepted under the named program's current rules, and identify the smallest truthful changes that reduce rejection risk.

## Intake and mode selection

If `resume=<session-dir>` is present, skip new-run intake and go directly to the dynamic resume protocol. Otherwise collect only missing required inputs:

1. report path or report text;
2. program URL;
3. workflow mode: `dynamic` or `oneshot`;
4. technical-evidence/codebase path, default current directory when applicable; source is optional for black-box evidence.

Optional inputs include private submission guidance, anti-bot/traffic policy text, team responses, and report attachments. Treat user-supplied material as `source_type: user_supplied_private`; do not browse for or infer inaccessible content.

Resolve the mode before creating files or invoking the session helper.

## Oneshot protocol: memory only

`oneshot` has a hard no-persistence invariant for triage. Do not create `.free-triager`, initialize a session, copy the report, write JSONL, create worker payloads, cache web pages, or emit any other triage artifact. Read a report path in place or consume pasted text directly.

1. Open the program URL once at the start of the invocation. Follow relevant public links needed for known issues, audits, scope, rules, or standards.
2. Retain a compact evidence map in current context: source URL, retrieval timestamp, provenance, and the exact facts needed by the five phases.
3. Run the five phases sequentially. Pass each isolated worker only the report, relevant evidence map entries, codebase material, adapter, and prerequisite compact phase results. If isolated workers are unavailable, update one compact in-memory state object in place and emit no intermediate phase transcripts.
4. Stop immediately on a terminal outcome or `needs_information`; otherwise continue through the verdict.
5. Return the result directly. Do not include a session or resume flag.

Do not repeatedly re-open the same program page between oneshot phases. Re-open only if the initial fetch failed, the page changed during the run, or a phase identifies a new linked source that must be inspected.

## Dynamic initialization

`dynamic` is the only persistent mode. If `resume=<session-dir>` is absent, initialize with:

```text
node <skill>/scripts/session.mjs init \
  --root <absolute workspace or evidence root> \
  --platform immunefi \
  --mode dynamic \
  --program-url <url> \
  --report <report-path>
```

For pasted reports, materialize the report only as part of dynamic session initialization. The session directory may contain confidential material and must remain ignored by version control.

Without Node, create the same dynamic-only directory structure and `init` event defined by `../schemas/session-event.schema.json`. Writes must be atomic, sequence numbers contiguous, and phase transitions identical to `scripts/session.mjs`.

After initialization, open the saved program URL, run only `prior_art`, append its checkpoint, print the resume flag, and halt.

## Dynamic resume protocol

The public resume interface is:

```text
$free-triager resume=<absolute session directory>
```

On every resumed invocation, in this order:

1. Run `session.mjs resume --session <session-dir>`; this verifies the ledger and returns the saved inputs, pending phase, and `fresh_program_read_required: true`.
2. If the session is closed, report its terminal state and stop.
3. Re-open the saved program URL before doing phase work. Record the fresh retrieval timestamp and URLs consulted. This is mandatory even if a checkpoint contains extracts from the same page.
4. Read only the checkpoint records required by the pending phase. Never reconstruct dynamic state from conversation memory.
5. Run exactly the returned pending phase.
6. Validate the worker's returned JSON object. For every triage phase, its `sources` must contain the saved program URL with a `retrieved_at` timestamp at or after the preceding checkpoint; the session helper rejects stale or different-page evidence. Append the object directly through standard input:

```text
node <skill>/scripts/session.mjs append \
  --session <session-dir> \
  --phase <phase> \
  --status <complete|terminal|needs_information|error>
```

7. Print `CHECKPOINT_SAVED` and the exact `resume=<session-dir>` flag, then halt. Never begin another phase in the same invocation.

If the live page is unavailable, do not silently rely on a stale extract. Append `needs_information` with the access failure, ask for an exported page or pasted contents, and halt.

## State machine

```text
init
  -> prior_art
  -> program_policy
  -> eligibility_gate
  -> technical_validation
  -> verdict_and_improvement
  -> complete
```

Terminal outcomes may stop either mode early:

- `known_issue`;
- `out_of_scope`;
- `rules_violation`;
- `invalid_claim`;
- `unsupported_platform`.

Use `needs_information` for missing or ambiguous evidence that could materially change the outcome. This is resumable in dynamic mode; it simply stops the current invocation in oneshot mode.

## Phase dispatch

### 1. Prior art

Read `../workers/01-prior-art.md`. Inspect the program's disclosed known issues, linked issue trackers, prior audits, disclosures, and documented mitigations. Preserve any project explanation for leaving an issue unfixed.

Required result fields:

- known issue registry with title, root cause, affected component, impact, disposition, and source;
- audit/disclosure registry;
- access gaps;
- comparison hooks for the submitted report.

### 2. Program policy

Read `../workers/02-program-policy.md` and the active platform adapter. Extract assets, impacts, exclusions, selected severity system, PoC requirements, primacy rules when present, reward constraints relevant to eligibility, and other submission-affecting terms. Preserve category-specific rules for smart contracts, web/apps, and Blockchain/DLT rather than merging them.

Every extracted rule must carry source URL, retrieval timestamp, exact or tightly paraphrased rule text, and whether it is program-specific, platform-default, or user-supplied. Absence of a Primacy of Rules or Primacy of Impact clause is a recorded absence, not a missing-input error; apply ordinary asset and impact scope instead.

### 3. Eligibility gate

Read `../workers/03-eligibility-gate.md`. Apply the gates across every report category plausibly implicated by the program asset and claimed impact; do not force an ambiguous or mixed report into one category merely to reject it. Apply gates in this exact order:

1. Known issue or duplicate classification.
2. Asset scope.
3. Program-specific/Primacy of Rules compliance, if such rules exist.
4. Impact scope.
5. Primacy of Impact escape path only when explicitly enabled and the asset is out of scope.

Decision branch:

```text
program-disclosed issue explicitly ineligible -> known_issue (terminal)
earlier-report match -> apply the program's duplicate rule; otherwise informational
asset in scope
  -> applicable rules satisfied?
     -> impact in scope? -> technical_validation
asset out of scope
  -> claimed severity/impact explicitly covered by Primacy of Impact?
     -> affected asset belongs to the program/project and no stated exception applies?
        -> technical_validation
otherwise -> out_of_scope or rules_violation (terminal)
```

Do not treat Primacy of Impact as universal. Use only the severities and impact classes explicitly enabled by the program, and apply stated exceptions such as test/mock assets or separate programs.

### 4. Technical validation

Read `../workers/04-technical-validation.md`. It first runs the technology-neutral target classifier, then loads only the required smart-contract, web/app, Blockchain/DLT, or mixed technical profiles. Validate citations, execution path, preconditions, violated invariant, exploitability, claimed impact, and PoC against the available evidence and the program's category-specific requirements.

```text
shared policy + eligibility
          -> target classifier
             -> smart_contract profile
             -> web_app profile
             -> blockchain_dlt profile
             -> selected profiles + boundary validation for mixed findings
          -> shared verdict
```

Classify each material claim as `proven`, `supported`, `uncertain`, or `refuted`. A broken PoC or impossible path may produce `invalid_claim`; missing evidence that is actually required to establish the claim produces `needs_information`. Source-code absence alone is not a failure for a reproducible black-box report.

### 5. Verdict and improvement

Read `../workers/05-verdict-and-improvement.md`. Resolve validity, eligibility, severity, rejection risk, and precise report improvements using the classified target category and technical profile results. Apply public standards and any user-supplied private guidance with separate provenance.

For platforms with automated front-line triage, issue two independent assessments:

1. automated-triage readiness and likely failure points;
2. human-review technical and policy merits.

The submission recommendation combines both but never rewrites one as the other. A valid report that is bot-fragile should be `ready_with_changes`, not `invalid_claim`.

Default behavior is review-only. If the user explicitly asks for changes, run a separate `report_revision` action after the verdict and write a new file unless overwrite was explicitly requested. This authorized revision is not a triage checkpoint; in a later oneshot turn, request the original report and verdict again if they are no longer in context.

For revision, read `../workers/06-report-revision.md`. It is outside the mandatory five-phase triage path and must never run from inferred consent.

## Final verdict vocabulary

- `ready`: eligible and technically substantiated; only editorial improvements remain.
- `ready_with_changes`: likely eligible but material report/PoC changes should be made before submission.
- `needs_information`: evidence is insufficient for a reliable decision.
- `known_issue`: materially equivalent prior issue makes rejection likely.
- `out_of_scope`: neither normal asset/impact scope nor an applicable Primacy of Impact path covers it.
- `rules_violation`: conflicts with a decisive program or platform rule.
- `invalid_claim`: the claimed exploit or impact is refuted under the stated conditions.

The skill provides a reasoned pre-submission assessment, not a guarantee of platform or project acceptance.
