import test from "node:test";
import assert from "node:assert/strict";

import { validRedTeamResult } from "./helpers/red-team.mjs";
import {
  RED_TEAM_RESULT_KEYS,
  validateRedTeamResult,
  validateRedTeamAgainstTechnical,
} from "../scripts/red-team.mjs";

function check(mutate) {
  const result = validRedTeamResult();
  mutate(result);
  return validateRedTeamResult(result);
}

function assertRejects(mutate, pattern) {
  const errors = check(mutate);
  assert.ok(errors.length > 0, "expected the result to be rejected");
  assert.ok(
    errors.some((error) => pattern.test(error)),
    `expected an error matching ${pattern}; received: ${JSON.stringify(errors, null, 2)}`,
  );
}

function assertAccepts(mutate) {
  const errors = check(mutate);
  assert.deepEqual(errors, [], "expected the result to be accepted");
}

test("accepts the canonical challenged-and-survived result", () => {
  assert.deepEqual(validateRedTeamResult(validRedTeamResult()), []);
});

test("rejects a non-object result", () => {
  assert.deepEqual(validateRedTeamResult(null), ["red_team_validation result must be an object"]);
  assert.deepEqual(validateRedTeamResult([]), ["red_team_validation result must be an object"]);
});

test("requires every red_team result field", () => {
  for (const key of RED_TEAM_RESULT_KEYS) {
    assertRejects((result) => delete result[key], new RegExp(`missing red_team result field: ${key}`));
  }
});

test("rejects unknown status and verdict vocabulary", () => {
  assertRejects((result) => { result.status = "probably_fine"; }, /status must be one of/);
  assertRejects((result) => { result.red_team_verdict = "looks_bad"; }, /red_team_verdict must be one of/);
});

test("requires the challenge to name the finding technical validation produced", () => {
  assertRejects(
    (result) => { result.challenged_finding.source_phase = "eligibility_gate"; },
    /source_phase must be technical_validation/,
  );

  const result = validRedTeamResult();
  assert.deepEqual(validateRedTeamAgainstTechnical(result, { technical_verdict: "supported" }), []);
  assert.match(
    validateRedTeamAgainstTechnical(result, { technical_verdict: "uncertain" })[0],
    /does not match the technical_validation verdict/,
  );
  assert.deepEqual(
    validateRedTeamAgainstTechnical(result, null),
    ["red_team_validation requires a completed technical_validation result"],
  );
});

test("requires all five challenge axes", () => {
  assertRejects(
    (result) => { result.challenge_matrix = result.challenge_matrix.filter((entry) => entry.axis !== "privileges"); },
    /challenge_matrix is missing the mandatory axis: privileges/,
  );
});

test("refuses a finding that was never actually challenged", () => {
  assertRejects((result) => { result.defender.challenges = []; }, /may not pass unchallenged/);
});

test("requires evidence behind a demonstrated prosecutor element", () => {
  assertRejects(
    (result) => { result.prosecutor.elements.entry_point.evidence = []; },
    /prosecutor\.elements\.entry_point\.evidence must cite at least one evidence item/,
  );
  assertRejects(
    (result) => { result.prosecutor.elements.entry_point.basis = "obvious"; },
    /basis must be demonstrated or assumed/,
  );
});

test("requires evidence refs a reviewer can open", () => {
  assertRejects((result) => { result.decisive_facts[0].evidence[0].ref = "   "; }, /must cite a concrete ref/);
  assertRejects((result) => { result.decisive_facts[0].evidence[0].kind = "vibes"; }, /unknown evidence kind/);
});

test("requires counterexamples to anchor on something concrete", () => {
  assertRejects((result) => {
    delete result.counterexamples[0].function;
    delete result.counterexamples[0].condition;
  }, /must anchor on at least one of function, condition, state, call_sequence, location/);
});

test("rejects counterexample references to unknown assumptions or steps", () => {
  assertRejects(
    (result) => { result.counterexamples[0].refutes_assumptions = ["A99"]; },
    /references an unknown assumption id: A99/,
  );
  assertRejects(
    (result) => { result.counterexamples[0].blocks_steps = [9]; },
    /references a step outside the attack path: 9/,
  );
});

test("requires contiguous attack path steps", () => {
  assertRejects((result) => { result.attack_path[2].step = 7; }, /step must be 3; attack path steps are contiguous/);
});

test("rejects an unrecognised actor class instead of assuming privilege", () => {
  assertRejects((result) => { result.attack_path[1].actor_class = "hacker"; }, /actor_class must be one of/);
});

// Unknown is not false.

test("UNSUPPORTED requires contradicting evidence, not missing evidence", () => {
  assertRejects((result) => {
    // Nothing decisive opposes the impact axis: only a plausible reading remains.
    result.defender.challenges[1].strength = "plausible";
    result.adjudication.impact = "UNSUPPORTED";
    result.adjudication.counterargument_defeats_finding = "yes";
    result.red_team_verdict = "ready_with_changes";
    result.status = "weakened";
  }, /adjudication\.impact is UNSUPPORTED but no decisive or strong counterexample with evidence targets it/);
});

test("UNSUPPORTED is accepted when a decisive counterexample targets the axis", () => {
  assertAccepts((result) => {
    result.adjudication.impact = "UNSUPPORTED";
    result.adjudication.counterargument_defeats_finding = "yes";
    result.counterexamples[0].strength = "decisive";
    result.status = "weakened";
    result.red_team_verdict = "ready_with_changes";
  });
});

test("a defender challenge alone does not carry an UNSUPPORTED axis", () => {
  // defender.challenges[1] is strong, evidenced, and targets impact, but a
  // challenge is prose. Only an anchored counterexample can refute.
  assertRejects((result) => {
    result.adjudication.impact = "UNSUPPORTED";
    result.adjudication.counterargument_defeats_finding = "yes";
    result.counterexamples[0].targets = ["severity_claim"];
    result.status = "weakened";
    result.red_team_verdict = "ready_with_changes";
  }, /adjudication\.impact is UNSUPPORTED but no decisive or strong counterexample with evidence targets it/);
});

test("UNKNOWN requires a recorded unresolved question", () => {
  assertRejects((result) => {
    result.adjudication.severity_claim = "UNKNOWN";
    result.status = "insufficient_evidence";
    result.red_team_verdict = "needs_information";
  }, /adjudication\.severity_claim is UNKNOWN but no unresolved question blocks that axis/);

  assertAccepts((result) => {
    result.adjudication.severity_claim = "UNKNOWN";
    result.severity_challenge.severity_support = "UNKNOWN";
    result.status = "insufficient_evidence";
    result.red_team_verdict = "needs_information";
    result.unresolved_questions = [{
      id: "Q1",
      question: "Does the program classify stranded rewards as permanent freezing?",
      blocks: ["severity_claim"],
      how_to_resolve: "Read the program impact table for the smart-contract asset class.",
    }];
  });
});

test("IMPOSSIBLE requires a decisive counterexample that refutes the assumption", () => {
  assertRejects((result) => {
    result.assumptions[3].status = "IMPOSSIBLE";
    result.assumptions[3].evidence = [{ kind: "code", ref: "contracts/RewardVault.sol:300" }];
  }, /assumption A4 is IMPOSSIBLE but no decisive or strong counterexample refutes it/);
});

test("a BLOCKED path step requires a decisive counterexample that blocks it", () => {
  assertRejects((result) => {
    result.attack_path[1].status = "BLOCKED";
    result.adjudication.attack_path = "PARTIALLY_SUPPORTED";
    result.adjudication.technical_claim = "PARTIALLY_SUPPORTED";
    result.red_team_verdict = "ready_with_changes";
  }, /attack_path step 2 is BLOCKED but no decisive or strong counterexample blocks that step/);
});

// False acceptance.

test("a SUPPORTED attack path cannot contain a blocked or unknown link", () => {
  assertRejects((result) => { result.attack_path[3].status = "UNKNOWN"; },
    /adjudication\.attack_path is SUPPORTED but step 4 is UNKNOWN/);
});

test("an unproven decisive assumption caps the technical claim", () => {
  assertRejects((result) => {
    result.assumptions[0].status = "UNPROVEN";
    result.assumptions[0].evidence = [];
    result.adjudication.unresolved_assumptions = ["A1"];
  }, /technical_claim is SUPPORTED but decisive assumption A1 is UNPROVEN/);
});

test("an impossible decisive assumption forces an unsupported technical claim", () => {
  assertRejects((result) => {
    result.assumptions[0].status = "IMPOSSIBLE";
    result.counterexamples[0].strength = "decisive";
    result.counterexamples[0].refutes_assumptions = ["A1"];
    result.counterexamples[0].targets = ["technical_claim", "attack_path", "impact"];
  }, /decisive assumption A1 is IMPOSSIBLE, so adjudication\.technical_claim must be UNSUPPORTED/);
});

test("impact cannot be SUPPORTED when it is only inferred", () => {
  assertRejects((result) => {
    result.prosecutor.elements.impact.basis = "assumed";
    result.prosecutor.elements.impact.evidence = [];
  }, /adjudication\.impact is SUPPORTED but prosecutor\.elements\.impact\.basis is not demonstrated/);
});

test("a technical anomaly is not an impact", () => {
  assertRejects((result) => { result.severity_challenge.impact_class = "technical_anomaly"; },
    /severity_challenge\.impact_class is only a technical_anomaly/);
});

// False rejection.

test("speculation cannot refute a finding", () => {
  assertRejects((result) => {
    result.status = "refuted";
    result.red_team_verdict = "invalid_claim";
  }, /status refuted requires at least one decisive counterexample/);
});

test("refuted requires an unsupported adjudication axis", () => {
  assertRejects((result) => {
    result.status = "refuted";
    result.red_team_verdict = "invalid_claim";
    result.counterexamples[0].strength = "decisive";
  }, /status refuted requires at least one UNSUPPORTED adjudication axis/);
});

test("a defeated finding must name the axis the counterargument defeated", () => {
  assertRejects((result) => {
    result.adjudication.counterargument_defeats_finding = "yes";
    result.red_team_verdict = "ready_with_changes";
  }, /counterargument_defeats_finding = yes requires at least one UNSUPPORTED adjudication axis/);
});

// Severity is challenged independently of the technical claim.

test("an unsupported severity claim does not invalidate a supported technical claim", () => {
  assertRejects((result) => {
    result.adjudication.severity_claim = "UNSUPPORTED";
    result.severity_challenge.severity_support = "UNSUPPORTED";
    result.defender.challenges[1].targets = ["severity_claim"];
    result.red_team_verdict = "invalid_claim";
    result.status = "refuted";
    result.counterexamples[0].strength = "decisive";
    result.counterexamples[0].targets = ["severity_claim"];
  }, /must not invalidate a supported technical claim/);

  assertAccepts((result) => {
    result.adjudication.severity_claim = "UNSUPPORTED";
    result.severity_challenge.severity_support = "UNSUPPORTED";
    result.severity_challenge.unproven_dependencies = ["Sustained price impact beyond one block"];
    result.counterexamples[0].strength = "strong";
    result.counterexamples[0].targets = ["severity_claim"];
    result.red_team_verdict = "ready_with_changes";
    result.status = "weakened";
  });
});

test("a supported severity claim cannot rest on unproven dependencies", () => {
  assertRejects(
    (result) => { result.severity_challenge.unproven_dependencies = ["Attacker can repeat the rollover every epoch"]; },
    /severity_claim is SUPPORTED but severity_challenge\.unproven_dependencies is not empty/,
  );
});

// Verdict coherence.

test("verdict vocabulary must match the adjudicated state", () => {
  assertRejects((result) => {
    result.red_team_verdict = "invalid_claim";
  }, /red_team_verdict invalid_claim requires status refuted/);

  assertRejects((result) => {
    result.adjudication.technical_claim = "PARTIALLY_SUPPORTED";
  }, /red_team_verdict technically_valid requires adjudication\.technical_claim = SUPPORTED/);

  assertRejects((result) => {
    result.red_team_verdict = "needs_information";
  }, /red_team_verdict needs_information requires at least one UNKNOWN adjudication axis/);

  assertRejects((result) => {
    result.status = "insufficient_evidence";
  }, /status insufficient_evidence requires at least one UNKNOWN adjudication axis/);

  assertRejects((result) => {
    result.status = "withstood";
    result.adjudication.technical_claim = "UNSUPPORTED";
    result.adjudication.counterargument_defeats_finding = "yes";
    result.counterexamples[0].strength = "decisive";
    result.counterexamples[0].targets = ["technical_claim"];
    result.red_team_verdict = "unsupported";
  }, /status withstood conflicts with adjudication\.technical_claim = UNSUPPORTED/);
});

test("unresolved assumptions are exposed rather than buried in the verdict", () => {
  assertRejects((result) => {
    result.assumptions[3].status = "UNPROVEN";
  }, /adjudication\.unresolved_assumptions must list unresolved assumption A4/);

  assertRejects((result) => {
    result.adjudication.unresolved_assumptions = ["A42"];
  }, /unresolved_assumptions references an unknown assumption id: A42/);

  assertAccepts((result) => {
    result.assumptions[3].status = "UNPROVEN";
    result.adjudication.unresolved_assumptions = ["A4"];
  });
});

test("duplicate assumption ids are rejected", () => {
  assertRejects((result) => { result.assumptions[3].id = "A1"; }, /id is duplicated: A1/);
});
