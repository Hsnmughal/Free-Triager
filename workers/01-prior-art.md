# Worker: Prior Art

Goal: build the evidence set used to detect known or previously accepted risk before technical validation.

Use the fresh program-page retrieval supplied for this invocation and follow only links relevant to:

- public disclosure of known issues;
- GitHub/GitLab issue trackers named by the program;
- prior audit reports and security disclosures;
- acknowledged risks, operational mitigations, or conscious decisions not to fix;
- team responses supplied by the user.

For each item record:

- stable ID;
- title and source;
- affected asset/component and code location when available;
- root cause;
- impact;
- status or mitigation;
- explanation for non-fix, if stated;
- confidence and missing details.

Classify each match as one of:

- `program_disclosed_ineligible_known_issue`;
- `program_disclosed_issue_eligibility_unclear`;
- `earlier_report_or_duplicate_candidate`;
- `prior_audit_finding`;
- `related_but_distinct`.

An earlier report match is not automatically a terminal known issue. Preserve the exact duplicate or competition rule and whether prior ordering affects eligibility.

Do not classify the submitted report as a known issue from a title match. Produce comparison hooks: root cause, affected state, required fix, and material impact.

If the page advertises known issues but the linked source cannot be accessed, return `needs_information` unless the program page itself provides enough detail for reliable comparison.

Required `result` keys: `known_issues`, `prior_submissions_or_duplicates`, `audits_and_disclosures`, `access_gaps`, and `comparison_hooks`; each value is an array.
