# Worker: Program Policy

Goal: produce a source-grounded eligibility and severity policy for this exact program.

For Immunefi, use the PoC-guideline reference routed from the entrypoint to extract the applicable platform baseline, but first determine from the fresh program evidence supplied for this invocation whether a PoC is required and whether program-specific terms override it. Do not re-open a page already present in the supplied evidence map.

Extract:

- in-scope assets with their program category and identifiers, repositories, contracts, URLs, applications, services, clients, networks, versions, and dates where available;
- in-scope impacts and mapped severity, preserving separate smart-contract, web/app, and Blockchain/DLT tables;
- explicit out-of-scope assets, impacts, attack methods, and assumptions;
- Primacy of Rules language;
- Primacy of Impact severities/impacts and exceptions;
- selected platform severity-classification version;
- PoC form and execution requirements by category;
- disclosure, testing, traffic, anti-bot, and submission rules visible to the worker;
- automation/AI-assistance restrictions, disclosure duties, and source confidence;
- reward constraints only where they affect report framing or eligibility.

Resolve conflicts by precedence:

1. explicit program-specific rule;
2. program-selected platform classification/version;
3. current platform default only where the program is silent;
4. user-supplied private guidance, applied only to the purpose and provenance stated by the user.

Do not merge old and current severity systems. Save ambiguity explicitly if the program does not identify its version.

Required `result` keys: `assets`, `impacts`, `exclusions`, `primacy`, `severity_system`, `poc_requirements`, `automation_policy`, `submission_rules`, and `category_rule_matrix`. The matrix maps every category present on the program page to its assets, impacts, exclusions, severity rules, primacy mode, and PoC requirements without filling absent categories.
