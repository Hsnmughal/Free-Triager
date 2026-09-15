# Contributing to Free Triager

Contributions that improve triage accuracy, reduce false rejections, add platform support, or strengthen provider compatibility are welcome.

## Before You Contribute

- Do not include undisclosed vulnerabilities, private reports, credentials, authentication material, or confidential platform communications.
- Use synthetic or fully anonymized fixtures unless every affected party has authorized publication.
- Preserve the distinction between technical validity, program eligibility, submission readiness, and automated-triage risk.
- Do not turn one platform's terminology or behavior into a universal rule.
- Cite the provenance of platform rules and label user-supplied private guidance separately.

## Development

Free Triager requires no package installation for its current test suite. Use a maintained Node.js release and run:

```text
node --check scripts/session.mjs
node --test tests/session.test.mjs
```

Changes to the skill entrypoint should also be validated with the skill validator available in your agent environment, when applicable.

## Adding a Platform

Platform-specific behavior belongs under `platforms/<platform>/`. A new adapter must:

1. Declare its URL hosts and source-discovery behavior.
2. Define rule precedence without overriding explicit program terms.
3. Map platform terminology to the shared asset, impact, severity, and submission concepts.
4. Document proof-of-concept and report requirements using attributable sources.
5. Keep automated triage behavior platform-specific and separate from human-review merits.
6. Handle programs where primacy rules are absent.
7. Add synthetic evaluation cases and conformance tests.
8. Avoid changes to the core architecture unless the platform exposes a genuinely universal missing concept.

## Pull Requests

Keep pull requests focused. Explain:

- The behavior being changed and why.
- The evidence or real failure mode supporting the change.
- Which platforms, technologies, modes, and providers are affected.
- How the change was tested.
- Whether it changes persisted dynamic-session data or compatibility.

Do not edit expected output merely to make a failing test pass. Tests should protect observable behavior and workflow invariants rather than exact generated prose.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
