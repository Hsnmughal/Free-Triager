# Red-Team Validation

## Table of Contents

- [Why the phase exists](#why-the-phase-exists)
- [Where it sits](#where-it-sits)
- [Roles](#roles)
- [Vocabularies](#vocabularies)
- [Unknown is not false](#unknown-is-not-false)
- [Result shape](#result-shape)
- [Enforced rules](#enforced-rules)
- [Worked example: the counterargument fails](#worked-example-the-counterargument-fails)
- [Worked example: the counterargument wins](#worked-example-the-counterargument-wins)
- [Worked example: neither side wins](#worked-example-neither-side-wins)
- [Severity is challenged separately](#severity-is-challenged-separately)
- [Regression fixtures](#regression-fixtures)
- [Limits](#limits)

## Why the phase exists

Technical validation answers one question:

> Can I find evidence supporting this report?

A reviewer who only asks that question accumulates support for whatever the report already says. The Red-Team phase asks the other one:

> If this report were wrong, how could I prove it wrong?

Both questions are necessary. The first one alone produces confident false positives. The second one alone produces false negatives, which cost a researcher a valid finding.

## Where it sits

```text
prior_art
    -> program_policy
        -> eligibility_gate
            -> technical_validation
                -> red_team_validation
                    -> verdict_and_improvement
```

The existing phases keep their existing concerns. The Red-Team phase adds adversarial validation and nothing else: it does not re-open program policy, re-run eligibility, or re-derive the technical analysis. It receives the `technical_validation` result and adjudicates it, and its `challenged_finding.technical_verdict` must match the verdict that phase produced.

Policy reasoning stays subordinate to technical reasoning:

```text
Is the behavior real?
        -> Is the attack path real?
                -> Is the impact real?
                        -> Is the finding eligible?
                                -> Is the submitted claim correctly framed?
```

A behavior that is real but described badly is a framing problem. It is classified as `ready_with_changes`, not `invalid_claim`.

## Roles

| Role | Job | Must produce |
|---|---|---|
| Prosecutor | argue the finding is valid | attacker capability, entry point, required state, execution path, violated property, impact — each marked `demonstrated` or `assumed` |
| Defender | break the claim if a technically valid break exists | challenges on the five axes, each with a strength and, when decisive or strong, evidence |
| Adjudicator | weigh the evidence | four adjudicated claims, the strongest evidence on each side, the unresolved assumptions, and whether the counterargument actually defeats the finding |

The Defender is adversarial rather than merely skeptical: its objective is to find the break, not to express doubt. The Adjudicator does not count arguments. One decisive counterexample outweighs five speculative ones.

## Vocabularies

| Field | Values |
|---|---|
| `status` | `challenged`, `withstood`, `weakened`, `refuted`, `insufficient_evidence` |
| `adjudication.*` | `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `UNKNOWN` |
| `assumptions[].status` | `PROVEN`, `INFERRED`, `UNPROVEN`, `IMPOSSIBLE`, `UNKNOWN` |
| `attack_path[].status` | `PROVEN`, `INFERRED`, `BLOCKED`, `UNKNOWN` |
| `attack_path[].actor_class` | `permissionless`, `ordinary_user`, `authorized_user`, `trusted_role`, `administrator`, `protocol_controlled`, `external_dependency` |
| argument `strength` | `decisive`, `strong`, `plausible`, `speculative` |
| `red_team_verdict` | `technically_valid`, `ready_with_changes`, `needs_information`, `out_of_scope`, `unsupported`, `invalid_claim` |
| challenge axes | `reachability`, `preconditions`, `privileges`, `state`, `impact` |

An assumption is `decisive` when the technical claim itself fails if the assumption fails. An assumption that only carries the impact or the severity claim is not decisive; the counterexample targeting that axis carries it.

## Unknown is not false

These three states are distinct and the phase is built around keeping them apart:

```text
FALSE        the evidence contradicts the claim      -> UNSUPPORTED
NOT PROVEN   the claim is unestablished              -> PARTIALLY_SUPPORTED, with the assumption named
UNKNOWN      the evidence cannot decide              -> UNKNOWN, with the question recorded
```

`IMPOSSIBLE` is the strongest negative claim available and is reserved for conditions that cannot occur, evidenced. Lack of proof is never proof of impossibility.

## Result shape

```json
{
  "red_team": {
    "challenged_finding": { "source_phase": "technical_validation", "technical_verdict": "supported", "claimed_impact": "...", "claimed_severity": "High" },
    "status": "withstood",
    "prosecutor": { "strongest_claim": "...", "evidence": [], "elements": { "attacker_capability": { "statement": "...", "basis": "demonstrated", "evidence": [] } } },
    "defender": { "strongest_counterargument": "...", "evidence": [], "challenges": [] },
    "challenge_matrix": [],
    "assumptions": [],
    "attack_path": [],
    "counterexamples": [],
    "decisive_facts": [],
    "unresolved_questions": [],
    "severity_challenge": {},
    "adjudication": {
      "technical_claim": "SUPPORTED",
      "attack_path": "SUPPORTED",
      "impact": "PARTIALLY_SUPPORTED",
      "severity_claim": "UNSUPPORTED",
      "strongest_supporting_evidence": "...",
      "strongest_opposing_evidence": "...",
      "counterargument_defeats_finding": "no",
      "unresolved_assumptions": [],
      "rationale": "..."
    },
    "red_team_verdict": "ready_with_changes"
  }
}
```

This is the `result` object of the `red_team_validation` phase, carried on the existing worker output contract. It introduces no parallel data model and no new persistence path.

Evidence items are `{ "kind": "...", "ref": "..." }`, where `kind` is one of `code`, `request`, `response`, `trace`, `log`, `state`, `config`, `protocol`, `policy`, `execution`, `report`, or `external`, and `ref` points at something a reviewer can open: a file and line, a symbol, a call path, a request id, a configuration key, or a policy clause.

## Enforced rules

[`scripts/red-team.mjs`](../scripts/red-team.mjs) validates the result in dynamic mode. It never decides whether a finding is true; it enforces that the recorded conclusion is coherent and evidenced. The same rules apply in oneshot mode, where no ledger checks them.

Against false acceptance:

- `adjudication.attack_path` cannot be `SUPPORTED` while any link is `BLOCKED` or `UNKNOWN`;
- a decisive assumption that is `UNPROVEN` or `UNKNOWN` caps `technical_claim` below `SUPPORTED`;
- a decisive assumption that is `IMPOSSIBLE` forces `technical_claim` to `UNSUPPORTED`;
- `adjudication.impact` cannot be `SUPPORTED` while the prosecutor's impact element is only `assumed`, or while the impact class is merely a `technical_anomaly`;
- `severity_claim` cannot be `SUPPORTED` while the severity challenge lists unproven dependencies;
- a finding may not pass unchallenged: the Defender must record at least one challenge.

Against false rejection:

- `UNSUPPORTED` requires a `decisive` or `strong` counterexample, with evidence, targeting that axis. A Defender challenge alone is prose; a counterexample is anchored on a function, condition, state, call sequence, or location;
- `UNKNOWN` requires an unresolved question naming that axis, with `how_to_resolve`;
- `IMPOSSIBLE` requires a decisive or strong counterexample that names the assumption;
- a `BLOCKED` path link requires a counterexample that names the step;
- `status: refuted` requires a decisive counterexample and an `UNSUPPORTED` axis;
- an unsupported severity claim may not invalidate a supported technical claim.

Against buried uncertainty:

- every `UNPROVEN` or `UNKNOWN` assumption must appear in `adjudication.unresolved_assumptions`;
- `decisive_facts` entries require a direction and evidence;
- all five challenge axes must be answered.

## Worked example: the counterargument fails

Fixture [`01-valid-finding-survives-strong-counterargument`](../tests/fixtures/red-team/01-valid-finding-survives-strong-counterargument.json). A permissionless epoch rollover strands an unclaimed reward accrual.

**Prosecutor.** Any address can call `rollEpoch()` after the deadline (`RewardVault.sol:196`, no access modifier). The function advances `currentEpoch` before settling `pendingRewards` (`:214-238`), and `claim()` then reverts on epoch mismatch (`:240`). Executed: `claim()` reverts with `EpochClosed`. All six elements are `demonstrated`.

**Defender.** The strongest available counterargument is not that the code is fine, but that the loss may be temporary:

> `sweepStale()` exists at `:262-271` and may return stranded balances in a later epoch, in which case nothing is permanently lost.

This is a real function, so the challenge is rated `strong` and carries evidence. It targets `impact` and `severity_claim`.

**Adjudication.** Reading `sweepStale()` settles it: the balance is forwarded to the treasury, not to the owner. The counterargument was well-formed, evidenced, and wrong. It is recorded as a surviving counterexample at `plausible` strength rather than discarded, `counterargument_defeats_finding` is `no`, and all four claims are `SUPPORTED`.

The point of the fixture is that a strong counterargument that fails on its own evidence must not leave a mark on the verdict. Its mutation asserts exactly that: flipping `technical_claim` to `UNSUPPORTED` is rejected, because no counterexample refutes it.

## Worked example: the counterargument wins

Fixture [`04-missing-attacker-capability`](../tests/fixtures/red-team/04-missing-attacker-capability.json). The report claims an operator can redirect protocol fees.

**Prosecutor.** `setFeeSink()` validates nothing (`FeeRouter.sol:140-152`), the router holds 92 ETH of accrued fees, and the next `distribute()` pays the new sink. Five of six elements are `demonstrated`. The sixth, `attacker_capability`, is only `assumed`: the report asserts operator access without establishing it.

**Defender.** The challenge goes to the axis the Prosecutor left open:

> `OPERATOR_ROLE` is grantable only by the timelock (`AccessRegistry.sol:77`, `onlyTimelock`), whose proposer set is the governance multisig (`deployments/mainnet/Timelock.json`). No attacker-reachable path grants it.

Rated `decisive`, with two evidence items, targeting all four axes. It becomes counterexample CE1, anchored on `AccessRegistry.grantRole()` with the condition `msg.sender == timelock`, refuting assumption A1 and blocking step 1.

**Adjudication.** Assumption A1 is `IMPOSSIBLE` and decisive, which forces `technical_claim` to `UNSUPPORTED`. The path is blocked at its first link. The verdict is `invalid_claim`.

Note what is *not* claimed: the missing sink validation is real, and it stays in `decisive_facts` as `supports_finding`. The finding fails on capability, not on code quality.

## Worked example: neither side wins

Fixture [`10-impact-depends-on-undocumented-assumption`](../tests/fixtures/red-team/10-impact-depends-on-undocumented-assumption.json). Queue reordering pushes a withdrawal past its expiry.

**Prosecutor.** `reorder()` is permissionless and accepts arbitrary permutations (`Queue.sol:180-196`), and an executed test pushes entry 913 past its expiry block. The mechanism is `demonstrated`. The impact element is `assumed`.

**Defender.** The claimed loss depends on something outside the code:

> An off-chain keeper may re-run settlement within the epoch, in which case the entry clears and no loss occurs.

The program documents a keeper but not its retry policy. The evidence shows *absence of documentation*, not a contradiction, so this cannot license `UNSUPPORTED`.

**Adjudication.** `technical_claim` and `attack_path` are `PARTIALLY_SUPPORTED`. `impact` and `severity_claim` are `UNKNOWN`, each backed by a recorded question with a concrete way to resolve it: ask the program for the retry policy, or observe keeper transactions across several epochs. Assumption A3 is `UNPROVEN` and decisive, A4 is `UNKNOWN`, and both are listed in `unresolved_assumptions`. The verdict is `needs_information`.

The fixture's mutations pin both failure directions: flipping `impact` to `UNSUPPORTED` is rejected because nothing contradicts it, and flipping `technical_claim` to `SUPPORTED` is rejected because a decisive assumption is unproven.

## Severity is challenged separately

The phase does not assign severity. It challenges the severity the report claims, recording the demonstrated impact, the impact class, whether the effect is reproducible, bounded, reversible, and persistent, what the attacker actually needs, how the program's own impact table classifies it, and every unproven dependency the severity rests on.

Fixture [`08-correct-finding-exaggerated-severity`](../tests/fixtures/red-team/08-correct-finding-exaggerated-severity.json) is the case this exists for. The oracle staleness window is real and the extraction is demonstrated at 41 ETH, but the report claims protocol insolvency, and a per-block borrow cap bounds each event well below a 4,180 ETH reserve buffer. The result keeps `technical_claim: SUPPORTED` and sets `severity_claim: UNSUPPORTED`, with `red_team_verdict: ready_with_changes`.

Downgrading such a finding to `invalid_claim` or `unsupported` is rejected by the validator. The verdict phase then carries this into `severity_confidence` rather than into the technical assessment.

## Regression fixtures

[`tests/fixtures/red-team`](../tests/fixtures/red-team) holds 14 self-contained scenarios, driven by [`tests/red-team-regression.test.mjs`](../tests/red-team-regression.test.mjs):

| Fixture | Scenario |
|---|---|
| 01 | valid finding, strong counterargument that ultimately fails |
| 02 | invalid finding with convincing-looking initial evidence |
| 03 | unreachable vulnerable branch |
| 04 | missing attacker capability |
| 05 | impossible required state |
| 06 | privileged function correctly used by the protocol |
| 07 | privileged function that does enable attacker-controlled escalation |
| 08 | correct technical finding with exaggerated severity |
| 09 | correct finding with an incomplete proof of concept |
| 10 | impact depending on an undocumented assumption |
| 11 | downstream check that neutralizes the apparent vulnerability |
| 12 | multi-step finding where no function is vulnerable in isolation |
| 13 | program policy changing the classification but not the technical conclusion |
| 14 | insufficient evidence, where the correct result is `UNKNOWN` |

Each fixture is checked three ways: it must validate cleanly; its recorded reasoning state must match the expected assumption statuses, path link statuses, counterexample strengths, unresolved assumptions and adjudicated claims, not only the final verdict; and each declared mutation, encoding one predictable failure mode, must be rejected with the expected error.

Fixtures 06 and 07 are deliberately paired. Both put a privileged function in the attack path; one is normal privileged operation that grants the attacker nothing, the other is a real escalation reached through a permissionless wrapper. A layer that gets only one of them right is miscalibrated.

## Limits

This layer validates reasoning. It does not discover vulnerabilities, generate exploits, or execute anything. It cannot tell a well-argued wrong conclusion from a well-argued right one; what it can do is refuse a conclusion that is not supported by the evidence recorded alongside it, and refuse a rejection that rests on speculation or on missing evidence.

The strength ratings, the evidence refs, and the adjudication are produced by the worker. The validator checks that they hang together. A worker that rates a speculative argument `decisive` and attaches an irrelevant ref will still pass structurally, which is why the evidence refs must be resolvable by a human reviewer.
