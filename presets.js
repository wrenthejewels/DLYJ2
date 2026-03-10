// Role and seniority presets for domain friction and reliability
// These are conservative priors grounded in domain tacit/physical/relational load
// and typical corporate QA requirements. They do not change METR doubling.

;(function(){
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Base per-role recommendations
  const ROLE_PRESETS = {
    'software':              { friction: 1.05, reliabilityBase: 0.92 },
    'admin':                 { friction: 1.10, reliabilityBase: 0.90 },
    'data-analysis':         { friction: 1.10, reliabilityBase: 0.93 },
    'finance':               { friction: 1.35, reliabilityBase: 0.97 },
    'sales':                 { friction: 1.25, reliabilityBase: 0.90 },
    'creative':              { friction: 1.20, reliabilityBase: 0.88 },
    'legal':                 { friction: 1.45, reliabilityBase: 0.98 },
    'product-management':    { friction: 1.30, reliabilityBase: 0.95 },
    'consulting':            { friction: 1.35, reliabilityBase: 0.96 },
    'hr':                    { friction: 1.30, reliabilityBase: 0.94 },
    'content-writing':       { friction: 1.10, reliabilityBase: 0.88 },
    'journalism':            { friction: 1.20, reliabilityBase: 0.90 },
    'engineering':           { friction: 1.50, reliabilityBase: 0.98 },
    'operations':            { friction: 1.80, reliabilityBase: 0.92 },
    'custom':                { friction: 1.20, reliabilityBase: 0.92 },
  };

  // Baseline (neutral) answers for 14 legacy questions (v2.1 compatibility path)
  const NEUTRAL_ANSWERS = {
    Q1: 3, Q2: 3, Q3: 3, Q4: 3, Q5: 3,
    Q6: 3, Q7: 3, Q8: 3, Q9: 3,
    Q11: 3, Q12: 3, Q13: 3, Q14: 3,
    Q16: 3,
  };

  const NEUTRAL_PROFILE = {
    function_centrality: 0.50,
    human_signoff_requirement: 0.50,
    liability_and_regulatory_burden: 0.50,
    relationship_ownership: 0.50,
    exception_and_context_load: 0.50,
    workflow_decomposability: 0.50,
    organizational_adoption_readiness: 0.50,
    ai_observability_of_work: 0.50,
    dependency_bottleneck_strength: 0.50,
    handoff_and_coordination_complexity: 0.50,
    external_trust_requirement: 0.50,
    stakeholder_alignment_burden: 0.50,
    execution_vs_judgment_mix: 0.50,
    augmentation_fit: 0.50,
    substitution_risk_modifier: 0.50,
  };

  // Baseline per-role answers for Q1-Q14,Q16 (v2.1, derived from role_preset_template.md)
  const ROLE_QUESTION_PRESETS = {
    'software': {
      Q1: 5, Q2: 5, Q3: 4, Q4: 5, Q5: 4, Q6: 4, Q7: 2, Q8: 3, Q9: 2,
      Q11: 1, Q12: 2, Q13: 4, Q14: 3, Q16: 4,
    },
    'admin': {
      Q1: 3, Q2: 4, Q3: 3, Q4: 4, Q5: 4, Q6: 4, Q7: 2, Q8: 4, Q9: 2,
      Q11: 2, Q12: 3, Q13: 3, Q14: 4, Q16: 3,
    },
    'data-analysis': {
      Q1: 5, Q2: 5, Q3: 4, Q4: 5, Q5: 4, Q6: 4, Q7: 2, Q8: 4, Q9: 2,
      Q11: 1, Q12: 2, Q13: 3, Q14: 3, Q16: 4,
    },
    'finance': {
      Q1: 4, Q2: 4, Q3: 4, Q4: 5, Q5: 4, Q6: 4, Q7: 2, Q8: 4, Q9: 2,
      Q11: 1, Q12: 4, Q13: 3, Q14: 4, Q16: 3,
    },
    'sales': {
      Q1: 3, Q2: 3, Q3: 2, Q4: 3, Q5: 3, Q6: 2, Q7: 4, Q8: 3, Q9: 4,
      Q11: 3, Q12: 3, Q13: 3, Q14: 3, Q16: 3,
    },
    'creative': {
      Q1: 4, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 2, Q7: 3, Q8: 3, Q9: 3,
      Q11: 2, Q12: 2, Q13: 3, Q14: 3, Q16: 3,
    },
    'legal': {
      Q1: 3, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 3, Q7: 4, Q8: 2, Q9: 4,
      Q11: 2, Q12: 5, Q13: 2, Q14: 3, Q16: 3,
    },
    'product-management': {
      Q1: 3, Q2: 3, Q3: 2, Q4: 4, Q5: 3, Q6: 3, Q7: 4, Q8: 3, Q9: 4,
      Q11: 2, Q12: 3, Q13: 3, Q14: 3, Q16: 3,
    },
    'consulting': {
      Q1: 3, Q2: 3, Q3: 2, Q4: 4, Q5: 3, Q6: 2, Q7: 4, Q8: 3, Q9: 4,
      Q11: 3, Q12: 4, Q13: 3, Q14: 3, Q16: 3,
    },
    'hr': {
      Q1: 3, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 3,
      Q11: 3, Q12: 4, Q13: 3, Q14: 3, Q16: 3,
    },
    'content-writing': {
      Q1: 4, Q2: 4, Q3: 3, Q4: 5, Q5: 4, Q6: 3, Q7: 2, Q8: 4, Q9: 2,
      Q11: 1, Q12: 2, Q13: 3, Q14: 4, Q16: 3,
    },
    'journalism': {
      Q1: 4, Q2: 3, Q3: 3, Q4: 4, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 3,
      Q11: 2, Q12: 3, Q13: 2, Q14: 4, Q16: 3,
    },
    'engineering': {
      Q1: 4, Q2: 4, Q3: 4, Q4: 4, Q5: 3, Q6: 3, Q7: 3, Q8: 3, Q9: 4,
      Q11: 3, Q12: 4, Q13: 3, Q14: 3, Q16: 3,
    },
    'operations': {
      Q1: 3, Q2: 3, Q3: 3, Q4: 4, Q5: 4, Q6: 4, Q7: 3, Q8: 4, Q9: 3,
      Q11: 2, Q12: 3, Q13: 3, Q14: 3, Q16: 3,
    },
    'custom': { ...NEUTRAL_ANSWERS },
  };

  // Additive deltas by seniority level (Level 1..5 → Entry..Executive)
  const SENIORITY_Q_DELTAS = {
    1: {},                   // Entry: neutral deltas
    2: {},                   // Mid: neutral deltas
    3: { Q7: +1, Q9: +1, Q12: +1 }, // Senior: more context/tacit/trust
    4: { Q7: +1, Q9: +1, Q12: +1 }, // Lead: more context/tacit/trust
    5: { Q7: +2, Q9: +2, Q12: +2 }, // Executive: highest context/tacit/trust
  };

  // Additive reliability adjustments by seniority index (1..5 -> 0..4)
  // Entry -0.05, Mid 0.00, Senior +0.03, Lead +0.04, Exec +0.05
  const SENIORITY_R_DELTAS = [-0.05, 0.00, 0.03, 0.04, 0.05];

  const normalizeAnswer = (raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return 0.5;
    return clamp((value - 1) / 4, 0, 1);
  };

  const toLegacyAnswer = (value) => clamp(Math.round((clamp(value, 0, 1) * 4) + 1), 1, 5);

  function buildQuestionnaireProfileFromLegacyAnswers(answers, seniorityLevel){
    const q1 = normalizeAnswer(answers.Q1);
    const q2 = normalizeAnswer(answers.Q2);
    const q3 = normalizeAnswer(answers.Q3);
    const q4 = normalizeAnswer(answers.Q4);
    const q5 = normalizeAnswer(answers.Q5);
    const q6 = normalizeAnswer(answers.Q6);
    const q7 = normalizeAnswer(answers.Q7);
    const q8 = normalizeAnswer(answers.Q8);
    const q9 = normalizeAnswer(answers.Q9);
    const q11 = normalizeAnswer(answers.Q11);
    const q12 = normalizeAnswer(answers.Q12);
    const q13 = normalizeAnswer(answers.Q13);
    const q14 = normalizeAnswer(answers.Q14);
    const q16 = normalizeAnswer(answers.Q16);
    const seniority = clamp(((Number(seniorityLevel) || 3) - 1) / 4, 0, 1);

    return {
      function_centrality: clamp((q11 * 0.35) + (q7 * 0.25) + (q9 * 0.20) + (seniority * 0.20), 0, 1),
      human_signoff_requirement: clamp((q11 * 0.50) + (q7 * 0.20) + (seniority * 0.30), 0, 1),
      liability_and_regulatory_burden: clamp((q11 * 0.35) + (q7 * 0.30) + ((1 - q5) * 0.20) + (seniority * 0.15), 0, 1),
      relationship_ownership: clamp((q11 * 0.45) + (q7 * 0.20) + (q9 * 0.20) + (seniority * 0.15), 0, 1),
      exception_and_context_load: clamp(((1 - q5) * 0.30) + ((1 - q6) * 0.15) + (q7 * 0.30) + (q9 * 0.25), 0, 1),
      workflow_decomposability: clamp((q5 * 0.40) + (q6 * 0.30) + (q4 * 0.30), 0, 1),
      organizational_adoption_readiness: clamp((q13 * 0.45) + (q14 * 0.20) + (q16 * 0.35), 0, 1),
      ai_observability_of_work: clamp((q1 * 0.25) + (q2 * 0.15) + (q3 * 0.15) + (q4 * 0.30) + (q8 * 0.15), 0, 1),
      dependency_bottleneck_strength: clamp(((1 - q5) * 0.30) + (q7 * 0.30) + (q11 * 0.25) + (seniority * 0.15), 0, 1),
      handoff_and_coordination_complexity: clamp(((1 - q5) * 0.25) + (q7 * 0.25) + (q11 * 0.20) + (seniority * 0.30), 0, 1),
      external_trust_requirement: clamp((q11 * 0.45) + (q12 * 0.15) + (q7 * 0.20) + (seniority * 0.20), 0, 1),
      stakeholder_alignment_burden: clamp((q11 * 0.35) + (q7 * 0.20) + (seniority * 0.45), 0, 1),
      execution_vs_judgment_mix: clamp((q5 * 0.25) + (q6 * 0.25) + ((1 - q11) * 0.25) + ((1 - q7) * 0.25), 0, 1),
      augmentation_fit: clamp((q1 * 0.35) + (q11 * 0.20) + (q7 * 0.20) + ((1 - q13) * 0.10) + (seniority * 0.15), 0, 1),
      substitution_risk_modifier: clamp((q1 * 0.30) + (q4 * 0.20) + (q5 * 0.20) + (q6 * 0.15) + ((1 - q11) * 0.15), 0, 1),
    };
  }

  function buildLegacyAnswersFromQuestionnaireProfile(profile){
    const p = { ...NEUTRAL_PROFILE, ...(profile || {}) };
    const contextAndAuthority = clamp((p.exception_and_context_load * 0.45) + (p.function_centrality * 0.30) + (p.relationship_ownership * 0.25), 0, 1);
    const signoffAndTrust = clamp((p.human_signoff_requirement * 0.45) + (p.external_trust_requirement * 0.35) + (p.liability_and_regulatory_burden * 0.20), 0, 1);

    return {
      Q1: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.55) + (p.substitution_risk_modifier * 0.45), 0, 1)),
      Q2: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.75) + (p.workflow_decomposability * 0.25), 0, 1)),
      Q3: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.55) + ((1 - p.human_signoff_requirement) * 0.45), 0, 1)),
      Q4: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.65) + (p.workflow_decomposability * 0.35), 0, 1)),
      Q5: toLegacyAnswer(p.workflow_decomposability),
      Q6: toLegacyAnswer(clamp((p.workflow_decomposability * 0.75) + ((1 - p.exception_and_context_load) * 0.25), 0, 1)),
      Q7: toLegacyAnswer(contextAndAuthority),
      Q8: toLegacyAnswer(clamp((p.ai_observability_of_work * 0.55) + ((1 - p.human_signoff_requirement) * 0.25) + ((1 - p.dependency_bottleneck_strength) * 0.20), 0, 1)),
      Q9: toLegacyAnswer(clamp((p.exception_and_context_load * 0.50) + (p.relationship_ownership * 0.20) + (p.function_centrality * 0.30), 0, 1)),
      Q11: toLegacyAnswer(signoffAndTrust),
      Q12: toLegacyAnswer(clamp((p.external_trust_requirement * 0.60) + (p.relationship_ownership * 0.20) + (p.liability_and_regulatory_burden * 0.20), 0, 1)),
      Q13: toLegacyAnswer(p.organizational_adoption_readiness),
      Q14: toLegacyAnswer(clamp((p.organizational_adoption_readiness * 0.45) + (p.substitution_risk_modifier * 0.35) + (p.workflow_decomposability * 0.20), 0, 1)),
      Q16: toLegacyAnswer(clamp((p.organizational_adoption_readiness * 0.60) + (p.workflow_decomposability * 0.25) + (p.ai_observability_of_work * 0.15), 0, 1)),
    };
  }

  // Helper: compute recommended reliability for a role + seniority (clamped 0.80..0.99)
  function recommendReliability(roleKey, seniorityLevel){
    const base = (ROLE_PRESETS[roleKey] && ROLE_PRESETS[roleKey].reliabilityBase) || 0.92;
    const idx = Math.max(0, Math.min(4, (Number(seniorityLevel) || 1) - 1));
    const adj = SENIORITY_R_DELTAS[idx] || 0;
    return clamp(base + adj, 0.80, 0.99);
  }

  function applyRoleHierarchyOverrides(preset, roleKey, seniorityLevel){
    const level = Number(seniorityLevel) || 1;

    // Avoid minutes/instant as default feedback speed
    if (preset.Q8 && preset.Q8 > 4) {
      preset.Q8 = 4;
    }

    // Software/tech: days at entry, weeks at the highest hierarchy
    if (['software', 'engineering'].includes(roleKey)) {
      preset.Q8 = level >= 5 ? 2 : 3;
    }

    // Finance execs: dial digitization to 61-80% (not 81-100%)
    if (roleKey === 'finance' && level >= 4) {
      preset.Q4 = 4;
    }

    // Senior journalists: heavy human judgment/relationships and tacit knowledge
    if (roleKey === 'journalism' && level >= 4) {
      preset.Q11 = 5; // Essential
      preset.Q9 = 5;  // Mostly tacit
    }

    // Consulting/strategy execs: moderate physical presence
    if (roleKey === 'consulting' && level >= 4) {
      preset.Q12 = 3; // Moderate physical presence
    }

    // Final clamp to keep all answers within bounds
    Object.keys(preset).forEach(q => {
      preset[q] = clamp(preset[q], 1, 5);
    });

    return preset;
  }

  // Helper: build recommended answers for a role + seniority (clamped 1..5)
  function buildQuestionPreset(roleKey, seniorityLevel){
    const base = ROLE_QUESTION_PRESETS[roleKey] || ROLE_QUESTION_PRESETS.custom || NEUTRAL_ANSWERS;
    const deltas = SENIORITY_Q_DELTAS[seniorityLevel] || {};
    const preset = {};

    for (const [qid, baseVal] of Object.entries(base)) {
      const delta = deltas[qid] || 0;
      const nextVal = Number.isFinite(baseVal) ? baseVal + delta : 3;
      preset[qid] = clamp(nextVal, 1, 5);
    }

    return applyRoleHierarchyOverrides(preset, roleKey, seniorityLevel);
  }

  const ROLE_FACTOR_PRESETS = Object.keys(ROLE_QUESTION_PRESETS).reduce((acc, roleKey) => {
    acc[roleKey] = buildQuestionnaireProfileFromLegacyAnswers(ROLE_QUESTION_PRESETS[roleKey], 3);
    return acc;
  }, {});

  function buildQuestionnaireProfilePreset(roleKey, seniorityLevel){
    const legacyPreset = buildQuestionPreset(roleKey, seniorityLevel);
    return buildQuestionnaireProfileFromLegacyAnswers(legacyPreset, seniorityLevel);
  }

  window.WWILMJ_PRESETS = {
    ROLE_PRESETS,
    ROLE_QUESTION_PRESETS,
    ROLE_FACTOR_PRESETS,
    SENIORITY_Q_DELTAS,
    SENIORITY_R_DELTAS,
    NEUTRAL_ANSWERS,
    NEUTRAL_PROFILE,
    recommendReliability,
    buildQuestionPreset,
    buildQuestionnaireProfilePreset,
    buildQuestionnaireProfileFromLegacyAnswers,
    buildLegacyAnswersFromQuestionnaireProfile,
  };
})();
