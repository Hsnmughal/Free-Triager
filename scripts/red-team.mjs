/**
 * RedTeamValidator
 *
 * Structural and epistemic validation for the `red_team_validation` phase result.
 *
 * This module has no filesystem, network, or orchestration dependency so the
 * adversarial contract can be tested on its own. The session ledger imports it;
 * nothing here imports the session ledger.
 *
 * It never decides whether a finding is true. It enforces that whatever the
 * Red-Team worker concluded is internally coherent, tied to evidence, and does
 * not silently convert absence of proof into proof of absence.
 */

export const RED_TEAM_PHASE = "red_team_validation";

/** Outcome of the adversarial challenge. `challenged` records that the challenge ran and defers the outcome to `adjudication`. */
export const RED_TEAM_STATUSES = new Set(["challenged", "withstood", "weakened", "refuted", "insufficient_evidence"]);

/** Support level for an adjudicated claim. */
export const SUPPORT_LEVELS = new Set(["SUPPORTED", "PARTIALLY_SUPPORTED", "UNSUPPORTED", "UNKNOWN"]);

/**
 * Assumption ledger status. `UNPROVEN` is not `IMPOSSIBLE`, and `UNKNOWN` is not `UNSUPPORTED`.
 *
 * An assumption is `decisive` when the technical claim itself fails if the
 * assumption fails. An assumption that only carries the impact or the severity
 * claim is not decisive; the counterexample targeting that axis carries it.
 */
export const ASSUMPTION_STATUSES = new Set(["PROVEN", "INFERRED", "UNPROVEN", "IMPOSSIBLE", "UNKNOWN"]);

/** Status of one link in the minimal attack path. */
export const LINK_STATUSES = new Set(["PROVEN", "INFERRED", "BLOCKED", "UNKNOWN"]);

/** Actor classes. A privileged function in the path does not make the attacker privileged. */
export const ACTOR_CLASSES = new Set([
  "permissionless",
  "ordinary_user",
  "authorized_user",
  "trusted_role",
  "administrator",
  "protocol_controlled",
  "external_dependency",
]);

/** Weight of an adversarial argument. Speculation alone never defeats a finding. */
export const ARGUMENT_STRENGTHS = new Set(["decisive", "strong", "plausible", "speculative"]);

/** Argument weights that can carry a decisive conclusion. */
export const DECISIVE_STRENGTHS = new Set(["decisive", "strong"]);

/** Mandatory challenge axes. Every finding is challenged on all five. */
export const CHALLENGE_AXES = ["reachability", "preconditions", "privileges", "state", "impact"];

/** Adjudicated claims. These are the axes a counterexample can target. */
export const ADJUDICATION_AXES = ["technical_claim", "attack_path", "impact", "severity_claim"];

/** Impact classes kept separate so a technical anomaly is not reported as a consequence. */
export const IMPACT_CLASSES = new Set([
  "technical_anomaly",
  "economic_consequence",
  "security_consequence",
  "user_consequence",
  "protocol_consequence",
]);

/** Whether a prosecutor element is demonstrated or merely assumed. */
export const CLAIM_BASES = new Set(["demonstrated", "assumed"]);

/** The six elements the prosecutor must establish. */
export const PROSECUTOR_ELEMENTS = [
  "attacker_capability",
  "entry_point",
  "required_state",
  "execution_path",
  "violated_property",
  "impact",
];

/** Evidence kinds. Every `ref` must point at something a reviewer can open. */
export const EVIDENCE_KINDS = new Set([
  "code",
  "request",
  "response",
  "trace",
  "log",
  "state",
  "config",
  "protocol",
  "policy",
  "execution",
  "report",
  "external",
]);

/** Red-Team verdict vocabulary, aligned with the existing triage semantics. */
export const RED_TEAM_VERDICTS = new Set([
  "technically_valid",
  "ready_with_changes",
  "needs_information",
  "out_of_scope",
  "unsupported",
  "invalid_claim",
]);

export const RED_TEAM_RESULT_KEYS = [
  "challenged_finding",
  "status",
  "prosecutor",
  "defender",
  "challenge_matrix",
  "assumptions",
  "attack_path",
  "counterexamples",
  "decisive_facts",
  "unresolved_questions",
  "severity_challenge",
  "adjudication",
  "red_team_verdict",
];

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const unique = (values) => [...new Set(values)];

function evidenceErrors(items, label, { required = false } = {}) {
  if (!Array.isArray(items)) return [`${label} must be an array`];
  const errors = [];
  if (required && items.length === 0) errors.push(`${label} must cite at least one evidence item`);
  items.forEach((item, index) => {
    const at = `${label}[${index}]`;
    if (!isObject(item)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!EVIDENCE_KINDS.has(item.kind)) errors.push(`${at} has an unknown evidence kind: ${item.kind}`);
    if (!isNonEmptyString(item.ref)) {
      errors.push(`${at} must cite a concrete ref such as file:line, symbol, call path, request id, or policy clause`);
    }
  });
  return errors;
}

function targetsErrors(targets, label) {
  if (!Array.isArray(targets)) return [`${label} must be an array`];
  const errors = [];
  if (targets.length === 0) errors.push(`${label} must name at least one adjudication axis`);
  targets.forEach((target, index) => {
    if (!ADJUDICATION_AXES.includes(target)) errors.push(`${label}[${index}] is not an adjudication axis: ${target}`);
  });
  return errors;
}

function validateChallengedFinding(finding) {
  if (!isObject(finding)) return ["challenged_finding must be an object"];
  const errors = [];
  if (finding.source_phase !== "technical_validation") {
    errors.push("challenged_finding.source_phase must be technical_validation");
  }
  if (!isNonEmptyString(finding.technical_verdict)) errors.push("challenged_finding.technical_verdict is required");
  if (!isNonEmptyString(finding.claimed_impact)) errors.push("challenged_finding.claimed_impact is required");
  if (!isNonEmptyString(finding.claimed_severity)) errors.push("challenged_finding.claimed_severity is required");
  return errors;
}

function validateProsecutor(prosecutor) {
  if (!isObject(prosecutor)) return ["prosecutor must be an object"];
  const errors = [];
  if (!isNonEmptyString(prosecutor.strongest_claim)) errors.push("prosecutor.strongest_claim is required");
  errors.push(...evidenceErrors(prosecutor.evidence, "prosecutor.evidence", { required: true }));

  if (!isObject(prosecutor.elements)) {
    errors.push("prosecutor.elements must be an object");
    return errors;
  }
  for (const name of PROSECUTOR_ELEMENTS) {
    const element = prosecutor.elements[name];
    const at = `prosecutor.elements.${name}`;
    if (!isObject(element)) {
      errors.push(`${at} must be an object`);
      continue;
    }
    if (!isNonEmptyString(element.statement)) errors.push(`${at}.statement is required`);
    if (!CLAIM_BASES.has(element.basis)) errors.push(`${at}.basis must be demonstrated or assumed`);
    errors.push(...evidenceErrors(element.evidence, `${at}.evidence`, { required: element.basis === "demonstrated" }));
  }
  return errors;
}

function validateDefender(defender) {
  if (!isObject(defender)) return ["defender must be an object"];
  const errors = [];
  if (!isNonEmptyString(defender.strongest_counterargument)) {
    errors.push("defender.strongest_counterargument is required");
  }
  errors.push(...evidenceErrors(defender.evidence, "defender.evidence"));

  if (!Array.isArray(defender.challenges)) {
    errors.push("defender.challenges must be an array");
    return errors;
  }
  if (defender.challenges.length === 0) {
    errors.push("defender.challenges must contain at least one challenge; a finding may not pass unchallenged");
  }
  defender.challenges.forEach((challenge, index) => {
    const at = `defender.challenges[${index}]`;
    if (!isObject(challenge)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!CHALLENGE_AXES.includes(challenge.axis)) errors.push(`${at}.axis must be one of ${CHALLENGE_AXES.join(", ")}`);
    if (!isNonEmptyString(challenge.statement)) errors.push(`${at}.statement is required`);
    if (!ARGUMENT_STRENGTHS.has(challenge.strength)) {
      errors.push(`${at}.strength must be one of ${[...ARGUMENT_STRENGTHS].join(", ")}`);
    }
    errors.push(...targetsErrors(challenge.targets, `${at}.targets`));
    errors.push(...evidenceErrors(challenge.evidence, `${at}.evidence`, {
      required: DECISIVE_STRENGTHS.has(challenge.strength),
    }));
  });
  return errors;
}

function validateChallengeMatrix(matrix) {
  if (!Array.isArray(matrix)) return ["challenge_matrix must be an array"];
  const errors = [];
  matrix.forEach((entry, index) => {
    const at = `challenge_matrix[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!CHALLENGE_AXES.includes(entry.axis)) errors.push(`${at}.axis must be one of ${CHALLENGE_AXES.join(", ")}`);
    if (!isNonEmptyString(entry.finding)) errors.push(`${at}.finding is required`);
    if (!SUPPORT_LEVELS.has(entry.support)) errors.push(`${at}.support must be one of ${[...SUPPORT_LEVELS].join(", ")}`);
    errors.push(...evidenceErrors(entry.evidence, `${at}.evidence`));
  });
  const covered = unique(matrix.filter(isObject).map((entry) => entry.axis));
  for (const axis of CHALLENGE_AXES) {
    if (!covered.includes(axis)) errors.push(`challenge_matrix is missing the mandatory axis: ${axis}`);
  }
  return errors;
}

function validateAssumptions(assumptions) {
  if (!Array.isArray(assumptions)) return ["assumptions must be an array"];
  const errors = [];
  if (assumptions.length === 0) errors.push("assumptions must contain the assumption ledger for the finding");
  const seen = new Set();
  assumptions.forEach((assumption, index) => {
    const at = `assumptions[${index}]`;
    if (!isObject(assumption)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!isNonEmptyString(assumption.id)) errors.push(`${at}.id is required`);
    else if (seen.has(assumption.id)) errors.push(`${at}.id is duplicated: ${assumption.id}`);
    else seen.add(assumption.id);
    if (!isNonEmptyString(assumption.statement)) errors.push(`${at}.statement is required`);
    if (!ASSUMPTION_STATUSES.has(assumption.status)) {
      errors.push(`${at}.status must be one of ${[...ASSUMPTION_STATUSES].join(", ")}`);
    }
    if (typeof assumption.decisive !== "boolean") errors.push(`${at}.decisive must be a boolean`);
    errors.push(...evidenceErrors(assumption.evidence, `${at}.evidence`, {
      required: ["PROVEN", "IMPOSSIBLE"].includes(assumption.status),
    }));
  });
  return errors;
}

function validateAttackPath(attackPath) {
  if (!Array.isArray(attackPath)) return ["attack_path must be an array"];
  const errors = [];
  if (attackPath.length === 0) errors.push("attack_path must contain the minimal credible attack path");
  attackPath.forEach((link, index) => {
    const at = `attack_path[${index}]`;
    if (!isObject(link)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (link.step !== index + 1) errors.push(`${at}.step must be ${index + 1}; attack path steps are contiguous from 1`);
    if (!ACTOR_CLASSES.has(link.actor_class)) {
      errors.push(`${at}.actor_class must be one of ${[...ACTOR_CLASSES].join(", ")}`);
    }
    if (!isNonEmptyString(link.transition)) errors.push(`${at}.transition is required`);
    if (!LINK_STATUSES.has(link.status)) errors.push(`${at}.status must be one of ${[...LINK_STATUSES].join(", ")}`);
    errors.push(...evidenceErrors(link.evidence, `${at}.evidence`, {
      required: ["PROVEN", "BLOCKED"].includes(link.status),
    }));
  });
  return errors;
}

function validateCounterexamples(counterexamples, assumptionIds, pathLength) {
  if (!Array.isArray(counterexamples)) return ["counterexamples must be an array"];
  const errors = [];
  const anchors = ["function", "condition", "state", "call_sequence", "location"];
  counterexamples.forEach((counterexample, index) => {
    const at = `counterexamples[${index}]`;
    if (!isObject(counterexample)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!isNonEmptyString(counterexample.id)) errors.push(`${at}.id is required`);
    if (!isNonEmptyString(counterexample.reason)) errors.push(`${at}.reason is required`);
    if (!ARGUMENT_STRENGTHS.has(counterexample.strength)) {
      errors.push(`${at}.strength must be one of ${[...ARGUMENT_STRENGTHS].join(", ")}`);
    }
    if (!anchors.some((anchor) => isNonEmptyString(counterexample[anchor]))) {
      errors.push(`${at} must anchor on at least one of ${anchors.join(", ")} rather than a vague statement`);
    }
    errors.push(...targetsErrors(counterexample.targets, `${at}.targets`));
    errors.push(...evidenceErrors(counterexample.evidence, `${at}.evidence`, {
      required: DECISIVE_STRENGTHS.has(counterexample.strength),
    }));

    for (const field of ["refutes_assumptions", "blocks_steps"]) {
      if (counterexample[field] !== undefined && !Array.isArray(counterexample[field])) {
        errors.push(`${at}.${field} must be an array`);
      }
    }
    for (const id of counterexample.refutes_assumptions ?? []) {
      if (!assumptionIds.has(id)) errors.push(`${at}.refutes_assumptions references an unknown assumption id: ${id}`);
    }
    for (const step of counterexample.blocks_steps ?? []) {
      if (!Number.isInteger(step) || step < 1 || step > pathLength) {
        errors.push(`${at}.blocks_steps references a step outside the attack path: ${step}`);
      }
    }
  });
  return errors;
}

function validateUnresolvedQuestions(questions) {
  if (!Array.isArray(questions)) return ["unresolved_questions must be an array"];
  const errors = [];
  questions.forEach((question, index) => {
    const at = `unresolved_questions[${index}]`;
    if (!isObject(question)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!isNonEmptyString(question.id)) errors.push(`${at}.id is required`);
    if (!isNonEmptyString(question.question)) errors.push(`${at}.question is required`);
    if (!isNonEmptyString(question.how_to_resolve)) errors.push(`${at}.how_to_resolve is required`);
    errors.push(...targetsErrors(question.blocks, `${at}.blocks`));
  });
  return errors;
}

function validateDecisiveFacts(facts) {
  if (!Array.isArray(facts)) return ["decisive_facts must be an array"];
  const errors = [];
  facts.forEach((fact, index) => {
    const at = `decisive_facts[${index}]`;
    if (!isObject(fact)) {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!isNonEmptyString(fact.fact)) errors.push(`${at}.fact is required`);
    if (!["supports_finding", "opposes_finding"].includes(fact.direction)) {
      errors.push(`${at}.direction must be supports_finding or opposes_finding`);
    }
    errors.push(...evidenceErrors(fact.evidence, `${at}.evidence`, { required: true }));
  });
  return errors;
}

function validateSeverityChallenge(challenge) {
  if (!isObject(challenge)) return ["severity_challenge must be an object"];
  const errors = [];
  if (!isNonEmptyString(challenge.claimed_severity)) errors.push("severity_challenge.claimed_severity is required");
  if (!isNonEmptyString(challenge.demonstrated_impact)) errors.push("severity_challenge.demonstrated_impact is required");
  if (!IMPACT_CLASSES.has(challenge.impact_class)) {
    errors.push(`severity_challenge.impact_class must be one of ${[...IMPACT_CLASSES].join(", ")}`);
  }
  if (!SUPPORT_LEVELS.has(challenge.severity_support)) {
    errors.push(`severity_challenge.severity_support must be one of ${[...SUPPORT_LEVELS].join(", ")}`);
  }
  for (const field of ["reproducible", "bounded", "reversible", "persistent"]) {
    if (!["yes", "no", "unknown"].includes(challenge[field])) {
      errors.push(`severity_challenge.${field} must be yes, no, or unknown`);
    }
  }
  if (!isNonEmptyString(challenge.attacker_requirements)) errors.push("severity_challenge.attacker_requirements is required");
  if (!isNonEmptyString(challenge.policy_alignment)) errors.push("severity_challenge.policy_alignment is required");
  if (!Array.isArray(challenge.unproven_dependencies)) errors.push("severity_challenge.unproven_dependencies must be an array");
  return errors;
}

function validateAdjudication(adjudication) {
  if (!isObject(adjudication)) return ["adjudication must be an object"];
  const errors = [];
  for (const axis of ADJUDICATION_AXES) {
    if (!SUPPORT_LEVELS.has(adjudication[axis])) {
      errors.push(`adjudication.${axis} must be one of ${[...SUPPORT_LEVELS].join(", ")}`);
    }
  }
  if (!isNonEmptyString(adjudication.strongest_supporting_evidence)) {
    errors.push("adjudication.strongest_supporting_evidence is required");
  }
  if (!isNonEmptyString(adjudication.strongest_opposing_evidence)) {
    errors.push("adjudication.strongest_opposing_evidence is required");
  }
  if (!isNonEmptyString(adjudication.rationale)) errors.push("adjudication.rationale is required");
  if (!["yes", "no", "undetermined"].includes(adjudication.counterargument_defeats_finding)) {
    errors.push("adjudication.counterargument_defeats_finding must be yes, no, or undetermined");
  }
  if (!Array.isArray(adjudication.unresolved_assumptions)) {
    errors.push("adjudication.unresolved_assumptions must be an array");
  }
  return errors;
}

/**
 * Epistemic coherence rules.
 *
 * These are the rules that make the phase worth running. They block both
 * failure directions: accepting a finding whose chain is not established, and
 * rejecting a finding on speculation or on missing evidence alone.
 */
function coherenceErrors(result) {
  const errors = [];
  const adjudication = isObject(result.adjudication) ? result.adjudication : {};
  const severity = isObject(result.severity_challenge) ? result.severity_challenge : {};
  const assumptions = Array.isArray(result.assumptions) ? result.assumptions.filter(isObject) : [];
  const attackPath = Array.isArray(result.attack_path) ? result.attack_path.filter(isObject) : [];
  const counterexamples = Array.isArray(result.counterexamples) ? result.counterexamples.filter(isObject) : [];
  const questions = Array.isArray(result.unresolved_questions) ? result.unresolved_questions.filter(isObject) : [];

  // Only a concrete counterexample can carry an UNSUPPORTED verdict. A Defender
  // challenge is prose; a counterexample is anchored on a function, condition,
  // state, call sequence, or location, which is what a refutation has to be.
  const decisivelyOpposesAxis = (axis) => counterexamples.some(
    (item) => Array.isArray(item.targets)
      && item.targets.includes(axis)
      && DECISIVE_STRENGTHS.has(item.strength)
      && Array.isArray(item.evidence)
      && item.evidence.length > 0,
  );

  // Absence of proof is not proof of absence: UNSUPPORTED needs contradicting evidence.
  for (const axis of ADJUDICATION_AXES) {
    if (adjudication[axis] === "UNSUPPORTED" && !decisivelyOpposesAxis(axis)) {
      errors.push(
        `adjudication.${axis} is UNSUPPORTED but no decisive or strong counterexample with evidence targets it; use UNKNOWN when evidence is merely absent`,
      );
    }
  }

  // UNKNOWN must name what is missing, otherwise it hides an unasked question.
  for (const axis of ADJUDICATION_AXES) {
    if (adjudication[axis] !== "UNKNOWN") continue;
    if (!questions.some((item) => Array.isArray(item.blocks) && item.blocks.includes(axis))) {
      errors.push(`adjudication.${axis} is UNKNOWN but no unresolved question blocks that axis`);
    }
  }

  // IMPOSSIBLE is the strongest negative claim available and must be earned.
  for (const assumption of assumptions) {
    if (assumption.status !== "IMPOSSIBLE") continue;
    const refuted = counterexamples.some(
      (item) => DECISIVE_STRENGTHS.has(item.strength) && (item.refutes_assumptions ?? []).includes(assumption.id),
    );
    if (!refuted) {
      errors.push(
        `assumption ${assumption.id} is IMPOSSIBLE but no decisive or strong counterexample refutes it; UNPROVEN or UNKNOWN is the correct status without such evidence`,
      );
    }
  }

  // A blocked link must be blocked by a named counterexample, not by intuition.
  for (const link of attackPath) {
    if (link.status !== "BLOCKED") continue;
    const blocked = counterexamples.some(
      (item) => DECISIVE_STRENGTHS.has(item.strength) && (item.blocks_steps ?? []).includes(link.step),
    );
    if (!blocked) {
      errors.push(`attack_path step ${link.step} is BLOCKED but no decisive or strong counterexample blocks that step`);
    }
  }

  // False acceptance: a supported attack path cannot contain a broken or unknown link.
  if (adjudication.attack_path === "SUPPORTED") {
    for (const link of attackPath.filter((item) => ["BLOCKED", "UNKNOWN"].includes(item.status))) {
      errors.push(`adjudication.attack_path is SUPPORTED but step ${link.step} is ${link.status}`);
    }
    if (attackPath.length === 0) errors.push("adjudication.attack_path is SUPPORTED but the attack path is empty");
  }

  // False acceptance: a decisive assumption that is not established caps the technical claim.
  for (const assumption of assumptions) {
    if (!assumption.decisive) continue;
    if (["UNPROVEN", "UNKNOWN"].includes(assumption.status) && adjudication.technical_claim === "SUPPORTED") {
      errors.push(`adjudication.technical_claim is SUPPORTED but decisive assumption ${assumption.id} is ${assumption.status}`);
    }
    if (assumption.status === "IMPOSSIBLE" && adjudication.technical_claim !== "UNSUPPORTED") {
      errors.push(`decisive assumption ${assumption.id} is IMPOSSIBLE, so adjudication.technical_claim must be UNSUPPORTED`);
    }
  }

  // False acceptance: impact must be demonstrated, not inferred from a suspicious state transition.
  if (adjudication.impact === "SUPPORTED") {
    const impactElement = isObject(result.prosecutor) && isObject(result.prosecutor.elements)
      ? result.prosecutor.elements.impact
      : null;
    if (!isObject(impactElement) || impactElement.basis !== "demonstrated") {
      errors.push("adjudication.impact is SUPPORTED but prosecutor.elements.impact.basis is not demonstrated");
    }
    if (severity.impact_class === "technical_anomaly") {
      errors.push("adjudication.impact is SUPPORTED but severity_challenge.impact_class is only a technical_anomaly");
    }
  }

  // False rejection: speculation never refutes a finding.
  if (result.status === "refuted") {
    if (!counterexamples.some((item) => item.strength === "decisive")) {
      errors.push("status refuted requires at least one decisive counterexample");
    }
    if (!ADJUDICATION_AXES.some((axis) => adjudication[axis] === "UNSUPPORTED")) {
      errors.push("status refuted requires at least one UNSUPPORTED adjudication axis");
    }
  }
  if (result.status === "withstood") {
    for (const axis of ["technical_claim", "attack_path"]) {
      if (adjudication[axis] === "UNSUPPORTED") {
        errors.push(`status withstood conflicts with adjudication.${axis} = UNSUPPORTED`);
      }
    }
  }
  if (result.status === "insufficient_evidence" && !ADJUDICATION_AXES.some((axis) => adjudication[axis] === "UNKNOWN")) {
    errors.push("status insufficient_evidence requires at least one UNKNOWN adjudication axis");
  }

  // Severity is challenged independently: an unsupported severity claim does not destroy a valid finding.
  if (
    adjudication.technical_claim === "SUPPORTED"
    && adjudication.severity_claim === "UNSUPPORTED"
    && ["invalid_claim", "unsupported"].includes(result.red_team_verdict)
  ) {
    errors.push(
      "an unsupported severity claim must not invalidate a supported technical claim; downgrade the severity confidence instead",
    );
  }
  if (adjudication.severity_claim === "SUPPORTED" && (severity.unproven_dependencies ?? []).length > 0) {
    errors.push("adjudication.severity_claim is SUPPORTED but severity_challenge.unproven_dependencies is not empty");
  }

  // Verdict coherence with the adjudicated state.
  if (result.red_team_verdict === "invalid_claim" && result.status !== "refuted") {
    errors.push("red_team_verdict invalid_claim requires status refuted");
  }
  if (result.red_team_verdict === "technically_valid") {
    if (adjudication.technical_claim !== "SUPPORTED") {
      errors.push("red_team_verdict technically_valid requires adjudication.technical_claim = SUPPORTED");
    }
    if (adjudication.counterargument_defeats_finding === "yes") {
      errors.push("red_team_verdict technically_valid conflicts with counterargument_defeats_finding = yes");
    }
  }
  if (result.red_team_verdict === "needs_information" && !ADJUDICATION_AXES.some((axis) => adjudication[axis] === "UNKNOWN")) {
    errors.push("red_team_verdict needs_information requires at least one UNKNOWN adjudication axis");
  }
  if (
    adjudication.counterargument_defeats_finding === "yes"
    && !ADJUDICATION_AXES.some((axis) => adjudication[axis] === "UNSUPPORTED")
  ) {
    errors.push("counterargument_defeats_finding = yes requires at least one UNSUPPORTED adjudication axis");
  }

  // The ledger must surface unresolved assumptions instead of burying them in the verdict.
  const declared = Array.isArray(adjudication.unresolved_assumptions) ? adjudication.unresolved_assumptions : [];
  for (const assumption of assumptions) {
    if (!["UNPROVEN", "UNKNOWN"].includes(assumption.status)) continue;
    if (!declared.includes(assumption.id)) {
      errors.push(`adjudication.unresolved_assumptions must list unresolved assumption ${assumption.id}`);
    }
  }
  for (const id of declared) {
    if (!assumptions.some((item) => item.id === id)) {
      errors.push(`adjudication.unresolved_assumptions references an unknown assumption id: ${id}`);
    }
  }

  return errors;
}

/**
 * Validate a `red_team_validation` phase result.
 *
 * @param {unknown} result phase result object.
 * @returns {string[]} validation errors; empty when the result is acceptable.
 */
export function validateRedTeamResult(result) {
  if (!isObject(result)) return ["red_team_validation result must be an object"];

  const errors = [];
  for (const key of RED_TEAM_RESULT_KEYS) {
    if (!(key in result)) errors.push(`missing red_team result field: ${key}`);
  }
  if (!RED_TEAM_STATUSES.has(result.status)) {
    errors.push(`status must be one of ${[...RED_TEAM_STATUSES].join(", ")}`);
  }
  if (!RED_TEAM_VERDICTS.has(result.red_team_verdict)) {
    errors.push(`red_team_verdict must be one of ${[...RED_TEAM_VERDICTS].join(", ")}`);
  }

  errors.push(...validateChallengedFinding(result.challenged_finding));
  errors.push(...validateProsecutor(result.prosecutor));
  errors.push(...validateDefender(result.defender));
  errors.push(...validateChallengeMatrix(result.challenge_matrix));
  errors.push(...validateAssumptions(result.assumptions));
  errors.push(...validateAttackPath(result.attack_path));

  const assumptionIds = new Set(
    (Array.isArray(result.assumptions) ? result.assumptions : []).filter(isObject).map((item) => item.id),
  );
  const pathLength = Array.isArray(result.attack_path) ? result.attack_path.length : 0;
  errors.push(...validateCounterexamples(result.counterexamples, assumptionIds, pathLength));
  errors.push(...validateDecisiveFacts(result.decisive_facts));
  errors.push(...validateUnresolvedQuestions(result.unresolved_questions));
  errors.push(...validateSeverityChallenge(result.severity_challenge));
  errors.push(...validateAdjudication(result.adjudication));
  errors.push(...coherenceErrors(result));

  return errors;
}

/**
 * Cross-phase check: the challenge must be aimed at the finding technical
 * validation actually produced, not at a restated or softened version of it.
 *
 * @param {unknown} result `red_team_validation` result.
 * @param {unknown} technicalResult `technical_validation` result.
 * @returns {string[]} validation errors; empty when the two agree.
 */
export function validateRedTeamAgainstTechnical(result, technicalResult) {
  if (!isObject(result) || !isObject(result.challenged_finding)) return [];
  if (!isObject(technicalResult)) return ["red_team_validation requires a completed technical_validation result"];
  const expected = technicalResult.technical_verdict;
  const actual = result.challenged_finding.technical_verdict;
  if (isNonEmptyString(expected) && actual !== expected) {
    return [
      `challenged_finding.technical_verdict (${actual}) does not match the technical_validation verdict (${expected})`,
    ];
  }
  return [];
}
