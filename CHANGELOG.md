# Changelog

All notable changes to Free Triager will be documented in this file.

## 0.2.0 - Unreleased

- Added the `red_team_validation` phase between technical validation and the verdict.
- Added the Prosecutor, Defender, and Adjudicator roles, the five-axis challenge matrix, the assumption ledger, the minimal attack path, and the severity challenge.
- Added `scripts/red-team.mjs`, an independently testable validator for the adversarial phase result.
- Added the separation of `UNSUPPORTED`, `UNKNOWN`, and `IMPOSSIBLE`, so absence of proof is no longer recorded as refutation.
- Added 14 adversarial regression fixtures covering both false rejection and false acceptance.
- Added `red_team_summary` and `severity_confidence` to the verdict result, so an unsupported severity claim no longer invalidates a supported technical claim.
- Renumbered the verdict and revision workers to `06` and `07` for the new phase order.

## 0.1.0 - Unreleased

- Added the technology-neutral triage workflow.
- Added the Immunefi v1 platform adapter.
- Added memory-only oneshot mode.
- Added checkpointed dynamic mode with verified JSONL resume state.
- Added smart-contract, web/app, Blockchain/DLT, and mixed-system routing.
