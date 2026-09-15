# Technical Profile: Smart Contract

Apply when `target_classification.required_profiles` includes `smart_contract`. Derive chain, execution model, language, framework, and tooling from evidence; do not assume EVM or Solidity.

Validate the decisive path across:

- deployed/source version correspondence and relevant configuration;
- entry points, caller capabilities, authorization, and privileged preconditions;
- state/storage transitions, ordering, atomicity, and cross-component calls;
- value/accounting invariants, asset movement, recovery paths, and repeatability;
- upgrade, governance, oracle, bridge, or external-system assumptions only when material;
- PoC end effect against the program's category-specific requirement.

Choose analysis and execution tools from the derived technology context. If suitable tooling is unavailable, perform bounded static validation and record the limitation; never reinterpret tool absence as a failed PoC.
