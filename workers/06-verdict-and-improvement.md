# Worker: Verdict and Improvement

Goal: issue the final pre-submission assessment and improve acceptance odds without overstating the finding.

For Immunefi, use the report-template reference routed from the entrypoint and check every applicable dashboard field and rejection-risk item.

Also use the automated-triage-readiness reference routed from the entrypoint. Treat its observed checks as calibration evidence, not as a guaranteed or exhaustive policy.

Resolve:

- target category or mixed boundary, derived technology context, and profile-specific technical result;
- the adversarial result from `red_team_validation`: adjudicated claims, surviving counterexamples, unresolved assumptions, and the challenged severity;
- final verdict vocabulary from the orchestrator workflow;
- applicable severity and the exact impact mapping;
- exploit likelihood/preconditions as a separate axis;
- strongest rejection reasons in priority order;
- confidence and unresolved assumptions;
- minimal technical, PoC, scope, and presentation improvements;
- claims that should be narrowed or removed;
- evidence/citations that should be added;
- required private-guidance gaps, if any.

## Red-Team integration

The adversarial phase adjudicates the finding; this phase does not re-run or overturn it. Carry its result into `red_team_summary` with the adjudicated claims, the strongest surviving counterexample, and the unresolved assumptions.

Apply its outcome as follows:

- `technically_valid` supports `ready` or `ready_with_changes` on the technical axis; eligibility and presentation still decide the final verdict;
- `ready_with_changes` means the finding survived but the report overstates or under-evidences part of it; the improvements must name the exact claims to narrow;
- `needs_information` maps to `needs_information`, and the unresolved questions become the information request;
- `invalid_claim` and `unsupported` map to `invalid_claim`; cite the decisive counterexample, not the absence of proof;
- `out_of_scope` is a policy outcome and must not be presented as a technical refutation.

Surviving unresolved assumptions belong in the assessment and in `rejection_risks`. Do not resolve them by assumption.

Severity procedure:

1. Select the exact demonstrated impact from the applicable program category table.
2. Record the table-mapped severity.
3. Record likelihood and preconditions separately.
4. Apply a downgrade only when an applicable rule expressly authorizes it and cite that rule.
5. Set `severity_confidence` from the Red-Team severity challenge. When the technical finding holds but the severity claim rests on unproven dependencies, keep the finding and lower `severity_confidence`; never convert an unsupported severity claim into an invalid finding.

Do not convert “High impact, Medium likelihood” into Medium by intuition. If permanent versus temporary freezing or another boundary is uncertain, state what each classification requires and recommend the highest tier directly supported by current evidence.

Produce separate fields for `automated_triage_readiness`, `human_merits`, and `submission_recommendation`. The recommendation is one of `submit`, `submit_after_changes`, `needs_information`, or `do_not_submit`.

Use public program/platform rules and user-supplied private guidance as separately attributed sources. Do not present private guidance as public Immunefi policy.

Produce a suggested report outline aligned with the available submission standard. Do not rewrite the report in this phase.

If the user later requests revision, preserve technical meaning, create a revised copy by default, and include a concise change log. Never inflate severity or hide a failed gate.

Required `result` keys: `target_category`, `profile_summary`, `verdict`, `severity`, `severity_basis`, `severity_confidence`, `likelihood`, `red_team_summary`, `automated_triage_readiness`, `human_merits`, `submission_recommendation`, `fee_risk`, `rejection_risks`, `improvements`, `report_outline`, `template_compliance_checklist`, and `confidence`.
