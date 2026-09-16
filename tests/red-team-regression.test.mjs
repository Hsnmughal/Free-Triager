/**
 * Adversarial regression suite.
 *
 * Each fixture in tests/fixtures/red-team is a complete `red_team_validation`
 * result for one scenario the Red-Team layer has to get right. Every fixture is
 * checked three ways:
 *
 *   1. it must validate cleanly, so a correct adversarial analysis is accepted;
 *   2. its recorded reasoning state must match `expectation`, so the suite pins
 *      the assumption statuses, path link statuses, evidence classification and
 *      adjudicated claims rather than only the final verdict;
 *   3. each declared mutation, which encodes one predictable failure mode, must
 *      be rejected with the expected error.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { applyMutation } from "./helpers/red-team.mjs";
import { validateRedTeamResult, validateRedTeamAgainstTechnical } from "../scripts/red-team.mjs";

const FIXTURE_DIR = path.resolve(import.meta.dirname, "fixtures", "red-team");

const fixtures = fs.readdirSync(FIXTURE_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => ({ name, ...JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), "utf8")) }));

test("the adversarial fixture set covers every required regression scenario", () => {
  assert.equal(fixtures.length, 14, "expected 14 adversarial regression fixtures");
  const ids = fixtures.map((fixture) => fixture.case_id);
  assert.equal(new Set(ids).size, ids.length, "fixture case ids must be unique");
  for (const fixture of fixtures) {
    assert.equal(fixture.name, `${fixture.case_id}.json`, "fixture file name must match its case id");
    for (const field of ["title", "scenario", "exercises", "expectation", "mutations", "result"]) {
      assert.ok(fixture[field], `${fixture.case_id} is missing ${field}`);
    }
    assert.ok(fixture.mutations.length > 0, `${fixture.case_id} must declare at least one failure-mode mutation`);
  }

  // The outcome space must be exercised in both directions, so the suite cannot
  // pass by being uniformly permissive or uniformly strict.
  const verdicts = new Set(fixtures.map((fixture) => fixture.result.red_team_verdict));
  for (const verdict of ["technically_valid", "ready_with_changes", "needs_information", "out_of_scope", "unsupported", "invalid_claim"]) {
    assert.ok(verdicts.has(verdict), `no fixture exercises the ${verdict} verdict`);
  }
});

for (const fixture of fixtures) {
  test(`${fixture.case_id}: a correct adversarial analysis is accepted`, () => {
    const errors = validateRedTeamResult(fixture.result);
    assert.deepEqual(errors, [], `${fixture.title}\n${JSON.stringify(errors, null, 2)}`);
  });

  test(`${fixture.case_id}: the reasoning state matches the expected adjudication`, () => {
    const { result, expectation } = fixture;

    assert.equal(result.status, expectation.status, "challenge status");
    assert.equal(result.red_team_verdict, expectation.red_team_verdict, "red team verdict");
    assert.deepEqual(
      {
        technical_claim: result.adjudication.technical_claim,
        attack_path: result.adjudication.attack_path,
        impact: result.adjudication.impact,
        severity_claim: result.adjudication.severity_claim,
      },
      expectation.adjudication,
      "adjudicated claims",
    );
    assert.equal(
      result.adjudication.counterargument_defeats_finding,
      expectation.counterargument_defeats_finding,
      "whether the counterargument defeats the finding",
    );
    assert.deepEqual(
      Object.fromEntries(result.assumptions.map((item) => [item.id, item.status])),
      expectation.assumption_statuses,
      "assumption ledger statuses",
    );
    assert.deepEqual(
      result.attack_path.map((link) => link.status),
      expectation.attack_path_statuses,
      "minimal attack path link statuses",
    );
    assert.deepEqual(
      Object.fromEntries(result.counterexamples.map((item) => [item.id, item.strength])),
      expectation.counterexample_strengths,
      "counterexample evidence classification",
    );
    assert.deepEqual(
      result.adjudication.unresolved_assumptions,
      expectation.unresolved_assumptions,
      "exposed unresolved assumptions",
    );
    assert.equal(result.severity_challenge.severity_support, expectation.severity_support, "severity challenge outcome");
  });

  test(`${fixture.case_id}: the challenge is aimed at the technical verdict it received`, () => {
    const technicalVerdict = fixture.result.challenged_finding.technical_verdict;
    assert.deepEqual(validateRedTeamAgainstTechnical(fixture.result, { technical_verdict: technicalVerdict }), []);
    const drifted = validateRedTeamAgainstTechnical(fixture.result, { technical_verdict: "something_else" });
    assert.equal(drifted.length, 1);
    assert.match(drifted[0], /does not match the technical_validation verdict/);
  });

  for (const mutation of fixture.mutations) {
    test(`${fixture.case_id}: rejects the failure mode "${mutation.name}"`, () => {
      const mutated = applyMutation(structuredClone(fixture.result), mutation.path, mutation.value);
      const errors = validateRedTeamResult(mutated);
      assert.ok(errors.length > 0, "the mutated result should have been rejected");
      assert.ok(
        errors.some((error) => error.includes(mutation.expect_error)),
        `expected an error containing:\n  ${mutation.expect_error}\nreceived:\n${JSON.stringify(errors, null, 2)}`,
      );
    });
  }
}
