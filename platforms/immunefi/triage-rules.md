# Immunefi Adapter Rules

This adapter defines how to read Immunefi programs; it does not freeze a global policy snapshot. Program pages and severity systems change, so every run must use live program-specific evidence.

## Source collection

Open the supplied program URL and inspect both information and scope views when available. Follow program-linked known-issue trackers, audit reports, disclosures, and the severity-classification version selected by that program.

Useful public starting points, subordinate to the program page:

- `https://immunefi.com/severity-classification-systems/`
- the exact severity-system URL named by the program;
- program-linked Help Center or rules pages.

Do not automatically apply the newest classification system. Apply the version the program uses.

## Primacy handling

Primacy of Impact can allow an impact to qualify even when the particular asset is not listed, but only for the severities/impacts explicitly named by the program and subject to its stated ownership and exclusion conditions. All remaining cases stay under the program's normal rules.

Record:

- enabled impact/severity classes;
- asset ownership requirement;
- separate-program limitation;
- testnet/mock or other exceptions;
- submission placeholder/instructions when stated.

## Known issues

Program-disclosed known issues may include bugs the project knows about but has not fixed, necessary future changes, or operational mitigations. Preserve the project's stated rationale. A report is equivalent only when its root cause and material impact substantially match, or when the disclosed mitigation explicitly covers the reported path.

## PoC and submission rules

Read the exact program requirement. Some programs require executable code or a particular demonstration; do not substitute a generic remembered guideline. User-provided private PoC, anti-bot, or traffic guidance may be applied only as `user_supplied_private` evidence.

For the supplied platform-level PoC checklist, read [poc-guidelines.md](poc-guidelines.md) only during policy extraction and technical PoC validation. For report structure and field placement, read [report-template.md](report-template.md) only during verdict/improvement or an authorized revision.

For the observed front-line triage checks, read [automated-triage-readiness.md](automated-triage-readiness.md) only during final readiness assessment or report revision. Do not treat a single observed transcript as universal policy.

## Severity

Map severity from the demonstrated impact using the program-selected classification. Preconditions, privileges, uncommon interaction, feasibility, and program exclusions may affect eligibility or severity only when supported by applicable rules and technical evidence.

Keep mapped impact severity and likelihood separate. Do not invent a combined severity model when the program table maps the demonstrated impact directly.
