#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { RED_TEAM_RESULT_KEYS, validateRedTeamResult, validateRedTeamAgainstTechnical } from "./red-team.mjs";

const PHASES = [
  "prior_art",
  "program_policy",
  "eligibility_gate",
  "technical_validation",
  "red_team_validation",
  "verdict_and_improvement",
];
const STATUSES = new Set(["complete", "terminal", "needs_information", "error"]);
const DECISIONS = new Set(["continue", "terminal", "needs_information"]);
const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_RESULTS = {
  prior_art: ["known_issues", "prior_submissions_or_duplicates", "audits_and_disclosures", "access_gaps", "comparison_hooks"],
  program_policy: ["assets", "impacts", "exclusions", "primacy", "severity_system", "poc_requirements", "automation_policy", "submission_rules", "category_rule_matrix"],
  eligibility_gate: ["gates", "known_issue_classification", "applicable_scope_path", "viable_category_paths", "disposition"],
  technical_validation: ["target_classification", "profile_results", "claim_matrix", "exploit_path", "violated_invariant", "privileged_precondition_analysis", "poc_validation", "poc_execution_status", "poc_compliance_checklist", "steelman", "skeptic", "technical_verdict"],
  red_team_validation: RED_TEAM_RESULT_KEYS,
  verdict_and_improvement: ["target_category", "profile_summary", "verdict", "severity", "severity_basis", "severity_confidence", "likelihood", "red_team_summary", "automated_triage_readiness", "human_merits", "submission_recommendation", "fee_risk", "rejection_risks", "improvements", "report_outline", "template_compliance_checklist", "confidence"],
  report_revision: ["original_path", "revised_path", "change_log", "remaining_risks"],
};

function fail(message, code = 2) {
  console.error(`ERROR: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) fail(`unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = rest[i + 1];
    if (!value || value.startsWith("--")) fail(`missing value for --${key}`);
    values[key] = value;
    i += 1;
  }
  return { command, values };
}

function required(values, names) {
  for (const name of names) {
    if (!values[name]) fail(`missing --${name}`);
  }
}

function readEvents(sessionDir) {
  const ledger = path.join(sessionDir, "session.jsonl");
  if (!fs.existsSync(ledger)) fail(`session ledger not found: ${ledger}`);
  const lines = fs.readFileSync(ledger, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`invalid JSONL at line ${index + 1}: ${error.message}`);
    }
  });
}

function writeAtomic(file, content) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, content, { encoding: "utf8", flag: "wx" });
  fs.renameSync(tmp, file);
}

function appendAtomic(sessionDir, event) {
  const ledger = path.join(sessionDir, "session.jsonl");
  const existing = fs.existsSync(ledger) ? fs.readFileSync(ledger, "utf8") : "";
  const prefix = existing && !existing.endsWith("\n") ? `${existing}\n` : existing;
  writeAtomic(ledger, `${prefix}${JSON.stringify(event)}\n`);
}

function safeId(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function digestFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function platformAdapter(platform) {
  const safePlatform = safeId(platform);
  if (safePlatform !== platform) fail(`invalid platform id: ${platform}`);
  const adapter = path.join(SKILL_ROOT, "platforms", platform, "adapter.yaml");
  if (!fs.existsSync(adapter)) fail(`unsupported platform; adapter not found: ${adapter}`);
  return adapter;
}

function validatePayload(payload, phase, status) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return ["payload must be a JSON object"];
  const errors = [];
  for (const field of ["phase", "summary", "decision", "facts", "inferences", "unresolved", "sources", "result"]) {
    if (!(field in payload)) errors.push(`missing payload field: ${field}`);
  }
  if (payload.phase !== phase) errors.push("payload phase does not match --phase");
  if (!DECISIONS.has(payload.decision)) errors.push(`invalid payload decision: ${payload.decision}`);
  for (const field of ["facts", "inferences", "unresolved", "sources"]) {
    if (!Array.isArray(payload[field])) errors.push(`payload ${field} must be an array`);
  }
  if (Array.isArray(payload.sources) && payload.sources.length === 0) errors.push("payload sources must include the fresh program-page read");
  if (Array.isArray(payload.sources)) {
    payload.sources.forEach((source, index) => {
      if (!source || typeof source !== "object") errors.push(`payload source ${index} must be an object`);
      else for (const field of ["url", "retrieved_at", "source_type"]) if (!source[field]) errors.push(`payload source ${index} missing ${field}`);
    });
  }
  if (!payload.result || typeof payload.result !== "object" || Array.isArray(payload.result)) errors.push("payload result must be an object");
  if (payload.result && typeof payload.result === "object") {
    for (const field of REQUIRED_RESULTS[phase] ?? []) {
      if (!(field in payload.result)) errors.push(`missing phase result field: ${field}`);
    }
    if (phase === "red_team_validation") {
      for (const error of validateRedTeamResult(payload.result)) errors.push(error);
    }
    if (phase === "technical_validation") {
      const classification = payload.result.target_classification;
      const categories = new Set(["smart_contract", "web_app", "blockchain_dlt"]);
      if (!classification || typeof classification !== "object" || Array.isArray(classification)) {
        errors.push("target_classification must be an object");
      } else {
        for (const field of ["primary_category", "applicable_categories", "evidence_mode", "system_boundary", "components", "interfaces", "actors_and_trust_boundaries", "technology_context", "required_profiles", "classification_evidence", "uncertainties", "confidence"]) {
          if (!(field in classification)) errors.push(`target_classification missing ${field}`);
        }
        for (const field of ["components", "interfaces", "actors_and_trust_boundaries", "classification_evidence", "uncertainties"]) {
          if (!Array.isArray(classification[field])) errors.push(`target_classification ${field} must be an array`);
        }
        for (const field of ["system_boundary", "technology_context"]) {
          if (!classification[field] || typeof classification[field] !== "object" || Array.isArray(classification[field])) {
            errors.push(`target_classification ${field} must be an object`);
          }
        }
        if (![...categories, "mixed"].includes(classification.primary_category)) errors.push("invalid target_classification primary_category");
        if (!["source_assisted", "black_box", "hybrid"].includes(classification.evidence_mode)) errors.push("invalid target_classification evidence_mode");
        if (!Array.isArray(classification.applicable_categories) || classification.applicable_categories.length === 0) {
          errors.push("target_classification applicable_categories must be a non-empty array");
        } else if (classification.applicable_categories.some((category) => !categories.has(category))) {
          errors.push("target_classification contains an unknown applicable category");
        }
        if (!Array.isArray(classification.required_profiles) || classification.required_profiles.length === 0) {
          errors.push("target_classification required_profiles must be a non-empty array");
        } else if (classification.required_profiles.some((profile) => !categories.has(profile))) {
          errors.push("target_classification contains an unknown required profile");
        }
        if (Array.isArray(classification.applicable_categories) && classification.applicable_categories.length > 1 && classification.primary_category !== "mixed") {
          errors.push("multiple applicable categories require primary_category=mixed");
        }
        if (Array.isArray(classification.applicable_categories) && Array.isArray(classification.required_profiles)) {
          const applicable = [...new Set(classification.applicable_categories)].sort();
          const requiredProfiles = [...new Set(classification.required_profiles)].sort();
          if (JSON.stringify(applicable) !== JSON.stringify(requiredProfiles)) errors.push("required_profiles must cover exactly the applicable categories");
        }
        if (Array.isArray(classification.required_profiles) && classification.required_profiles.length > 0) {
          const profileResults = payload.result.profile_results;
          if (!profileResults || typeof profileResults !== "object" || Array.isArray(profileResults)) {
            errors.push("profile_results must be an object");
          } else {
            for (const profile of classification.required_profiles) {
              if (!(profile in profileResults)) errors.push(`profile_results missing selected profile: ${profile}`);
            }
          }
        }
      }
    }
  }
  if (status === "complete" && payload.decision !== "continue") errors.push("complete status requires decision=continue");
  if (status === "terminal" && payload.decision !== "terminal") errors.push("terminal status requires decision=terminal");
  if (status === "needs_information" && payload.decision !== "needs_information") errors.push("needs_information status requires matching decision");
  return errors;
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return null;
  }
}

function validateFreshProgramRead(payload, initEvent, latestEvent, phase) {
  if (phase === "report_revision" || !Array.isArray(payload.sources)) return [];
  const expectedUrl = normalizeUrl(initEvent.payload.program_url);
  if (!expectedUrl) return ["saved program URL is invalid"];
  const programSources = payload.sources.filter((source) =>
    source?.source_type === "program" && normalizeUrl(source.url) === expectedUrl
  );
  if (programSources.length === 0) {
    return [`payload sources must include the saved program URL: ${initEvent.payload.program_url}`];
  }

  const checkpointTime = Date.parse(latestEvent.timestamp);
  const latestAllowed = Date.now() + 5 * 60 * 1000;
  const hasFreshRead = programSources.some((source) => {
    const retrievedAt = Date.parse(source.retrieved_at);
    return Number.isFinite(retrievedAt) && retrievedAt >= checkpointTime && retrievedAt <= latestAllowed;
  });
  return hasFreshRead
    ? []
    : ["saved program URL must have a valid retrieved_at timestamp at or after the previous checkpoint"];
}

function validateChallengedTechnicalFinding(payload, priorEvents, phase) {
  if (phase !== "red_team_validation") return [];
  const technical = priorEvents.find((event) => event.phase === "technical_validation" && event.status === "complete");
  if (!technical) return ["red_team_validation requires a completed technical_validation checkpoint"];
  return validateRedTeamAgainstTechnical(payload?.result, technical.payload?.result);
}

function nextPhase(events) {
  const completed = new Set(events.filter((e) => e.status === "complete").map((e) => e.phase));
  return PHASES.find((phase) => !completed.has(phase)) ?? "complete";
}

function validationErrors(events) {
  const errors = [];
  const first = events[0];
  if (first?.phase !== "init") errors.push("first event is not init");
  if (first?.mode !== "dynamic") errors.push("persisted session mode must be dynamic");
  if (!(first?.payload?.evidence_root || first?.payload?.codebase_root)) errors.push("init payload missing evidence_root");
  for (const field of ["program_url", "report_path"]) if (!first?.payload?.[field]) errors.push(`init payload missing ${field}`);
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (event.seq !== i + 1) errors.push(`line ${i + 1}: expected seq ${i + 1}, found ${event.seq}`);
    for (const field of ["schema_version", "timestamp", "session_id", "platform", "mode", "phase", "status", "payload"]) {
      if (!(field in event)) errors.push(`line ${i + 1}: missing ${field}`);
    }
    if (event.schema_version !== "1.0") errors.push(`line ${i + 1}: unsupported schema version`);
    if (!STATUSES.has(event.status)) errors.push(`line ${i + 1}: invalid status ${event.status}`);
    if (event.session_id !== first?.session_id) errors.push(`line ${i + 1}: session_id drift`);
    if (event.platform !== first?.platform) errors.push(`line ${i + 1}: platform drift`);
    if (event.mode !== first?.mode) errors.push(`line ${i + 1}: mode drift`);
    if (i > 0 && [...PHASES, "report_revision"].includes(event.phase) && STATUSES.has(event.status)) {
      for (const error of validatePayload(event.payload, event.phase, event.status)) {
        errors.push(`line ${i + 1}: ${error}`);
      }
      for (const error of validateFreshProgramRead(event.payload, first, events[i - 1], event.phase)) {
        errors.push(`line ${i + 1}: ${error}`);
      }
      for (const error of validateChallengedTechnicalFinding(event.payload, events.slice(0, i), event.phase)) {
        errors.push(`line ${i + 1}: ${error}`);
      }
    }
  }
  let phaseIndex = 0;
  let closed = false;
  for (const event of events.slice(1)) {
    if (closed) errors.push(`event after closed session: ${event.phase}`);
    if (event.phase === "report_revision") continue;
    const expected = PHASES[phaseIndex];
    if (event.phase !== expected) errors.push(`phase order mismatch: expected ${expected}, found ${event.phase}`);
    if (event.status === "complete") phaseIndex += 1;
    if (["terminal", "error"].includes(event.status)) closed = true;
  }
  return errors;
}

function readPayload(values) {
  let raw;
  if (values.payload) {
    const payloadPath = path.resolve(values.payload);
    if (!fs.existsSync(payloadPath)) fail(`payload not found: ${payloadPath}`);
    raw = fs.readFileSync(payloadPath, "utf8");
  } else {
    raw = fs.readFileSync(0, "utf8");
    if (!raw.trim()) fail("payload JSON is required on standard input or via --payload FILE");
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`invalid payload JSON: ${error.message}`);
  }
}

function init(values) {
  required(values, ["root", "platform", "mode", "program-url", "report"]);
  if (values.mode !== "dynamic") fail("oneshot is memory-only and must not initialize a session; mode must be dynamic");
  platformAdapter(values.platform);

  const root = path.resolve(values.root);
  const report = path.resolve(values.report);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) fail(`codebase root not found: ${root}`);
  if (!fs.existsSync(report) || !fs.statSync(report).isFile()) fail(`report file not found: ${report}`);

  const sessionId = safeId(values.session ?? `ft-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  const workRoot = path.join(root, ".free-triager");
  const sessionDir = path.join(workRoot, "runs", sessionId);
  if (fs.existsSync(sessionDir)) fail(`session already exists: ${sessionDir}`);

  fs.mkdirSync(path.join(sessionDir, "inputs"), { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  const ignore = path.join(workRoot, ".gitignore");
  if (!fs.existsSync(ignore)) writeAtomic(ignore, "*\n!.gitignore\n");

  const copiedReport = path.join(sessionDir, "inputs", path.basename(report));
  fs.copyFileSync(report, copiedReport, fs.constants.COPYFILE_EXCL);
  let copiedGuidance = null;
  let guidanceDigest = null;
  if (values.guidance) {
    const guidance = path.resolve(values.guidance);
    if (!fs.existsSync(guidance) || !fs.statSync(guidance).isFile()) fail(`guidance file not found: ${guidance}`);
    copiedGuidance = path.join(sessionDir, "inputs", `guidance-${path.basename(guidance)}`);
    fs.copyFileSync(guidance, copiedGuidance, fs.constants.COPYFILE_EXCL);
    guidanceDigest = digestFile(copiedGuidance);
  }

  const event = {
    schema_version: "1.0",
    seq: 1,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    platform: values.platform,
    mode: values.mode,
    phase: "init",
    status: "complete",
    payload: {
      evidence_root: root,
      codebase_root: root,
      program_url: values["program-url"],
      report_path: copiedReport,
      report_sha256: digestFile(copiedReport),
      optional_guidance_path: copiedGuidance,
      optional_guidance_sha256: guidanceDigest,
    },
  };
  appendAtomic(sessionDir, event);
  console.log(JSON.stringify({
    status: "initialized",
    session: sessionDir,
    next_phase: "prior_art",
    fresh_program_read_required: true,
    resume_flag: `resume=${sessionDir}`,
  }, null, 2));
}

function append(values) {
  required(values, ["session", "phase", "status"]);
  const sessionDir = path.resolve(values.session);
  const events = readEvents(sessionDir);
  const ledgerErrors = validationErrors(events);
  if (ledgerErrors.length) fail(`session verification failed: ${ledgerErrors.join("; ")}`);
  const initEvent = events[0];
  const latest = events.at(-1);
  if (!initEvent || initEvent.phase !== "init") fail("first ledger event must be init");
  if (initEvent.mode !== "dynamic") fail("persisted appends are disabled for oneshot sessions");
  if (["terminal", "error"].includes(latest.status)) fail(`session is closed by ${latest.status} event at phase ${latest.phase}`);
  if (![...PHASES, "report_revision"].includes(values.phase)) fail(`unknown phase: ${values.phase}`);
  if (!STATUSES.has(values.status)) fail(`unknown status: ${values.status}`);

  const expected = nextPhase(events);
  if (values.phase !== "report_revision" && values.phase !== expected) {
    fail(`illegal transition: expected ${expected}, received ${values.phase}`);
  }
  if (values.phase === "report_revision") {
    const verdictDone = events.some((event) => event.phase === "verdict_and_improvement" && event.status === "complete");
    if (!verdictDone) fail("report_revision requires a completed verdict_and_improvement phase");
  }

  const payload = readPayload(values);
  const payloadErrors = [
    ...validatePayload(payload, values.phase, values.status),
    ...validateFreshProgramRead(payload, initEvent, latest, values.phase),
    ...validateChallengedTechnicalFinding(payload, events, values.phase),
  ];
  if (payloadErrors.length) fail(payloadErrors.join("; "));

  const event = {
    schema_version: "1.0",
    seq: events.length + 1,
    timestamp: new Date().toISOString(),
    session_id: initEvent.session_id,
    platform: initEvent.platform,
    mode: initEvent.mode,
    phase: values.phase,
    status: values.status,
    payload,
  };
  appendAtomic(sessionDir, event);
  const updated = [...events, event];
  console.log(JSON.stringify({
    status: "appended",
    seq: event.seq,
    phase: event.phase,
    next_phase: ["terminal", "error"].includes(event.status) ? null : nextPhase(updated),
    must_halt: true,
    fresh_program_read_on_resume: !["terminal", "error"].includes(event.status),
    resume_flag: `resume=${sessionDir}`,
  }, null, 2));
}

function status(values) {
  required(values, ["session"]);
  const sessionDir = path.resolve(values.session);
  const events = readEvents(sessionDir);
  const initEvent = events[0];
  const latest = events.at(-1);
  console.log(JSON.stringify({
    session: sessionDir,
    session_id: initEvent.session_id,
    platform: initEvent.platform,
    mode: initEvent.mode,
    program_url: initEvent.payload.program_url,
    report_path: initEvent.payload.report_path,
    event_count: events.length,
    latest: { phase: latest.phase, status: latest.status, timestamp: latest.timestamp },
    next_phase: ["terminal", "error"].includes(latest.status) ? null : nextPhase(events),
  }, null, 2));
}

function verify(values) {
  required(values, ["session"]);
  const sessionDir = path.resolve(values.session);
  const events = readEvents(sessionDir);
  const errors = validationErrors(events);
  const result = { status: errors.length ? "fail" : "pass", errors, events: events.length, next_phase: nextPhase(events) };
  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exit(1);
}

function resume(values) {
  required(values, ["session"]);
  const sessionDir = path.resolve(values.session);
  const events = readEvents(sessionDir);
  const errors = validationErrors(events);
  if (errors.length) fail(`session verification failed: ${errors.join("; ")}`);
  const initEvent = events[0];
  const latest = events.at(-1);
  if (initEvent.mode !== "dynamic") fail("only dynamic sessions can be resumed");
  const closed = ["terminal", "error"].includes(latest.status) || nextPhase(events) === "complete";
  console.log(JSON.stringify({
    status: closed ? "closed" : "resumable",
    session: sessionDir,
    session_id: initEvent.session_id,
    platform: initEvent.platform,
    mode: initEvent.mode,
    evidence_root: initEvent.payload.evidence_root ?? initEvent.payload.codebase_root,
    codebase_root: initEvent.payload.codebase_root,
    program_url: initEvent.payload.program_url,
    report_path: initEvent.payload.report_path,
    optional_guidance_path: initEvent.payload.optional_guidance_path,
    latest: { phase: latest.phase, status: latest.status, timestamp: latest.timestamp },
    next_phase: closed ? null : nextPhase(events),
    fresh_program_read_required: !closed,
    resume_flag: `resume=${sessionDir}`,
  }, null, 2));
}

function usage() {
  console.log(`Free Triager dynamic session ledger\n\nCommands:\n  init --root WORKSPACE_OR_EVIDENCE_PATH --platform immunefi --mode dynamic --program-url URL --report FILE [--session ID] [--guidance FILE]\n  append --session DIR --phase PHASE --status STATUS [--payload FILE]  # otherwise reads JSON from stdin\n  resume --session DIR\n  status --session DIR\n  verify --session DIR`);
}

const { command, values } = parseArgs(process.argv.slice(2));
if (!command || command === "help" || command === "--help") usage();
else if (command === "init") init(values);
else if (command === "append") append(values);
else if (command === "status") status(values);
else if (command === "verify") verify(values);
else if (command === "resume") resume(values);
else fail(`unknown command: ${command}`);
