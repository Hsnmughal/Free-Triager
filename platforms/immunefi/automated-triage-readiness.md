# Immunefi Automated-Triage Readiness

Provenance: calibrated from a user-supplied report transcript dated 2026-08-25. The automated triager escalated the report, the project confirmed it, and the project raised severity from the submitted Medium to High. This is observed behavior from one case, not a complete or permanent Immunefi policy.

Read this file only during `verdict_and_improvement` or an authorized report revision.

## Two-gate model

Assess independently:

1. `automated_triage_readiness`: whether the submission appears likely to pass the front-line completeness, relevance, scope, and custom-rule checks;
2. `human_merits`: whether the report is technically valid, policy-eligible, and correctly classified after deeper review.

A report can be technically valid but bot-fragile. Recommend concrete changes before submission rather than misclassifying it as invalid.

## Observed front-line checks

The supplied transcript says the triager checked:

- selected impact matches the report and is in scope;
- selected asset matches the report and is in scope;
- required sections contain relevant information rather than filler or junk;
- a PoC is attached;
- the PoC contains code that appears relevant to the reported impact and attack description;
- the PoC and Bug Description contain enough detail to evaluate the code;
- client-specific program requirements are satisfied;
- out-of-scope rules are not violated;
- whether automation tools were used to create the report.

Treat these as a minimum observed checklist. Re-read the live program and current applicable platform rules for additional requirements.

## Readiness classification

- `pass`: every observed and live-program gate has evidence, and no unresolved issue is likely to trigger automatic closure.
- `at_risk`: the underlying report may be valid, but one or more presentation, PoC, asset/impact-selection, custom-rule, or automation-policy questions could block escalation.
- `fail`: a decisive gate is unsatisfied and the current submission is likely to close before human merits review.
- `unknown`: current policy or required evidence could not be obtained.

For each failed or uncertain item, state the exact report field to change and the evidence required. Do not promise escalation.

## Calibration lessons from the accepted High case

### Normal privileged operation is not necessarily privileged exploitation

The accepted path included blocklisting, rescue, un-blocklisting, and a later user withdrawal. The privileged actions were ordinary non-malicious operations; the defect poisoned state later consumed by an unprivileged user. Ask who exploits the bug and who suffers harm. Do not apply a privileged-attacker exclusion merely because an authorized role appears in the setup.

### Earlier-report matching is not always terminal

The triager matched the finding to an earlier report with the same root cause but explicitly said the match was informational and did not affect escalation. Therefore, record the platform/program's actual duplicate consequence before halting.

### Impact mapping controls severity unless a rule says otherwise

The submitted report used Medium, but the project raised it to High because the demonstrated freeze matched a High in-scope impact. Keep likelihood separate from impact severity, and do not create an undocumented combined scoring model.

### Static verification is different from execution failure

An assessing environment may lack Node, npm, Foundry, or Hardhat. If the PoC code and state transition can be inspected but not executed, report `statically_verified_not_executed`; do not say the PoC failed. Provide the exact remaining execution step and its effect on confidence.

## Automation integrity

Do not help a researcher evade an automation-policy check. Free Triager may organize, test, and critique user-provided research, but it must preserve provenance, avoid fabricated personal authorship, and require the researcher to understand and verify the final report.
