import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = path.resolve(import.meta.dirname, "..", "scripts", "session.mjs");
const PROGRAM_URL = "https://immunefi.com/bug-bounty/example/information/";

function run(args, cwd, input) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", input });
}

function workerPayload(phase, decision = "continue", source = {}) {
  const results = {
    prior_art: { known_issues: [], prior_submissions_or_duplicates: [], audits_and_disclosures: [], access_gaps: [], comparison_hooks: [] },
    program_policy: { assets: [], impacts: [], exclusions: [], primacy: {}, severity_system: {}, poc_requirements: {}, automation_policy: {}, submission_rules: [], category_rule_matrix: {} },
    eligibility_gate: { gates: [], known_issue_classification: {}, applicable_scope_path: {}, viable_category_paths: [], disposition: "continue" },
    technical_validation: {
      target_classification: {
        primary_category: "smart_contract",
        applicable_categories: ["smart_contract"],
        evidence_mode: "source_assisted",
        system_boundary: {},
        components: [],
        interfaces: [],
        actors_and_trust_boundaries: [],
        technology_context: { language: "derived-by-model" },
        required_profiles: ["smart_contract"],
        classification_evidence: [],
        uncertainties: [],
        confidence: "high",
      },
      profile_results: { smart_contract: {} },
      claim_matrix: [], exploit_path: [], violated_invariant: {}, privileged_precondition_analysis: {},
      poc_validation: {}, poc_execution_status: "statically_verified_not_executed", poc_compliance_checklist: [],
      steelman: {}, skeptic: {}, technical_verdict: "supported",
    },
    verdict_and_improvement: {
      target_category: "smart_contract", profile_summary: {}, verdict: "ready", severity: "High", severity_basis: {},
      likelihood: {}, automated_triage_readiness: {}, human_merits: {}, submission_recommendation: "submit",
      fee_risk: {}, rejection_risks: [], improvements: [], report_outline: [], template_compliance_checklist: [], confidence: "high",
    },
  };
  return {
    phase,
    summary: "test payload",
    decision,
    facts: [],
    inferences: [],
    unresolved: [],
    sources: [{ url: PROGRAM_URL, retrieved_at: new Date().toISOString(), source_type: "program", ...source }],
    result: results[phase] ?? {},
  };
}

test("initializes, appends, reports status, and verifies a session", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  fs.writeFileSync(report, "# Finding\n", "utf8");

  const initialized = run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
    "--program-url", PROGRAM_URL,
    "--report", report, "--session", "test-run",
  ], root);
  assert.equal(initialized.status, 0, initialized.stderr);

  const session = path.join(root, ".free-triager", "runs", "test-run");
  assert.equal(fs.existsSync(path.join(session, "worker-output")), false);
  const appended = run(
    ["append", "--session", session, "--phase", "prior_art", "--status", "complete"],
    root,
    JSON.stringify(workerPayload("prior_art")),
  );
  assert.equal(appended.status, 0, appended.stderr);
  assert.equal(JSON.parse(appended.stdout).must_halt, true);

  const status = run(["status", "--session", session], root);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).next_phase, "program_policy");

  const resumed = run(["resume", "--session", session], root);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal(JSON.parse(resumed.stdout).next_phase, "program_policy");
  assert.equal(JSON.parse(resumed.stdout).fresh_program_read_required, true);

  const verified = run(["verify", "--session", session], root);
  assert.equal(verified.status, 0, verified.stderr);
  assert.equal(JSON.parse(verified.stdout).status, "pass");
});

test("rejects out-of-order phase transitions", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  fs.writeFileSync(report, "# Finding\n", "utf8");
  run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
    "--program-url", PROGRAM_URL,
    "--report", report, "--session", "test-run",
  ], root);

  const session = path.join(root, ".free-triager", "runs", "test-run");
  const result = run(
    ["append", "--session", session, "--phase", "program_policy", "--status", "complete"],
    root,
    JSON.stringify(workerPayload("program_policy")),
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /illegal transition/);
});

test("allows a needs-information phase to be retried", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  fs.writeFileSync(report, "# Finding\n", "utf8");
  run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
    "--program-url", PROGRAM_URL,
    "--report", report, "--session", "test-run",
  ], root);

  const session = path.join(root, ".free-triager", "runs", "test-run");
  assert.equal(run(
    ["append", "--session", session, "--phase", "prior_art", "--status", "needs_information"],
    root,
    JSON.stringify(workerPayload("prior_art", "needs_information")),
  ).status, 0);

  assert.equal(run(
    ["append", "--session", session, "--phase", "prior_art", "--status", "complete"],
    root,
    JSON.stringify(workerPayload("prior_art")),
  ).status, 0);
  assert.equal(run(["verify", "--session", session], root).status, 0);
});

test("oneshot cannot initialize persistence and leaves no runtime directory", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  fs.writeFileSync(report, "# Finding\n", "utf8");

  const result = run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "oneshot",
    "--program-url", PROGRAM_URL,
    "--report", report, "--session", "must-not-exist",
  ], root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /oneshot is memory-only/);
  assert.equal(fs.existsSync(path.join(root, ".free-triager")), false);
});

test("verification rejects a legacy persisted oneshot ledger", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const session = path.join(root, "legacy-oneshot");
  fs.mkdirSync(session);
  fs.writeFileSync(path.join(session, "session.jsonl"), `${JSON.stringify({
    schema_version: "1.0",
    seq: 1,
    timestamp: new Date().toISOString(),
    session_id: "legacy-oneshot",
    platform: "immunefi",
    mode: "oneshot",
    phase: "init",
    status: "complete",
    payload: { codebase_root: root, program_url: PROGRAM_URL, report_path: "report.md" },
  })}\n`, "utf8");

  const verified = run(["verify", "--session", session], root);
  assert.notEqual(verified.status, 0);
  assert.match(verified.stdout, /persisted session mode must be dynamic/);
});

test("resume returns saved routing data and requires a fresh program read", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  const programUrl = PROGRAM_URL;
  fs.writeFileSync(report, "# Finding\n", "utf8");

  assert.equal(run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
    "--program-url", programUrl, "--report", report, "--session", "resume-run",
  ], root).status, 0);

  const session = path.join(root, ".free-triager", "runs", "resume-run");
  const resumed = run(["resume", "--session", session], root);
  assert.equal(resumed.status, 0, resumed.stderr);
  const state = JSON.parse(resumed.stdout);
  assert.equal(state.status, "resumable");
  assert.equal(state.program_url, programUrl);
  assert.equal(state.next_phase, "prior_art");
  assert.equal(state.fresh_program_read_required, true);
  assert.equal(state.resume_flag, `resume=${session}`);
});

test("rejects a checkpoint that cites a different program page", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  fs.writeFileSync(report, "# Finding\n", "utf8");
  assert.equal(run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
    "--program-url", PROGRAM_URL, "--report", report, "--session", "wrong-url-run",
  ], root).status, 0);

  const session = path.join(root, ".free-triager", "runs", "wrong-url-run");
  const result = run(
    ["append", "--session", session, "--phase", "prior_art", "--status", "complete"],
    root,
    JSON.stringify(workerPayload("prior_art", "continue", { url: "https://immunefi.com/" })),
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must include the saved program URL/);
});

test("rejects stale program evidence from before the previous checkpoint", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-test-"));
  const report = path.join(root, "report.md");
  fs.writeFileSync(report, "# Finding\n", "utf8");
  assert.equal(run([
    "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
    "--program-url", PROGRAM_URL, "--report", report, "--session", "stale-run",
  ], root).status, 0);

  const session = path.join(root, ".free-triager", "runs", "stale-run");
  const result = run(
    ["append", "--session", session, "--phase", "prior_art", "--status", "complete"],
    root,
    JSON.stringify(workerPayload("prior_art", "continue", { retrieved_at: "2000-01-01T00:00:00.000Z" })),
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /at or after the previous checkpoint/);
});

test("accepts technology-neutral routing for every target category and mixed findings", () => {
  const routes = [
    { primary: "smart_contract", categories: ["smart_contract"] },
    { primary: "web_app", categories: ["web_app"] },
    { primary: "blockchain_dlt", categories: ["blockchain_dlt"] },
    { primary: "mixed", categories: ["smart_contract", "web_app", "blockchain_dlt"] },
  ];

  for (const route of routes) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "free-triager-route-test-"));
    const report = path.join(root, "report.md");
    fs.writeFileSync(report, "# Technology-neutral finding\n", "utf8");
    assert.equal(run([
      "init", "--root", root, "--platform", "immunefi", "--mode", "dynamic",
      "--program-url", PROGRAM_URL, "--report", report, "--session", "route-run",
    ], root).status, 0);
    const session = path.join(root, ".free-triager", "runs", "route-run");

    for (const phase of ["prior_art", "program_policy", "eligibility_gate"]) {
      const appended = run(
        ["append", "--session", session, "--phase", phase, "--status", "complete"],
        root,
        JSON.stringify(workerPayload(phase)),
      );
      assert.equal(appended.status, 0, appended.stderr);
    }

    const technical = workerPayload("technical_validation");
    technical.result.target_classification.primary_category = route.primary;
    technical.result.target_classification.applicable_categories = route.categories;
    technical.result.target_classification.required_profiles = route.categories;
    technical.result.profile_results = Object.fromEntries(route.categories.map((category) => [category, {}]));
    if (route.primary === "mixed") {
      const incomplete = JSON.parse(JSON.stringify(technical));
      delete incomplete.result.profile_results.web_app;
      const rejected = run(
        ["append", "--session", session, "--phase", "technical_validation", "--status", "complete"],
        root,
        JSON.stringify(incomplete),
      );
      assert.notEqual(rejected.status, 0);
      assert.match(rejected.stderr, /profile_results missing selected profile: web_app/);
    }
    const appended = run(
      ["append", "--session", session, "--phase", "technical_validation", "--status", "complete"],
      root,
      JSON.stringify(technical),
    );
    assert.equal(appended.status, 0, `${route.primary}: ${appended.stderr}`);
    assert.equal(run(["verify", "--session", session], root).status, 0);
  }
});
