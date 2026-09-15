# Technical Profile: Blockchain or DLT

Apply when `target_classification.required_profiles` includes `blockchain_dlt`. Derive protocol, client implementation, language, topology, version, configuration, and tooling from evidence; do not assume a particular chain design.

Validate the decisive path across the relevant layers:

- transaction/block/state-transition validity and deterministic execution;
- consensus, fork choice, finality, liveness, safety, and validator assumptions;
- peer-to-peer propagation, peer scoring, eclipse/partition conditions, and resource exhaustion;
- mempool, RPC, synchronization, state/storage, cryptographic verification, and upgrade boundaries;
- attacker resources, node roles, topology, timing, affected network fraction, persistence, and recovery;
- reproducibility on a local network, simulator, fixture, or other program-permitted environment;
- PoC end effect against the program's Blockchain/DLT-specific requirement.

Inspect only the layers implicated by the claim. If a multi-node or specialized environment is unavailable, separate static support from unexecuted network behavior and state precisely what remains unproven.
