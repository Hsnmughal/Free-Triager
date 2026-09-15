# Worker: Eligibility Gate

Goal: stop early when a decisive known-issue, scope, impact, or rules gate makes rejection likely.

Use the report, prior-art registry, and policy checkpoint. Evaluate every category plausibly implicated by the affected asset and claimed impact. If category ambiguity could change eligibility, preserve the viable paths for technical classification instead of selecting the harshest one.

## Gate order

1. Compare known issues and duplicate candidates by root cause, affected state, material impact, and conceptual fix; then apply the exact consequence specified by the program.
2. Determine whether the exact affected asset/version is in scope.
3. Check program-specific requirements and Primacy of Rules restrictions.
4. Determine whether the demonstrated impact is listed in scope.
5. If the asset is out of scope, test only the program's explicit Primacy of Impact path and exceptions.

For every gate return `pass`, `fail`, or `uncertain`, with decisive rule/evidence references.

Known issue equivalence requires a reasoned mapping and source. Similar bug class alone is insufficient.

Do not collapse these outcomes:

- a program-disclosed issue explicitly declared ineligible may terminate as `known_issue`;
- an earlier report may be a duplicate only under the applicable competition/program rule;
- an informational match that the platform still escalates must not become a rejection gate;
- a related prior issue with a different state transition, victim path, impact, or fix remains distinct.

If both asset and impact fail and no Primacy of Impact exception applies, return terminal `out_of_scope`. If policy wording is materially ambiguous, return `needs_information` instead of choosing the harsher interpretation.

Required `result` keys: `gates`, `known_issue_classification`, `applicable_scope_path`, `viable_category_paths`, and `disposition`. `gates` is an ordered array matching the gate order above. `viable_category_paths` preserves each program category that remains eligible for technical classification and the evidence supporting that path.
