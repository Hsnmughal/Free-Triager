/**
 * Shared Red-Team test material.
 *
 * `validRedTeamResult()` returns a fresh, fully coherent `red_team_validation`
 * result: a finding that was challenged on all five axes and survived. Tests
 * mutate a copy of it so each assertion isolates exactly one rule.
 */

const BASELINE = {
  challenged_finding: {
    source_phase: "technical_validation",
    technical_verdict: "supported",
    claimed_impact: "Permanent freezing of unclaimed rewards for an unprivileged depositor",
    claimed_severity: "High",
  },
  status: "withstood",
  prosecutor: {
    strongest_claim:
      "A permissionless caller can front-run the epoch rollover so an ordinary depositor's accrued rewards become permanently unclaimable.",
    evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:214-238" }],
    elements: {
      attacker_capability: {
        statement: "Any address can call rollEpoch() once the epoch deadline has passed.",
        basis: "demonstrated",
        evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:196 (no access modifier)" }],
      },
      entry_point: {
        statement: "RewardVault.rollEpoch(uint256)",
        basis: "demonstrated",
        evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:196" }],
      },
      required_state: {
        statement: "At least one depositor has accrued rewards in the closing epoch and has not claimed them.",
        basis: "demonstrated",
        evidence: [{ kind: "state", ref: "fork test state dump: pendingRewards[user] = 4.1e18 at block 21004311" }],
      },
      execution_path: {
        statement: "rollEpoch() advances currentEpoch before settling pendingRewards, so the accrual is keyed to an epoch that can no longer be claimed.",
        basis: "demonstrated",
        evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:214-238" }],
      },
      violated_property: {
        statement: "Accrued rewards remain claimable by their owner across an epoch boundary.",
        basis: "demonstrated",
        evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:240 claim() reverts on epoch mismatch" }],
      },
      impact: {
        statement: "The depositor's accrued balance is unrecoverable; no administrative path restores it.",
        basis: "demonstrated",
        evidence: [{ kind: "execution", ref: "forge test -m testRolloverStrandsRewards: claim() reverts with EpochClosed" }],
      },
    },
  },
  defender: {
    strongest_counterargument:
      "The rollover is expected protocol maintenance, so the loss may be an accounting artifact that a later epoch settles.",
    evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:262 sweepStale()" }],
    challenges: [
      {
        axis: "reachability",
        statement: "rollEpoch() may be gated by the keeper allowlist configured at deployment.",
        strength: "plausible",
        targets: ["attack_path"],
        evidence: [],
      },
      {
        axis: "impact",
        statement: "sweepStale() might return stranded balances to their owners in a later epoch.",
        strength: "strong",
        targets: ["impact", "severity_claim"],
        evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:262-271" }],
      },
    ],
  },
  challenge_matrix: [
    {
      axis: "reachability",
      finding: "rollEpoch() carries no access modifier and no keeper allowlist exists in the deployed configuration.",
      support: "SUPPORTED",
      evidence: [{ kind: "config", ref: "deployments/mainnet/RewardVault.json: keeper == address(0)" }],
    },
    {
      axis: "preconditions",
      finding: "The only precondition is an unclaimed accrual in the closing epoch, which is the normal depositor state.",
      support: "SUPPORTED",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:180-194" }],
    },
    {
      axis: "privileges",
      finding: "The attacker is permissionless; no privileged actor participates in the path.",
      support: "SUPPORTED",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:196" }],
    },
    {
      axis: "state",
      finding: "The required state is reached by ordinary deposits and is attacker-independent.",
      support: "SUPPORTED",
      evidence: [{ kind: "state", ref: "fork test state dump at block 21004311" }],
    },
    {
      axis: "impact",
      finding: "sweepStale() forwards stranded balances to the treasury, not to the owner, so the loss is final.",
      support: "SUPPORTED",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:262-271" }],
    },
  ],
  assumptions: [
    {
      id: "A1",
      statement: "Any address can call rollEpoch() after the deadline.",
      status: "PROVEN",
      decisive: true,
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:196" }],
    },
    {
      id: "A2",
      statement: "An unclaimed accrual exists at the epoch boundary.",
      status: "PROVEN",
      decisive: true,
      evidence: [{ kind: "state", ref: "fork test state dump at block 21004311" }],
    },
    {
      id: "A3",
      statement: "No recovery path returns a stranded balance to its owner.",
      status: "PROVEN",
      decisive: true,
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:262-271 sends to treasury" }],
    },
    {
      id: "A4",
      statement: "The attacker profits from the rollover beyond denying the depositor.",
      status: "INFERRED",
      decisive: false,
      evidence: [],
    },
  ],
  attack_path: [
    {
      step: 1,
      actor_class: "permissionless",
      transition: "Attacker observes an unclaimed accrual approaching the epoch deadline.",
      status: "PROVEN",
      evidence: [{ kind: "state", ref: "pendingRewards[user] = 4.1e18 at block 21004311" }],
    },
    {
      step: 2,
      actor_class: "permissionless",
      transition: "Attacker calls rollEpoch() in the deadline block.",
      status: "PROVEN",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:196" }],
    },
    {
      step: 3,
      actor_class: "protocol_controlled",
      transition: "currentEpoch advances before pendingRewards is settled.",
      status: "PROVEN",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:214-238" }],
    },
    {
      step: 4,
      actor_class: "ordinary_user",
      transition: "Depositor calls claim() and the call reverts with EpochClosed.",
      status: "PROVEN",
      evidence: [{ kind: "execution", ref: "forge test -m testRolloverStrandsRewards" }],
    },
  ],
  counterexamples: [
    {
      id: "CE1",
      targets: ["impact"],
      function: "RewardVault.sweepStale()",
      condition: "epoch < currentEpoch - 1",
      reason:
        "sweepStale() could have returned the stranded balance, but it transfers to the treasury, so it does not neutralize the loss.",
      strength: "plausible",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:262-271" }],
    },
  ],
  decisive_facts: [
    {
      fact: "rollEpoch() advances the epoch counter before settling accrued rewards.",
      direction: "supports_finding",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:214-238" }],
    },
    {
      fact: "No code path returns a stranded balance to its owner.",
      direction: "supports_finding",
      evidence: [{ kind: "code", ref: "contracts/RewardVault.sol:262-271" }],
    },
  ],
  unresolved_questions: [],
  severity_challenge: {
    claimed_severity: "High",
    demonstrated_impact: "Permanent loss of an unprivileged depositor's accrued rewards",
    impact_class: "user_consequence",
    severity_support: "SUPPORTED",
    reproducible: "yes",
    bounded: "yes",
    reversible: "no",
    persistent: "yes",
    attacker_requirements: "None beyond gas; the entry point is permissionless.",
    policy_alignment: "Matches the program's permanent freezing of funds impact for smart contracts.",
    unproven_dependencies: [],
  },
  adjudication: {
    technical_claim: "SUPPORTED",
    attack_path: "SUPPORTED",
    impact: "SUPPORTED",
    severity_claim: "SUPPORTED",
    strongest_supporting_evidence: "The epoch counter advances before settlement at contracts/RewardVault.sol:214-238.",
    strongest_opposing_evidence: "sweepStale() exists and could have been a recovery path.",
    counterargument_defeats_finding: "no",
    unresolved_assumptions: [],
    rationale:
      "The only credible counterargument was a possible recovery path; reading it showed the balance goes to the treasury, so the loss stands.",
  },
  red_team_verdict: "technically_valid",
};

/** @returns {object} a fresh deep copy of the canonical valid Red-Team result. */
export function validRedTeamResult() {
  return structuredClone(BASELINE);
}

/**
 * Apply a dotted-path mutation, used by the regression fixtures to express a
 * failure mode as a single deviation from an otherwise valid result.
 *
 * @param {object} target object to mutate in place.
 * @param {string} dottedPath path such as `adjudication.impact` or `assumptions.1.status`.
 * @param {unknown} value new value, or the `"__delete__"` sentinel to remove the key.
 * @returns {object} the mutated target.
 */
export function applyMutation(target, dottedPath, value) {
  const segments = dottedPath.split(".");
  const last = segments.pop();
  let cursor = target;
  for (const segment of segments) {
    cursor = cursor[segment];
    if (cursor === undefined) throw new Error(`mutation path does not exist: ${dottedPath}`);
  }
  if (value === "__delete__") delete cursor[last];
  else cursor[last] = value;
  return target;
}
