# Free Triager

Free pre-submission triage for vulnerability reports.

[![Version](https://img.shields.io/badge/version-0.1.0-2ea44f?style=flat-square)](VERSION) [![MIT License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE) [![Validate](https://github.com/Hsnmughal/Free-Triager/actions/workflows/validate.yml/badge.svg)](https://github.com/Hsnmughal/Free-Triager/actions/workflows/validate.yml)

[![Claude Code](https://img.shields.io/badge/Claude_Code-F5E6D0?style=for-the-badge&logo=anthropic&logoColor=1a1a1a)](https://claude.ai/download) [![Cursor](https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white)](https://cursor.com/) [![Codex](https://img.shields.io/badge/Codex-000000?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/index/introducing-codex/) [![GitHub Copilot](https://img.shields.io/badge/GitHub_Copilot-000000?style=for-the-badge&logo=githubcopilot&logoColor=white)](https://github.com/features/copilot) [![Windsurf](https://img.shields.io/badge/Windsurf-0062FF?style=for-the-badge&logo=windsurf&logoColor=white)](https://www.windsurf.com/)

---

Free Triager checks whether a finding is technically valid, eligible under a bug bounty program's rules and scope, and ready for the platform's submission process. Its purpose is to catch preventable rejection risks before a security researcher pays a submission fee.

> [!IMPORTANT]
> Free Triager provides an evidence-based assessment, not a guarantee that a platform or project will accept a report.

## Why I Made Free Triager

I made Free Triager after seeing fellow security researchers lose submission fees before their reports received meaningful human review. A technically valid vulnerability can still be rejected because its proof of concept does not follow the platform's requirements, its claimed asset or impact is outside the program's scope, or the report conflicts with a program-specific rule.

This has become especially important on Immunefi, where automated front-line triage such as Andrew can reject a submission before a human reviews its technical merits. Submission fees can range from tens to hundreds of dollars, depending on the platform and submission tier. Discovering a formatting, scope, or proof-of-concept problem only after submission wastes the researcher's money and can also create avoidable appeals and manual review work for the platform.

Free Triager performs that review before submission. It is designed to help researchers find genuine weaknesses in their report, fix eligible reports, and avoid paying to submit reports that are known issues, out of scope, technically unsupported, or inconsistent with the applicable rules.

## What It Checks

Free Triager evaluates four separate questions:

<table>
<tr><td><strong>Technical validity:</strong></td><td>Does the reported behavior exist, and is the claimed attack path realistic and reproducible?</td></tr>
<tr><td><strong>Program eligibility:</strong></td><td>Are the affected asset, impact, assumptions, and attack conditions covered by the program's current rules?</td></tr>
<tr><td><strong>Submission readiness:</strong></td><td>Does the report and its proof of concept satisfy the platform's submission requirements?</td></tr>
<tr><td><strong>Rejection risk:</strong></td><td>Which specific issues could cause automated or human triage to reject or downgrade the report, and how should they be corrected?</td></tr>
</table>

It keeps automated-triage readiness separate from the underlying technical merits. A valid but poorly presented report is not treated as an invalid vulnerability.

## Supported Platforms

| Platform | Status | Platform-specific behavior |
|---|---|---|
| Immunefi | v1 supported | Scope and impact rules, known issues, proof-of-concept requirements, report structure, and Andrew-facing submission readiness |

The architecture uses independent platform adapters. Future platforms can be added without changing the core triage workflow.

## Supported Technologies

Free Triager is technology-neutral. It derives the relevant technology and validation approach from the report, program, and available evidence.

<table>
<tr><td>Smart contracts, regardless of language or virtual machine</td><td>Web and application targets</td></tr>
<tr><td>Blockchain and distributed-ledger implementations</td><td>Mixed findings that cross contracts, applications, nodes, bridges, or other system boundaries</td></tr>
</table>

## Required Inputs

<table>
<tr><td>The report, supplied as a file path or pasted text</td><td>The program's public URL</td></tr>
<tr><td>A workflow mode: <code>oneshot</code> or <code>dynamic</code></td><td>An optional path to the codebase; If not provided the current directory will be used by default as codebase path</td></tr>
</table>

## Workflow Modes

| Mode | Best for | Persistence |
|---|---|---|
| `oneshot` | Models and plans with enough context for the complete assessment | Memory only; creates no session, ledger, checkpoint, cache, or copied report |
| `dynamic` | Smaller context windows, compaction, or migration to another task | Completes one phase per invocation and saves an append-only JSONL checkpoint |

In dynamic mode, resume with:

```text
$free-triager resume=<absolute-session-directory>
```

The saved program URL is reopened before every resumed phase so the next task uses fresh program evidence instead of relying on compacted conversation history.

## Installation

Install or copy this repository into a coding agent's supported skills directory. The skill entrypoint is [`SKILL.md`](SKILL.md), and its name is `free-triager`.

The instructions and workflow are provider-neutral. Provider-specific metadata under `agents/` is optional and does not control the core assessment.

## Usage

Provide every known input in the initial invocation. Free Triager asks only for required information that is missing.

```text
$free-triager "C:\path\to\report.md" https://immunefi.com/bug-bounty/example/information/ oneshot "C:\path\to\codebase"
```

For a checkpointed run:

```text
$free-triager "C:\path\to\report.md" https://immunefi.com/bug-bounty/example/information/ dynamic "C:\path\to\codebase"
```

The final assessment distinguishes technical validity, eligibility, severity, automated-triage readiness, human-review merits, unresolved evidence, and recommended report improvements.

Free Triager reviews reports by default. It modifies a report only when the user explicitly requests a revision after reviewing the assessment, and it preserves the original unless overwrite is explicitly requested.

## Privacy

Vulnerability reports and dynamic session data may be highly confidential. Dynamic runs are stored under `.free-triager/`, which is excluded from version control by this repository's [`.gitignore`](.gitignore).

Before sharing logs, fixtures, issues, or pull requests:

> [!CAUTION]
> Remove undisclosed vulnerability details and proof-of-concept secrets.  
> Remove session data, authentication material, cookies, and tokens.  
> Obtain permission before publishing real reports or platform communications.  
> Prefer synthetic or fully anonymized examples.

## ☕ Free Triager Saved You a Fee?

> [!TIP]
> **If Free Triager helped you avoid a submission fee, consider buying me a coffee. ☕**
>
> **Evm:** `0xcc785a11f063c589946e413686a63c313b161e4b`
> **Solana:** `5WnXPkxEnHVk1CdTcSbyA4YJqFSijecU4vFe28ZXydR8` 
>
> Thanks for supporting the project! ❤️

---

## Contributing · Security · License · Contact

See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing workflow, platform, or policy changes. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Do not disclose vulnerabilities or confidential reports in a public issue. Follow [SECURITY.md](SECURITY.md) for private reporting guidance.

Free Triager is available under the [MIT License](LICENSE).

[![Website](https://img.shields.io/badge/Website-FF5722?style=for-the-badge&logo=googlechrome&logoColor=white)](https://hsnmughal.surge.sh/) [![X](https://img.shields.io/badge/@hsnmughal__-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/hsnmughal_) ![Discord](https://img.shields.io/badge/Discord-hsnmughal-5865F2?style=for-the-badge&logo=discord&logoColor=white)
