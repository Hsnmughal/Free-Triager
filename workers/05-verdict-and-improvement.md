# Worker: Verdict and Improvement

Goal: issue the final pre-submission assessment and improve acceptance odds without overstating the finding.

For Immunefi, read `../platforms/immunefi/report-template.md` and check every applicable dashboard field and rejection-risk item.

Also read `../platforms/immunefi/automated-triage-readiness.md`. Use its observed checks as calibration evidence, not as a guaranteed or exhaustive policy.

Resolve:

- target category or mixed boundary, derived technology context, and profile-specific technical result;
- final verdict vocabulary from `core/workflow.md`;
- applicable severity and the exact impact mapping;
- exploit likelihood/preconditions as a separate axis;
- strongest rejection reasons in priority order;
- confidence and unresolved assumptions;
- minimal technical, PoC, scope, and presentation improvements;
- claims that should be narrowed or removed;
- evidence/citations that should be added;
- required private-guidance gaps, if any.

Severity procedure:

1. Select the exact demonstrated impact from the applicable program category table.
2. Record the table-mapped severity.
3. Record likelihood and preconditions separately.
4. Apply a downgrade only when an applicable rule expressly authorizes it and cite that rule.

Do not convert “High impact, Medium likelihood” into Medium by intuition. If permanent versus temporary freezing or another boundary is uncertain, state what each classification requires and recommend the highest tier directly supported by current evidence.

Produce separate fields for `automated_triage_readiness`, `human_merits`, and `submission_recommendation`. The recommendation is one of `submit`, `submit_after_changes`, `needs_information`, or `do_not_submit`.

Use public program/platform rules and user-supplied private guidance as separately attributed sources. Do not present private guidance as public Immunefi policy.

Produce a suggested report outline aligned with the available submission standard. Do not rewrite the report in this phase.

If the user later requests revision, preserve technical meaning, create a revised copy by default, and include a concise change log. Never inflate severity or hide a failed gate.

Required `result` keys: `target_category`, `profile_summary`, `verdict`, `severity`, `severity_basis`, `likelihood`, `automated_triage_readiness`, `human_merits`, `submission_recommendation`, `fee_risk`, `rejection_risks`, `improvements`, `report_outline`, `template_compliance_checklist`, and `confidence`.
