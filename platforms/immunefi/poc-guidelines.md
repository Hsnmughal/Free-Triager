# Immunefi PoC Guidelines

Provenance: concise operational extraction from a user-supplied Immunefi Help Center snapshot labeled “Updated” and supplied on 2026-09-15. Treat this as platform guidance, subordinate to the live program page and any newer official rule presented during a run.

Read this file during `program_policy` when extracting PoC requirements and during `technical_validation` when judging PoC compliance.

## Requirement gate

- Determine whether a PoC is required from the specific program page and its severity table. Do not assume the requirement applies to every program or every severity.
- Program-specific additional requirements override this baseline.
- If the project asks for verification information and the researcher refuses to provide it, treat the PoC as invalid under this snapshot.

## Smart-contract PoCs

A compliant PoC should:

- demonstrate the vulnerability and claimed impact with runnable exploit code;
- run locally against a fork of the relevant mainnet state, commonly with Foundry or Hardhat;
- avoid testing against public mainnet or public testnets;
- identify dependencies, configuration, environment variables, fork block, addresses, and exact run command;
- use comments or output statements to show each attack step and relevant before/after state, including funds stolen, frozen, or otherwise affected;
- be complete rather than a partial sketch, pseudocode, screenshot of code, or prose-only call sequence;
- include an evidence-based funds-at-risk calculation when relevant.

The supplied sources say both that unit-test PoCs are not accepted and that a Hardhat/Foundry test file can be a valid attack script. Apply the narrow reconciliation: a test-shaped file is acceptable when it executes a runnable exploit against a local mainnet fork; a mocked-only unit test that merely asserts isolated project logic is not sufficient. If the live program or current platform rule clarifies this differently, follow that rule and record the conflict.

For a DoS demonstration, require prior permission from the project through the dashboard. Never run a DoS merely to validate a report.

## Blockchain/DLT PoCs

Apply the live program's Blockchain/DLT requirement without forcing smart-contract fork tooling onto node or protocol findings. A reproducible demonstration should identify the affected client/version, configuration and roles, required topology or timing, exact messages/transactions/actions, run commands, and observable logs or state showing the claimed network effect. Use a local network, simulator, fixture, or other program-permitted environment; never test disruptive behavior on a public network.

When the required multi-node or specialized environment is unavailable, distinguish static support from unexecuted behavior and identify the exact evidence still needed. Tool or infrastructure unavailability is not itself a failed PoC.

## Web/app PoCs

Acceptable forms under the supplied snapshot may include:

- a minimally invasive video with a brief explanation and the corresponding HTTP request;
- screenshots demonstrating the final result;
- HTTP requests;
- command-line or other runnable code;
- minimally invasive proof of a subdomain or external-link takeover.

Black-box testing must not take down the application. Obtain project permission first if a proposed demonstration may do so.

## Safety rules

- Use harmless JavaScript payloads that do not affect other users or disrupt the application.
- Make only the smallest necessary website edit; prefer non-visible proof such as an HTML comment.
- Never upload a webshell. Use an empty or non-executable text file when upload behavior must be demonstrated.
- Do not access sensitive information, change state, or disclose the vulnerability beyond what is necessary to prove and submit it.
- Do not execute untrusted report code before inspecting it, and never use Free Triager to test live targets.

## Compliance output

For each applicable item, record `pass`, `fail`, `not_applicable`, or `unknown`, with evidence. A missing required artifact should normally produce `needs_information`; an explicitly noncompliant or non-runnable submitted PoC may support `ready_with_changes` or rejection depending on the live program rule.
