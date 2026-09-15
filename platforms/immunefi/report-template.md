# Immunefi Bug Report Template

Provenance: concise operational extraction from a user-supplied Immunefi Help Center snapshot labeled “Updated” and supplied on 2026-09-15. Treat this as submission-format guidance, subordinate to the live program page and current dashboard fields.

Read this file during `verdict_and_improvement` and the optional `report_revision` action.

## Dashboard requirements

- Fill every applicable dashboard section instead of placing the whole report in Bug Description.
- Put PoC material in the dedicated Proof of Concept field when the dashboard provides one.
- Select an impact from the program's listed in-scope impacts; do not submit a custom impact.
- Select an asset from the program's listed assets, or the program's explicit Primacy of Impact placeholder when that path applies; do not invent a custom asset.
- Use Markdown for readable structure. Title and reference screenshots clearly.
- For a hosted PoC video, provide access instructions, including a password when needed.

## Required report structure

### Title

Name the vulnerability class or root cause, the affected component/interface, and the concrete impact. Avoid generic titles such as “vulnerability in contract/app/node.”

### Bug Description

Describe the vulnerability and its impact clearly, accurately, and without unnecessary assumptions.

### Brief/Intro

Use one short paragraph stating the defect and the consequence if exploited.

### Details

Explain the exact root cause, affected component, preconditions, execution path, violated invariant, and why existing controls do not prevent the issue. Include focused source, request, trace, configuration, protocol, or other evidence appropriate to the target without overcrowding the report.

### Impact

Map the demonstrated outcome to the exact selected in-scope impact. Quantify affected funds or users when evidence permits. Separate current evidence from assumptions and avoid unsupported worst-case claims.

### Risk Breakdown

Explain attacker access, capital, timing, user interaction, privileges, repeatability, and other exploit constraints. Use the program-selected Immunefi severity classification rather than substituting CVSS for blockchain/DLT findings.

### Recommendation

Suggest a concrete fix or mitigation that addresses the root cause. Keep it technically feasible and distinguish immediate mitigation from a complete fix.

### References

Link the relevant source files, contracts, endpoints, applications, clients, deployments, documentation, transactions, traces, and supporting material. Keep the dedicated PoC field separate when the dashboard requires it.

### Proof of Concept

Provide the applicable evidence required by [poc-guidelines.md](poc-guidelines.md) and the live program. A prose sequence, pseudocode, project source copied without an exploit, or an empty PoC field is insufficient when runnable proof is required.

## Rejection-risk checklist

Before marking a report `ready`, verify:

- selected asset and impact exactly match the program options;
- title communicates root cause and impact;
- technical details are reproducible and grounded in the strongest evidence available for the target;
- impact is concrete and not merely asserted;
- exploit difficulty and assumptions are disclosed;
- recommendation addresses the root cause;
- references resolve;
- required PoC is runnable, complete, safe, and placed in the correct field;
- no required dashboard section is empty.

## Automation-policy check

Observed Immunefi triage text may include a check for reports created with automation tools. Before submission, extract the current applicable rule and tell the researcher about any restriction or disclosure obligation. Never offer stylistic obfuscation, detector evasion, or false claims of authorship. Require human review of every technical claim and the final submission.
