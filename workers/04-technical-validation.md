# Worker: Technical Validation

Goal: determine whether the report's exploit and impact hold in the overall program and technological context under realistic stated conditions.

For Immunefi, use the PoC-guideline reference routed from the entrypoint and apply only the requirements activated by the live program-policy checkpoint.

## Technology-neutral routing

1. Use the target-classifier instructions routed from the entrypoint and derive `target_classification` from the report, program policy, eligibility result, and available evidence.
2. Read only the technical profiles routed from the entrypoint and named by `target_classification.required_profiles`.
3. If more than one category is material, also use the mixed profile and validate the cross-category boundary.
4. Derive languages, runtimes, frameworks, protocols, versions, configuration, and tools from the evidence. Never reject a claim because its technology is absent from a predefined list.

Validate:

- cited assets, components, interfaces, versions, configurations, files, functions, endpoints, or protocol elements;
- actor permissions, trust boundaries, and attacker capabilities;
- preconditions and whether each is proven, realistic, or speculative;
- exact actions, messages, requests, calls, and state/data transitions;
- relevant guards, recovery paths, and counterexamples;
- violated invariant;
- victim and measurable impact;
- exploit repeatability and economic/operational feasibility;
- PoC correctness against the program's actual category-specific requirement.

## Privileged-precondition analysis

Separate the actor causing the bug from a privileged actor performing an ordinary authorized operation. A sequence such as a normal blocklist, rescue, configuration update, or later restoration is not automatically “privileged exploitation” when the code defect subsequently harms an unprivileged user. Apply a privileged-action exclusion only when its wording actually covers the scenario.

Record:

- which actor performs each transition;
- whether each privileged action is malicious, mistaken, or normal operation;
- whether the attacker needs the privilege;
- whether an unprivileged victim is harmed later;
- the exact policy clause that includes or excludes the path.

Use source, local code, test environments, request/response evidence, traces, captures, screenshots, logs, configurations, binaries, or protocol artifacts as appropriate to the derived evidence mode. Run code or tests only when authorized, safe, and useful. Do not access live funds, production credentials, unrelated user data, or attack public systems. Inspect report-provided PoCs before execution; do not execute untrusted code blindly.

Keep PoC states precise: `executed_pass`, `executed_fail`, `statically_verified_not_executed`, `not_runnable`, or `not_inspected`. Tool unavailability is not a failed PoC. It is an execution-confidence limitation that must be disclosed and, where practical, handed to the user with an exact local run command.

Steelman the strongest realistic interpretation, then run an independent skeptic pass. Record both. Do not introduce new assumptions solely to rescue the report.

Return a claim matrix with `proven`, `supported`, `uncertain`, or `refuted`, plus the most precise available code, request, trace, configuration, or protocol citations. Use `invalid_claim` only when decisive evidence refutes the required path or impact.

## Handoff to Red-Team validation

This phase establishes the finding; the next phase attacks it. Do not pre-empt that challenge by discarding weak links here, and do not settle the adversarial question inside the skeptic pass. Leave the exploit path, preconditions, and privileged-precondition analysis stated precisely enough to be attacked: each precondition separated, each actor named at each transition, and each citation resolvable. `technical_verdict` is the input the Red-Team phase challenges, and it must match the verdict recorded there.

Required `result` keys: `target_classification`, `profile_results`, `claim_matrix`, `exploit_path`, `violated_invariant`, `privileged_precondition_analysis`, `poc_validation`, `poc_execution_status`, `poc_compliance_checklist`, `steelman`, `skeptic`, and `technical_verdict`. Keep the derived technology context inside `target_classification`; do not duplicate it at the result root.
