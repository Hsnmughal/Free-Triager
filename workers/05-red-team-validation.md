# Worker: Red-Team Validation

Goal: attack the technically validated finding and determine what survives.

Technical validation asks whether evidence supports the report. This phase asks the opposite question:

> If this report were wrong, how could I prove it wrong?

Open the challenge from the assumption that the finding is incorrect, then look for the strongest technically credible argument against it. Report what that argument actually establishes — not what it insinuates.

## Scope

Run this phase on every finding that reaches it. A finding is never accepted unchallenged.

This phase does not re-derive the technical analysis, re-open program policy, or re-litigate eligibility. It receives the `technical_validation` checkpoint and the evidence already gathered, and adjudicates it. Record the incoming verdict in `challenged_finding.technical_verdict`; it must match the verdict technical validation produced, so the challenge is aimed at the real finding rather than a softened restatement of it.

Policy reasoning stays subordinate to technical reasoning here. Answer in this order:

```text
Is the behavior real?
        -> Is the attack path real?
                -> Is the impact real?
                        -> Is the finding eligible?
                                -> Is the submitted claim correctly framed?
```

A technically valid behavior described badly is a framing problem, not an invalid claim.

## Challenge matrix

Challenge all five axes. Each returns a `finding`, a `support` level, and evidence.

**`reachability`.** Can the alleged vulnerable path be reached at all? Can the attacker control the required inputs? Are there hidden guards, earlier validation steps, or state requirements that cannot be satisfied? Is the vulnerable branch reachable under the program's actual execution model?

**`preconditions`.** Enumerate every precondition exploitation requires, and classify each in the assumption ledger. A report does not get to convert an unproven precondition into a fact by restating it confidently.

**`privileges`.** Classify the actor at each transition as `permissionless`, `ordinary_user`, `authorized_user`, `trusted_role`, `administrator`, `protocol_controlled`, or `external_dependency`. Do not assume the attacker is privileged merely because the path passes through a privileged function, and do not dismiss the finding merely because privileged functionality appears somewhere in the chain. Decide whether the attacker can actually obtain or trigger the required capability.

**`state`.** Challenge balances, ownership, accounting state, initialization, configuration, timestamps, block state, protocol parameters, external contract state, oracle state, liquidity, sequencing, race conditions, and upgrade state. Two separate questions: can the required state exist, and can the attacker cause it to exist?

**`impact`.** Separate a `technical_anomaly` from an `economic_consequence`, `security_consequence`, `user_consequence`, or `protocol_consequence`. Determine whether the claimed impact actually follows from the demonstrated behavior. A suspicious state transition is not an impact.

## Prosecutor

The Prosecutor argues the finding is valid and must establish six elements, each marked `demonstrated` or `assumed`:

1. `attacker_capability`;
2. `entry_point`;
3. `required_state`;
4. `execution_path`;
5. `violated_property`;
6. `impact`.

Mark an element `demonstrated` only with evidence attached. An element the report asserts without support is `assumed`, however plausible it reads. `adjudication.impact` cannot be `SUPPORTED` while `impact` is merely `assumed`.

## Defender

The Defender tries to break the claim, and should be adversarial rather than merely skeptical. Its objective is to find a technically valid break if one exists. Search for unreachable paths, missing preconditions, incorrect assumptions, privilege barriers, state constraints, invariant-preserving behavior, mitigations elsewhere in the code, incorrect impact assumptions, scope problems, and alternative explanations of the same code.

Each challenge carries an `axis`, the adjudication axes it `targets`, a `strength`, and evidence. Rate strength honestly:

- `decisive`: the evidence establishes the point;
- `strong`: the evidence makes the point very likely;
- `plausible`: a credible reading that the evidence does not establish;
- `speculative`: possible, unsupported.

A `decisive` or `strong` challenge requires evidence. Speculation is recorded, not weaponized.

## Counterexamples

Construct concrete counterexamples. Each must anchor on at least one of `function`, `condition`, `state`, `call_sequence`, or `location`, and give a `reason`. Prefer:

```text
"The attacker cannot reach settle() because _onlyRouter() is enforced at entry (Router.sol:88)."
```

over:

```text
"This probably is not reachable in practice."
```

Typical shapes:

- the attacker cannot reach function X because condition Y is always enforced;
- the attacker controls input A, but input B is independently constrained;
- the reported state can exist, but the attacker cannot cause it;
- the vulnerable condition exists, but the resulting value is never consumed in a security-sensitive operation;
- the claimed loss requires an assumption the program does not support;
- the apparent privilege escalation grants no capability the attacker does not already hold;
- the attack path terminates before the claimed impact occurs.

When a counterexample refutes a ledger assumption or blocks a path step, name it in `refutes_assumptions` or `blocks_steps`. An assumption may be marked `IMPOSSIBLE`, and a path step `BLOCKED`, only when a `decisive` or `strong` counterexample names it.

## Assumption ledger

Every finding carries an explicit ledger. Each assumption records an `id`, a `statement`, a `status`, whether it is `decisive`, and evidence:

```text
ASSUMPTION A  The attacker can call X.                      Status: PROVEN
ASSUMPTION B  The attacker can satisfy Y.                   Status: UNPROVEN
ASSUMPTION C  State Z can exist.                            Status: PROVEN
ASSUMPTION D  State Z produces the claimed financial loss.  Status: PARTIALLY_SUPPORTED -> record as INFERRED
```

Statuses are `PROVEN`, `INFERRED`, `UNPROVEN`, `IMPOSSIBLE`, and `UNKNOWN`. `PROVEN` and `IMPOSSIBLE` require evidence. An assumption is `decisive` when the technical claim itself fails if the assumption fails; an assumption that only carries the impact or the severity claim is not decisive, and the counterexample targeting that axis carries it instead. Every `UNPROVEN` or `UNKNOWN` assumption must also appear in `adjudication.unresolved_assumptions`: unresolved assumptions are exposed, never folded into the verdict.

A decisive assumption that is `UNPROVEN` or `UNKNOWN` caps `adjudication.technical_claim` below `SUPPORTED`. A decisive assumption that is `IMPOSSIBLE` forces `UNSUPPORTED`.

## Minimal attack path

Reduce the exploit to the smallest credible chain, one link per transition, numbered from 1:

```text
attacker -> entry point -> controlled input -> state transition -> security property violation -> impact
```

Each link records the `actor_class`, the `transition`, a `status` of `PROVEN`, `INFERRED`, `BLOCKED`, or `UNKNOWN`, and evidence. `PROVEN` and `BLOCKED` require evidence. This makes an unsupported link in the chain immediately visible, and `adjudication.attack_path` cannot be `SUPPORTED` while any link is `BLOCKED` or `UNKNOWN`.

## Severity challenge

Do not assign severity here. Challenge the severity the report claims. Record the `claimed_severity`, the `demonstrated_impact`, the `impact_class`, whether the effect is `reproducible`, `bounded`, `reversible`, and `persistent`, the `attacker_requirements`, the `policy_alignment` with the program's own impact classification, and every `unproven_dependency` the severity rests on.

If the technical finding holds but the severity claim does not, preserve the finding and downgrade the severity confidence. An unsupported severity claim never converts a supported technical claim into `invalid_claim` or `unsupported`.

## Adjudication

Evaluate the evidence; do not count arguments. A speculative Defender argument does not invalidate a finding, and a merely plausible Prosecutor argument does not validate one.

Adjudicate four claims as `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, or `UNKNOWN`: `technical_claim`, `attack_path`, `impact`, `severity_claim`. Then record `strongest_supporting_evidence`, `strongest_opposing_evidence`, `unresolved_assumptions`, `counterargument_defeats_finding`, and the `rationale`. Put the decisive technical facts in `decisive_facts`, each with a direction and evidence.

### Unknown is not false

These three are different and must not collapse into each other:

```text
FALSE        evidence contradicts the claim          -> UNSUPPORTED
NOT PROVEN   the claim is unestablished              -> PARTIALLY_SUPPORTED or UNKNOWN
UNKNOWN      evidence is insufficient to decide      -> UNKNOWN, with the question recorded
```

`UNSUPPORTED` requires a `decisive` or `strong` counterexample, with evidence, that targets that axis. A Defender challenge alone is not enough: a challenge is prose, while a counterexample is anchored on a function, condition, state, call sequence, or location, which is what a refutation has to be. `UNKNOWN` requires an entry in `unresolved_questions` naming that axis in `blocks`, with `how_to_resolve`. Lack of proof is never proof of impossibility.

## Failure modes

Do not reject a valid finding solely because the exploit is non-obvious, the attack path is long, the impact requires multiple transactions, a privileged component appears in the path, the PoC is incomplete while the behavior is demonstrable, or the report uses imperfect terminology.

Do not accept a finding solely because the code looks suspicious, an invariant appears violated without proven reachability, the PoC relies on impossible state, attacker capability is assumed, the claimed impact is inferred, or a theoretical attack is presented without a credible execution path.

## Evidence discipline

Every decisive assertion follows `claim -> evidence -> interpretation -> conclusion`, never `claim -> intuition -> verdict`. Evidence items carry a `kind` and a `ref` a reviewer can open: file and line, symbol, call path, request or trace id, configuration key, execution output, policy clause, or report section. Do not manufacture evidence, and do not fill a gap with an assumption presented as a fact.

## Result

Return `red_team_verdict` as one of `technically_valid`, `ready_with_changes`, `needs_information`, `out_of_scope`, `unsupported`, or `invalid_claim`, and `status` as one of `challenged`, `withstood`, `weakened`, `refuted`, or `insufficient_evidence`.

`invalid_claim` requires `refuted`, which requires a `decisive` counterexample and an `UNSUPPORTED` axis. `technically_valid` requires a `SUPPORTED` technical claim. `needs_information` requires an `UNKNOWN` axis.

Required `result` keys: `challenged_finding`, `status`, `prosecutor`, `defender`, `challenge_matrix`, `assumptions`, `attack_path`, `counterexamples`, `decisive_facts`, `unresolved_questions`, `severity_challenge`, `adjudication`, and `red_team_verdict`.

The structural and epistemic rules above are enforced by `scripts/red-team.mjs` in dynamic mode; apply them identically in oneshot mode, where no ledger validates the output.
