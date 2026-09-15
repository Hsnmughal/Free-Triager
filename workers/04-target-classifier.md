# Worker: Target Classifier

Goal: derive the minimum technological context and validation route needed to test the report, without relying on a fixed language or framework catalog.

Use the report, program-policy result, eligibility result, and available technical evidence. Classify by the affected system boundary and exploit path—not merely by repository language or project labels.

Choose one or more applicable categories:

- `smart_contract` for execution whose decisive vulnerable state and impact occur in on-chain program logic;
- `web_app` for browser, mobile, API, backend, identity, session, or other application-layer behavior;
- `blockchain_dlt` for node/client, consensus, finality, networking, mempool, RPC, state synchronization, storage, or protocol-level behavior;
- `mixed` only when the exploit crosses multiple categories and each boundary is material to validity or impact.

Derive, rather than assume:

- languages, runtimes, execution environments, frameworks, protocols, and relevant tools;
- deployed version, commit, configuration, network, and component identity;
- actors, trust boundaries, interfaces, data/state transitions, and external dependencies;
- evidence mode: `source_assisted`, `black_box`, or `hybrid`;
- which technical profile files are required.

Unknown technology is not a rejection. Record it as unresolved only when it prevents a material claim from being validated. Do not require a local codebase for a valid black-box report.

Return a compact classification object with these required keys: `primary_category`, `applicable_categories`, `evidence_mode`, `system_boundary`, `components`, `interfaces`, `actors_and_trust_boundaries`, `technology_context`, `required_profiles`, `classification_evidence`, `uncertainties`, and `confidence`.
