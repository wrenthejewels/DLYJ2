const path = require('path');
const DLYJV2 = require(path.resolve(__dirname, '..', 'v2_engine.js'));

function assertBounded(name, value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a bounded number in [0, 1], received ${value}`);
  }
}

async function main() {
  const engine = await DLYJV2.create({
    basePath: path.resolve(__dirname, '..')
  });

  const result = engine.computeResult({
    roleCategory: 'software',
    questionnaireProfile: {
      function_centrality: 0.54,
      human_signoff_requirement: 0.33,
      liability_and_regulatory_burden: 0.36,
      relationship_ownership: 0.29,
      exception_and_context_load: 0.36,
      workflow_decomposability: 0.72,
      organizational_adoption_readiness: 0.72,
      ai_observability_of_work: 0.83,
      dependency_bottleneck_strength: 0.43,
      handoff_and_coordination_complexity: 0.49,
      external_trust_requirement: 0.14,
      stakeholder_alignment_burden: 0.44,
      execution_vs_judgment_mix: 0.59,
      augmentation_fit: 0.54,
      substitution_risk_modifier: 0.68
    },
    seniorityLevel: 3,
    dominantTaskClusters: ['cluster_drafting', 'cluster_qa_review'],
    roleCriticalClusters: ['cluster_oversight_strategy']
  });

  const taskInventory = engine.getTaskInventory(result.selected_occupation_id, 6);
  if (!taskInventory.length) {
    throw new Error('Expected getTaskInventory to return seeded role tasks for the selected occupation.');
  }

  const roleComposition = engine.getRoleComposition(result.selected_occupation_id);
  if (!roleComposition) {
    throw new Error('Expected getRoleComposition to return editable role composition data.');
  }
  if (!Array.isArray(roleComposition.onet_tasks) || !Array.isArray(roleComposition.functions)) {
    throw new Error('Expected getRoleComposition to expose task buckets and functions.');
  }
  if (!roleComposition.defaults?.task_ids?.length) {
    throw new Error('Expected default selected task ids in role composition.');
  }
  if (!roleComposition.defaults?.function_ids?.length) {
    throw new Error('Expected default selected function ids in role composition.');
  }
  const sampleLinkedTask = roleComposition.onet_tasks.find((task) => Array.isArray(task.linked_functions) && task.linked_functions.length);
  if (!sampleLinkedTask) {
    throw new Error('Expected at least one editable task to expose linked function explanations.');
  }
  if (String(sampleLinkedTask.task_family_label || '').toLowerCase().includes('cluster')) {
    throw new Error('Expected editable task rows to expose plain-English task family labels.');
  }

  if (!result.recomposition_summary) {
    throw new Error('Expected recomposition_summary in result payload.');
  }

  if (result.questionnaire_profile_source !== 'native_profile') {
    throw new Error(`Expected native questionnaire profile path, received ${result.questionnaire_profile_source}.`);
  }
  if (!result.questionnaire_profile) {
    throw new Error('Expected questionnaire_profile in result payload.');
  }
  ['function_centrality', 'human_signoff_requirement', 'organizational_adoption_readiness', 'augmentation_fit', 'substitution_risk_modifier'].forEach((key) => {
    assertBounded(`questionnaire_profile.${key}`, result.questionnaire_profile[key]);
  });

  assertBounded('recomposition_summary.workflow_compression', result.recomposition_summary.workflow_compression);
  assertBounded('recomposition_summary.organizational_conversion', result.recomposition_summary.organizational_conversion);
  assertBounded('recomposition_summary.substitution_potential', result.recomposition_summary.substitution_potential);
  assertBounded('recomposition_summary.substitution_gap', result.recomposition_summary.substitution_gap);
  assertBounded('recomposition_summary.confidence_score', result.recomposition_summary.confidence_score);
  assertBounded('recomposition_summary.dependency_penalty', result.recomposition_summary.dependency_penalty);

  ['workflow_compression_band', 'organizational_conversion_band', 'substitution_potential_band', 'substitution_gap_band'].forEach((key) => {
    if (!result.recomposition_summary[key]) {
      throw new Error(`Expected ${key} in recomposition_summary.`);
    }
    assertBounded(`${key}.low`, result.recomposition_summary[key].low);
    assertBounded(`${key}.high`, result.recomposition_summary[key].high);
    if (result.recomposition_summary[key].low > result.recomposition_summary[key].high) {
      throw new Error(`${key}.low cannot exceed ${key}.high.`);
    }
  });

  if (result.recomposition_summary.substitution_potential > result.recomposition_summary.workflow_compression) {
    throw new Error('substitution_potential cannot exceed workflow_compression.');
  }

  if (!result.evidence_summary?.friction_dimensions) {
    throw new Error('Expected friction_dimensions in evidence_summary.');
  }

  ['exception_burden', 'accountability_load', 'judgment_requirement', 'document_intensity', 'tacit_context_dependence'].forEach((key) => {
    assertBounded(`evidence_summary.friction_dimensions.${key}`, result.evidence_summary.friction_dimensions[key]);
  });

  if (!result.wave_trajectory) {
    throw new Error('Expected wave_trajectory in result payload.');
  }
  ['current', 'next', 'distant'].forEach((wave) => {
    if (!result.wave_trajectory[wave]) {
      throw new Error(`Expected wave_trajectory.${wave} in result payload.`);
    }
    assertBounded(`wave_trajectory.${wave}.retained_share`, result.wave_trajectory[wave].retained_share);
    assertBounded(`wave_trajectory.${wave}.coherence`, result.wave_trajectory[wave].coherence);
  });

  if (!result.primary_displacement_wave) {
    throw new Error('Expected primary_displacement_wave in result payload.');
  }

  if (!result.task_breakdown?.tasks?.length) {
    throw new Error('Expected populated task_breakdown.tasks in result payload.');
  }

  result.task_breakdown.tasks.slice(0, 10).forEach((task, index) => {
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty`, task.automation_difficulty);
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty_baseline`, task.automation_difficulty_baseline);
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty_task_first_weight`, task.automation_difficulty_task_first_weight);
    assertBounded(`task_breakdown.tasks[${index}].automation_difficulty_evidence_weight`, task.automation_difficulty_evidence_weight);
    if (!['cluster_priors', 'task_first_cluster_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_baseline_source)) {
      throw new Error(`Expected task_breakdown.tasks[${index}].automation_difficulty_baseline_source to expose the live baseline path.`);
    }
    assertBounded(`task_breakdown.tasks[${index}].direct_exposure_pressure`, task.direct_exposure_pressure);
    assertBounded(`task_breakdown.tasks[${index}].direct_pressure_baseline`, task.direct_pressure_baseline);
    assertBounded(`task_breakdown.tasks[${index}].indirect_dependency_pressure`, task.indirect_dependency_pressure);
    assertBounded(`task_breakdown.tasks[${index}].retained_leverage`, task.retained_leverage);
    assertBounded(`task_breakdown.tasks[${index}].direct_pressure_evidence_weight`, task.direct_pressure_evidence_weight);
    if (task.direct_pressure_evidence_signal !== null) {
      assertBounded(`task_breakdown.tasks[${index}].direct_pressure_evidence_signal`, task.direct_pressure_evidence_signal);
    }
  });

  const evidenceAdjustedTasks = result.task_breakdown.tasks.filter((task) => Number(task.direct_pressure_evidence_weight) > 0);
  if (!evidenceAdjustedTasks.length) {
    throw new Error('Expected at least one task to receive direct task-evidence pressure blending.');
  }
  evidenceAdjustedTasks.forEach((task, index) => {
    if (task.direct_pressure_source !== 'resolved_task_evidence') {
      throw new Error(`Expected evidence-adjusted task ${index} to be labeled as resolved_task_evidence.`);
    }
  });
  const materiallyShiftedTask = evidenceAdjustedTasks.find((task) => {
    return Math.abs(Number(task.direct_exposure_pressure) - Number(task.direct_pressure_baseline)) >= 0.01;
  });
  if (!materiallyShiftedTask) {
    throw new Error('Expected direct task evidence blending to materially shift at least one task direct pressure.');
  }
  const automationAdjustedTasks = result.task_breakdown.tasks.filter((task) => Number(task.automation_difficulty_evidence_weight) > 0);
  if (!automationAdjustedTasks.length) {
    throw new Error('Expected at least one task to receive direct task-evidence difficulty blending.');
  }
  automationAdjustedTasks.forEach((task, index) => {
    if (!['resolved_task_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_source)) {
      throw new Error(`Expected automation-adjusted task ${index} to be labeled as a task-evidence-driven source.`);
    }
  });
  const materiallyShiftedDifficultyTask = automationAdjustedTasks.find((task) => {
    return Math.abs(Number(task.automation_difficulty) - Number(task.automation_difficulty_baseline)) >= 0.01;
  });
  if (!materiallyShiftedDifficultyTask) {
    throw new Error('Expected direct task evidence blending to materially shift at least one task automation difficulty.');
  }
  const benchmarkResolvedTask = result.task_breakdown.tasks.find((task) => {
    return task.resolved_evidence_source_role === 'benchmark_task_label' &&
      Number(task.automation_difficulty_evidence_weight) > 0;
  });
  if (!benchmarkResolvedTask) {
    throw new Error('Expected benchmark task labels to participate in the task-evidence resolver for at least one active task.');
  }
  if (result.task_breakdown.tasks.some((task) =>
    task.resolved_evidence_source_role === 'benchmark_task_label' &&
    task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected benchmark task labels to remain below the stricter task-first task-baseline gate in the software-developer scenario.');
  }
  if ((result.diagnostics.task_first_task_count || 0) < 1) {
    throw new Error('Expected diagnostics.task_first_task_count to report at least one task-first task baseline.');
  }
  if ((result.evidence_summary?.source_coverage?.task_first_task_rows || 0) < 1) {
    throw new Error('Expected source_coverage.task_first_task_rows to report task-first task baseline usage.');
  }
  if (!result.task_breakdown.tasks.some((task) => task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected at least one task row to use task_first_resolved_evidence as its baseline source.');
  }

  assertBounded('diagnostics.direct_exposure_pressure', result.diagnostics.direct_exposure_pressure);
  assertBounded('diagnostics.indirect_dependency_pressure', result.diagnostics.indirect_dependency_pressure);
  assertBounded('diagnostics.residual_role_integrity', result.diagnostics.residual_role_integrity);
  if ((result.diagnostics.task_evidence_adjusted_tasks || 0) < 1) {
    throw new Error('Expected diagnostics.task_evidence_adjusted_tasks to report at least one adjusted task.');
  }

  if (!result.role_fate_label) {
    throw new Error('Expected role_fate_label in result payload.');
  }

  if (!result.transformation_map?.current_bundle?.length) {
    throw new Error('Expected transformation_map.current_bundle in result payload.');
  }
  const sampleCluster = result.transformation_map.current_bundle[0];
  [
    'share_of_role',
    'automation_difficulty',
    'absorption_rate',
    'direct_exposure_pressure',
    'indirect_dependency_pressure',
    'retained_leverage',
    'exposed_share',
    'retained_share'
  ].forEach((key) => {
    assertBounded(`transformation_map.current_bundle[0].${key}`, sampleCluster[key]);
  });
  if (sampleCluster.summary_source !== 'task_aggregated') {
    throw new Error('Expected transformation_map cluster summaries to be task_aggregated.');
  }
  if (!['cluster_priors', 'task_first_cluster_evidence'].includes(sampleCluster.baseline_difficulty_source)) {
    throw new Error('Expected transformation_map cluster summaries to expose the baseline difficulty source.');
  }
  assertBounded('transformation_map.current_bundle[0].task_first_weight', sampleCluster.task_first_weight);
  if (typeof sampleCluster.task_first_task_count !== 'number' || sampleCluster.task_first_task_count < 0) {
    throw new Error('Expected transformation_map cluster summaries to expose task_first_task_count.');
  }
  if (sampleCluster.wave_assignment_source !== 'task_aggregated') {
    throw new Error('Expected transformation_map cluster wave assignments to be task_aggregated.');
  }
  if (!String(sampleCluster.automation_difficulty_source || '').startsWith('task_aggregated')) {
    throw new Error('Expected transformation_map cluster automation difficulty to be task-aggregated.');
  }
  if (![
    'task_aggregated_cluster_model',
    'task_aggregated_resolved_task_evidence',
    'task_aggregated_task_first_resolved_evidence'
  ].includes(sampleCluster.automation_difficulty_source)) {
    throw new Error('Expected transformation_map cluster automation difficulty source to expose the live task-derived source path.');
  }
  if (result.top_exposed_work && !result.transformation_map.exposed_clusters.some((cluster) => cluster.task_cluster_id === result.top_exposed_work.task_cluster_id)) {
    throw new Error('Expected top_exposed_work to come from the task-derived exposed cluster summaries.');
  }

  if (!result.occupation_explanation) {
    throw new Error('Expected occupation_explanation in result payload.');
  }
  if (!result.occupation_explanation.explanation_summary) {
    throw new Error('Expected occupation_explanation.explanation_summary in result payload.');
  }
  if (!result.evidence_summary?.explanation_summary) {
    throw new Error('Expected evidence_summary.explanation_summary in result payload.');
  }
  if (!result.function_metrics) {
    throw new Error('Expected function_metrics in result payload.');
  }
  [
    'function_exposure_pressure',
    'retained_function_strength',
    'retained_accountability_strength',
    'retained_bargaining_power',
    'delegation_likelihood',
    'headcount_displacement_risk',
    'confidence_score'
  ].forEach((key) => {
    assertBounded(`function_metrics.${key}`, result.function_metrics[key]);
  });
  if (!Array.isArray(result.function_metrics.per_function_breakdown) || !result.function_metrics.per_function_breakdown.length) {
    throw new Error('Expected function_metrics.per_function_breakdown in result payload.');
  }

  const taskDrivenResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    compositionEdits: {
      removed_task_ids: roleComposition.defaults.task_ids.slice(0, 2),
      removed_function_ids: roleComposition.defaults.function_ids.slice(1)
    }
  });

  if (taskDrivenResult.task_breakdown.total_tasks_considered >= result.task_breakdown.total_tasks_considered) {
    throw new Error('Expected composition edits to shrink the active task set.');
  }
  const activeFunctionCount = taskDrivenResult.occupation_assignment?.selected_composition?.active_function_count || 0;
  if (roleComposition.defaults.function_ids.length > 1 && activeFunctionCount >= roleComposition.defaults.function_ids.length) {
    throw new Error('Expected composition edits to shrink the active function set when multiple function anchors exist.');
  }
  if (activeFunctionCount < 1) {
    throw new Error('Expected at least one active function after composition edits.');
  }
  assertBounded('taskDrivenResult.role_fate_confidence', taskDrivenResult.role_fate_confidence);
  if ((taskDrivenResult.occupation_explanation?.function_anchor_count || 0) !== activeFunctionCount) {
    throw new Error('Expected live occupation explanation to reflect the edited active function count.');
  }

  const reviewedEvidenceResult = engine.computeResult({
    occupationId: 'occ_13_1199_00',
    seniorityLevel: 3
  });
  const reviewedResolvedTask = reviewedEvidenceResult.task_breakdown.tasks.find((task) => {
    return task.resolved_evidence_source_role === 'reviewed_task_estimate' &&
      Number(task.automation_difficulty_evidence_weight) > 0 &&
      ['resolved_task_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_source);
  });
  if (!reviewedResolvedTask) {
    throw new Error('Expected reviewed task estimates to participate in the task-evidence resolver for reviewed-gap occupations.');
  }
  if ((reviewedEvidenceResult.evidence_summary?.source_coverage?.reviewed_task_estimate_rows || 0) < 1) {
    throw new Error('Expected source_coverage.reviewed_task_estimate_rows to report reviewed task evidence usage.');
  }
  if ((reviewedEvidenceResult.diagnostics?.task_first_cluster_count || 0) < 1) {
    throw new Error('Expected diagnostics.task_first_cluster_count to report at least one task-first cluster baseline.');
  }
  if ((reviewedEvidenceResult.evidence_summary?.source_coverage?.task_first_cluster_rows || 0) < 1) {
    throw new Error('Expected source_coverage.task_first_cluster_rows to report task-first cluster baseline usage.');
  }
  if (!reviewedEvidenceResult.transformation_map.current_bundle.some((cluster) => cluster.baseline_difficulty_source === 'task_first_cluster_evidence')) {
    throw new Error('Expected reviewed evidence scenario to expose at least one task_first_cluster_evidence cluster baseline.');
  }
  if (!reviewedEvidenceResult.task_breakdown.tasks.some((task) => ['task_first_cluster_evidence', 'task_first_resolved_evidence'].includes(task.automation_difficulty_baseline_source))) {
    throw new Error('Expected reviewed evidence scenario to project a task-first baseline onto at least one task row.');
  }
  if ((reviewedEvidenceResult.diagnostics?.task_first_task_count || 0) < 1) {
    throw new Error('Expected diagnostics.task_first_task_count to report at least one task-first task baseline in the reviewed evidence scenario.');
  }
  if (!reviewedEvidenceResult.task_breakdown.tasks.some((task) => task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected reviewed evidence scenario to promote at least one task into the task-first task baseline path.');
  }
  if (!reviewedEvidenceResult.task_breakdown.tasks.some((task) =>
    task.resolved_evidence_source_role === 'reviewed_task_estimate' &&
    task.automation_difficulty_baseline_source === 'task_first_resolved_evidence')) {
    throw new Error('Expected reviewed task estimates to clear the source-aware task-first task-baseline gate.');
  }
  if (!reviewedEvidenceResult.transformation_map.current_bundle.some((cluster) => cluster.automation_difficulty_source === 'task_aggregated_task_first_resolved_evidence')) {
    throw new Error('Expected reviewed evidence scenario to expose task_aggregated_task_first_resolved_evidence at the cluster summary layer.');
  }

  const shareOverrideTaskId = roleComposition.defaults.task_ids[0];
  const baseTaskRow = result.task_breakdown.tasks.find((task) => task.task_id === shareOverrideTaskId);
  const shareDrivenResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    compositionEdits: {
      task_share_overrides: {
        [shareOverrideTaskId]: 0.30
      }
    }
  });
  const shareTaskRow = shareDrivenResult.task_breakdown.tasks.find((task) => task.task_id === shareOverrideTaskId);
  if (!baseTaskRow || !shareTaskRow) {
    throw new Error('Expected task share override scenario to find the target task in both runs.');
  }
  if (shareTaskRow.share_of_role <= baseTaskRow.share_of_role) {
    throw new Error('Expected task share override to increase the task share_of_role.');
  }
  if ((shareDrivenResult.occupation_assignment?.selected_composition?.share_override_count || 0) !== 1) {
    throw new Error('Expected task share override count to register in the selected composition summary.');
  }

  const functionLinkedResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    compositionEdits: {
      task_function_links: [
        {
          task_id: roleComposition.defaults.task_ids[0],
          function_id: roleComposition.defaults.function_ids[0]
        }
      ]
    }
  });
  if ((functionLinkedResult.occupation_assignment?.selected_composition?.custom_function_link_count || 0) !== 1) {
    throw new Error('Expected task-to-function link count to register in the selected composition summary.');
  }
  if ((functionLinkedResult.occupation_assignment?.selected_composition?.active_task_function_link_count || 0) < 1) {
    throw new Error('Expected active task-to-function link count to be tracked in the selected composition summary.');
  }

  const dependencyDrivenResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: result.questionnaire_profile,
    seniorityLevel: 3,
    dependencyEdits: {
      added_edges: roleComposition.defaults.task_ids.length >= 2
        ? [{ from_task_id: roleComposition.defaults.task_ids[0], to_task_id: roleComposition.defaults.task_ids[1] }]
        : []
    }
  });
  if ((dependencyDrivenResult.occupation_assignment?.selected_composition?.added_dependency_count || 0) !== 1) {
    throw new Error('Expected dependency edits to register in the selected composition summary.');
  }
  assertBounded('dependencyDrivenResult.diagnostics.indirect_dependency_pressure', dependencyDrivenResult.diagnostics.indirect_dependency_pressure);

  const businessOps = engine.computeResult({
    occupationId: 'occ_13_1199_00',
    roleCategory: 'consulting',
    questionnaireProfile: {
      function_centrality: 0.5,
      human_signoff_requirement: 0.5,
      liability_and_regulatory_burden: 0.5,
      relationship_ownership: 0.5,
      exception_and_context_load: 0.5,
      workflow_decomposability: 0.5,
      organizational_adoption_readiness: 0.5,
      ai_observability_of_work: 0.5,
      dependency_bottleneck_strength: 0.5,
      handoff_and_coordination_complexity: 0.5,
      external_trust_requirement: 0.5,
      stakeholder_alignment_burden: 0.5,
      execution_vs_judgment_mix: 0.5,
      augmentation_fit: 0.5,
      substitution_risk_modifier: 0.5
    },
    seniorityLevel: 3
  });

  if (businessOps.selected_occupation_id !== 'occ_13_1199_00') {
    throw new Error('Expected explicit occupationId to resolve Business Operations Specialists, All Other.');
  }
  if (!businessOps.task_breakdown?.tasks?.length) {
    throw new Error('Expected task breakdown for Business Operations Specialists, All Other.');
  }
  assertBounded('businessOps.diagnostics.direct_exposure_pressure', businessOps.diagnostics.direct_exposure_pressure);
  assertBounded('businessOps.diagnostics.indirect_dependency_pressure', businessOps.diagnostics.indirect_dependency_pressure);

  const lawyerResult = engine.computeResult({
    occupationId: 'occ_23_1011_00',
    seniorityLevel: 3
  });
  const officeClerkResult = engine.computeResult({
    occupationId: 'occ_43_9061_00',
    seniorityLevel: 3
  });
  if (Number(lawyerResult.function_metrics?.retained_bargaining_power || 0) <= Number(officeClerkResult.function_metrics?.retained_bargaining_power || 0)) {
    throw new Error('Expected Lawyers to retain more bargaining power than Office Clerks, General in the live scoring path.');
  }
  if (Number(officeClerkResult.function_metrics?.retained_bargaining_power || 1) >= 0.50) {
    throw new Error('Expected Office Clerks, General to stay below the bargaining-power overstatement threshold.');
  }
  if (Number(officeClerkResult.recomposition_summary?.workflow_compression || 0) <= 0.18) {
    throw new Error('Expected Office Clerks, General to retain the stronger routine-compression signal in the live scoring path.');
  }

  const structuredProfileResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    questionnaireProfile: {
      function_centrality: 0.72,
      human_signoff_requirement: 0.68,
      liability_and_regulatory_burden: 0.61,
      relationship_ownership: 0.48,
      exception_and_context_load: 0.63,
      workflow_decomposability: 0.71,
      organizational_adoption_readiness: 0.67,
      ai_observability_of_work: 0.83,
      dependency_bottleneck_strength: 0.58,
      handoff_and_coordination_complexity: 0.54,
      external_trust_requirement: 0.46,
      stakeholder_alignment_burden: 0.59,
      execution_vs_judgment_mix: 0.43,
      augmentation_fit: 0.77,
      substitution_risk_modifier: 0.64
    },
    seniorityLevel: 3
  });

  if (structuredProfileResult.questionnaire_profile_source !== 'native_profile') {
    throw new Error(`Expected native questionnaire profile path, received ${structuredProfileResult.questionnaire_profile_source}.`);
  }
  assertBounded('structuredProfileResult.role_fate_confidence', structuredProfileResult.role_fate_confidence);
  assertBounded('structuredProfileResult.diagnostics.function_retention', structuredProfileResult.diagnostics.function_retention);
  assertBounded('structuredProfileResult.diagnostics.augmentation_fit', structuredProfileResult.diagnostics.augmentation_fit);
  assertBounded('structuredProfileResult.diagnostics.substitution_risk_modifier', structuredProfileResult.diagnostics.substitution_risk_modifier);

  const legacyCompatibilityResult = engine.computeResult({
    occupationId: result.selected_occupation_id,
    roleCategory: 'software',
    answers: {
      Q1: 4, Q2: 4, Q3: 4, Q4: 5, Q5: 4, Q6: 3,
      Q7: 3, Q8: 4, Q9: 2,
      Q11: 2, Q12: 1, Q13: 4, Q14: 3, Q16: 4
    },
    seniorityLevel: 3
  });

  if (legacyCompatibilityResult.questionnaire_profile_source !== 'legacy_answers') {
    throw new Error(`Expected explicit legacy fallback path, received ${legacyCompatibilityResult.questionnaire_profile_source}.`);
  }

  console.log(JSON.stringify({
    summary: {
      occupation: result.selected_occupation_title,
      roleOutlook: result.role_outlook_label,
      roleFate: result.role_fate_label,
      primaryDisplacementWave: result.primary_displacement_wave,
      topExposed: result.top_exposed_work?.label || null,
      topExposedWave: result.top_exposed_work?.wave_assignment || null,
      residualRoleStrength: result.residual_role_strength,
      personalizationFit: result.personalization_fit,
      recompositionRead: result.recomposition_summary.summary_label
    },
    waveTrajectory: {
      current: result.wave_trajectory.current.state + ' (' + result.wave_trajectory.current.retained_share + ')',
      next: result.wave_trajectory.next.state + ' (' + result.wave_trajectory.next.retained_share + ')',
      distant: result.wave_trajectory.distant.state + ' (' + result.wave_trajectory.distant.retained_share + ')'
    },
    counts: {
      currentBundle: result.transformation_map.current_bundle.length,
      exposedClusters: result.transformation_map.exposed_clusters.length,
      retainedClusters: result.transformation_map.retained_clusters.length,
      elevatedClusters: result.transformation_map.elevated_clusters.length
    },
    recomposition: {
      workflowCompression: result.recomposition_summary.workflow_compression,
      workflowCompressionBand: result.recomposition_summary.workflow_compression_band,
      substitutionPotential: result.recomposition_summary.substitution_potential,
      substitutionGap: result.recomposition_summary.substitution_gap,
      confidence: result.recomposition_summary.confidence_label
    },
    roleGraph: {
      directExposurePressure: result.diagnostics.direct_exposure_pressure,
      indirectDependencyPressure: result.diagnostics.indirect_dependency_pressure,
      residualRoleIntegrity: result.diagnostics.residual_role_integrity
    },
    taskSelection: {
      inventoryRows: taskInventory.length,
      roleFate: taskDrivenResult.role_fate_label,
      selectedTaskCount: taskDrivenResult.task_breakdown.user_selected_task_count
    },
    businessOps: {
      occupation: businessOps.selected_occupation_title,
      taskCount: businessOps.task_breakdown.total_tasks_considered,
      topExposed: businessOps.top_exposed_work?.label || null
    },
    structuredProfile: {
      roleFate: structuredProfileResult.role_fate_label,
      functionRetention: structuredProfileResult.diagnostics.function_retention,
      substitutionRiskModifier: structuredProfileResult.diagnostics.substitution_risk_modifier
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
