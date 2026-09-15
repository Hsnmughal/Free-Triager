# Worker Contract

Use this contract for every delegated phase, regardless of harness.

## Inputs

A worker receives only:

- phase name and phase prompt;
- platform, workflow mode, and workspace/evidence root;
- session ID only in dynamic mode;
- report source;
- program URL;
- latest fresh page retrieval for this invocation;
- prerequisite checkpoint records explicitly named by the orchestrator;
- active platform adapter and relevant user-supplied guidance;

Do not depend on conversation history or load unrelated phase outputs.

In `oneshot`, the orchestrator passes only the compact predecessor results needed by the phase and retains returned results in memory. In `dynamic`, the worker receives the checkpoint records needed for the pending phase after the orchestrator has freshly re-opened the saved program URL.

## Processing rules

1. Stay within the assigned phase.
2. Separate facts, inferences, and unresolved questions.
3. Attach provenance to every external rule or known-issue claim.
4. Quote minimally; prefer precise paraphrases with URLs and retrieval timestamps.
5. Make code claims only after reading the cited implementation and necessary dependencies.
6. Record contradictory evidence rather than hiding it.
7. Use `needs_information` when the missing fact could reverse the decision.
8. Do not write files or the canonical session ledger. Return the result directly to the orchestrator.
9. Do not echo the report, source pages, adapter, or prerequisite checkpoints. Refer to them by stable evidence IDs, URLs, and code locations.
10. Emit no progress transcript or methodology recap. Keep `summary`, facts, and inferences to decision-bearing information needed by a later phase or the final verdict.
11. In oneshot mode, use the supplied evidence map and do not re-open the saved program URL. In dynamic mode, include the exact saved program URL in `sources` with the current invocation's retrieval timestamp; a linked page or generic platform URL does not satisfy this freshness record.

## Output contract

Return one JSON object:

```json
{
  "phase": "program_policy",
  "summary": "short factual summary",
  "decision": "continue",
  "facts": [],
  "inferences": [],
  "unresolved": [],
  "sources": [
    {
      "url": "https://example.invalid",
      "retrieved_at": "RFC3339 timestamp",
      "source_type": "program|platform|linked_issue|audit|user_supplied_private"
    }
  ],
  "result": {}
}
```

`decision` must be one of `continue`, `terminal`, or `needs_information`. Phase-specific required fields belong inside `result`.

## Completion

Return exactly the JSON object as the worker's final output. The orchestrator validates it in memory. In dynamic mode, it appends that object directly to `session.jsonl`; in oneshot mode, it keeps only the compact result required by later phases in the current context. The orchestrator retries malformed output once with the validation error. A second malformed result stops with `error`.
