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
    answers: {
      Q1: 4,
      Q2: 4,
      Q3: 4,
      Q4: 5,
      Q5: 4,
      Q6: 3,
      Q7: 3,
      Q8: 4,
      Q9: 2,
      Q10: 3,
      Q11: 2,
      Q12: 1,
      Q13: 4,
      Q14: 3,
      Q15: 2,
      Q16: 4,
      Q17: 4,
      Q18: 4,
      Q19: 4
    },
    seniorityLevel: 3,
    dominantTaskClusters: ['cluster_drafting', 'cluster_qa_review'],
    roleCriticalClusters: ['cluster_oversight_strategy'],
    aiToolSupportLevel: 0.65,
    residualRoleDistinctiveness: 0.70
  });

  if (!result.recomposition_summary) {
    throw new Error('Expected recomposition_summary in result payload.');
  }

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

  console.log(JSON.stringify({
    summary: {
      occupation: result.selected_occupation_title,
      roleOutlook: result.role_outlook_label,
      topExposed: result.top_exposed_work?.label || null,
      topExposureLevel: result.top_exposed_work?.exposure_level || null,
      modeOfChange: result.mode_of_change,
      residualRoleStrength: result.residual_role_strength,
      personalizationFit: result.personalization_fit,
      recompositionRead: result.recomposition_summary.summary_label
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
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
