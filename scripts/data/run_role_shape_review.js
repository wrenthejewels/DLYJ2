const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  if (!rows.length) {
    return [];
  }

  const header = rows[0].map((column, index) => {
    if (index === 0) {
      return String(column || '').replace(/^\uFEFF/, '');
    }
    return column;
  });

  return rows
    .slice(1)
    .filter((entry) => entry.some((value) => String(value || '').trim().length))
    .map((entry) => {
      const record = {};
      header.forEach((column, index) => {
        record[column] = entry[index] !== undefined ? entry[index] : '';
      });
      return record;
    });
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numeric = Number(String(value).trim());
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatMaybe(value) {
  return typeof value === 'number' && !Number.isNaN(value)
    ? value.toFixed(3)
    : 'n/a';
}

const IMPLEMENTED_ROLE_VARIANTS = new Set([
  'occ_13_1161_00',
  'occ_27_3041_00',
  'occ_27_3042_00',
  'occ_27_3023_00',
  'occ_13_1111_00'
]);

function roleShapeStatus(row) {
  if (IMPLEMENTED_ROLE_VARIANTS.has(row.occupation_id)) {
    return 'implemented_first_pass';
  }
  const strongCandidate = row.primary_review_layer === 'role_shape_heterogeneity' && (
    row.role_heterogeneity_review === 'medium' ||
    (row.function_anchor_count >= 2 && row.role_shape_candidate_score >= 0.43) ||
    (row.function_anchor_count <= 1 && row.role_heterogeneity_target >= 0.39 && row.role_shape_candidate_score >= 0.48)
  );
  if (strongCandidate) {
    return 'strong_candidate';
  }
  if (
    row.primary_review_layer === 'role_shape_heterogeneity' &&
    row.role_shape_candidate_score >= 0.45
  ) {
    return 'watchlist';
  }
  return 'not_now';
}

function roleShapeReason(row) {
  if (row.role_shape_status === 'implemented_first_pass') {
    return 'Now implemented as a reviewed runtime role-variant occupation; keep reviewing it for deeper function coverage and future expansion.';
  }
  if (row.role_shape_status === 'strong_candidate') {
    if (row.function_anchor_count <= 1) {
      return 'High heterogeneity signal with role-shape review pressure and too few function anchors for a likely split occupation.';
    }
    return 'High heterogeneity signal with direct role-shape review pressure and enough retained-function complexity to justify explicit variant modeling.';
  }
  if (row.role_shape_status === 'watchlist') {
    return 'Meaningful role-shape pressure exists, but the evidence still looks better suited to monitoring than immediate variant modeling.';
  }
  return 'Current evidence does not justify a dedicated multi-variant occupation split ahead of stronger queues.';
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const normalizedDir = path.join(repoRoot, 'data', 'normalized');
  const docsDir = path.join(repoRoot, 'docs', 'data');
  const targets = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_structural_calibration_targets.csv'), 'utf8'));
  const explanations = parseCsv(fs.readFileSync(path.join(normalizedDir, 'occupation_role_explanations.csv'), 'utf8'));
  const explanationById = Object.fromEntries(explanations.map((row) => [row.occupation_id, row]));

  const rows = targets.map((target) => {
    const explanation = explanationById[target.occupation_id] || {};
    const functionAnchorCount = toNumber(explanation.function_anchor_count, 1);
    const roleHeterogeneityTarget = clamp(toNumber(target.role_heterogeneity_target, 0), 0, 1);
    const roleHeterogeneityGap = clamp(toNumber(target.role_heterogeneity_gap, 0), 0, 1);
    const primaryLayer = target.primary_review_layer || '';
    const roleReview = target.role_heterogeneity_review || 'ok';
    const roleShapePressure = primaryLayer === 'role_shape_heterogeneity'
      ? 1
      : roleReview === 'medium'
        ? 0.7
        : roleReview === 'low'
          ? 0.45
          : 0.15;
    const anchorGap = functionAnchorCount <= 1
      ? 1
      : functionAnchorCount === 2
        ? 0.45
        : 0.1;
    const candidateScore = clamp(
      (roleHeterogeneityTarget * 0.45) +
      (roleHeterogeneityGap * 0.25) +
      (roleShapePressure * 0.20) +
      (anchorGap * 0.10),
      0,
      1
    );

    const row = {
      occupation_id: target.occupation_id,
      title: target.title,
      function_anchor_count: functionAnchorCount,
      role_heterogeneity_target: Number(roleHeterogeneityTarget.toFixed(3)),
      role_heterogeneity_gap: Number(roleHeterogeneityGap.toFixed(3)),
      role_heterogeneity_review: roleReview,
      primary_review_layer: primaryLayer,
      role_shape_candidate_score: Number(candidateScore.toFixed(3)),
      role_shape_status: 'not_now',
      role_shape_reason: '',
      source_mix: [target.heterogeneity_source_mix, target.adaptation_source_mix].filter(Boolean).join('|'),
      notes: target.notes || ''
    };
    row.role_shape_status = roleShapeStatus(row);
    row.role_shape_reason = roleShapeReason(row);
    return row;
  }).sort((left, right) => right.role_shape_candidate_score - left.role_shape_candidate_score);

  const csvPath = path.join(normalizedDir, 'occupation_role_shape_review.csv');
  const reportPath = path.join(docsDir, 'role_shape_review.md');
  const header = [
    'occupation_id',
    'title',
    'function_anchor_count',
    'role_heterogeneity_target',
    'role_heterogeneity_gap',
    'role_heterogeneity_review',
    'primary_review_layer',
    'role_shape_candidate_score',
    'role_shape_status',
    'role_shape_reason',
    'source_mix',
    'notes'
  ];
  const csvLines = [header.join(',')].concat(rows.map((row) => header.map((column) => csvEscape(row[column])).join(',')));
  fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`, 'utf8');

  const implemented = rows.filter((row) => row.role_shape_status === 'implemented_first_pass');
  const strongCandidates = rows.filter((row) => row.role_shape_status === 'strong_candidate');
  const watchlist = rows.filter((row) => row.role_shape_status === 'watchlist');

  const lines = [];
  lines.push('# Role Shape Review');
  lines.push('');
  lines.push('This report is a calibration-driven review artifact for deciding where one occupation likely hides multiple stable role variants.');
  lines.push('');
  lines.push('It does not directly score the live runtime on its own.');
  lines.push('It exists to tell the repo which occupations are the best candidates for reviewed role-variant expansion beyond the first implemented set.');
  lines.push('');
  lines.push('Generated from:');
  lines.push('- `data/normalized/occupation_structural_calibration_targets.csv`');
  lines.push('- `data/normalized/occupation_role_explanations.csv`');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- occupations reviewed: \`${rows.length}\``);
  lines.push(`- implemented first-pass variants: \`${implemented.length}\``);
  lines.push(`- strong candidates: \`${strongCandidates.length}\``);
  lines.push(`- watchlist: \`${watchlist.length}\``);
  lines.push(`- target table: \`data/normalized/occupation_role_shape_review.csv\``);
  lines.push('');

  lines.push('## Implemented First Pass');
  lines.push('');
  if (!implemented.length) {
    lines.push('- No occupation has been promoted into the reviewed runtime role-variant layer yet.');
  } else {
    lines.push('| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |');
    lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
    implemented.forEach((row) => {
      lines.push(`| ${row.title} | ${formatMaybe(row.role_shape_candidate_score)} | ${row.function_anchor_count} | ${formatMaybe(row.role_heterogeneity_target)} | ${formatMaybe(row.role_heterogeneity_gap)} | ${row.role_shape_reason} |`);
    });
  }
  lines.push('');

  lines.push('## Strong Candidates');
  lines.push('');
  if (!strongCandidates.length) {
    lines.push('- No occupation currently clears the strong-candidate threshold.');
  } else {
    lines.push('| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why now |');
    lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
    strongCandidates.forEach((row) => {
      lines.push(`| ${row.title} | ${formatMaybe(row.role_shape_candidate_score)} | ${row.function_anchor_count} | ${formatMaybe(row.role_heterogeneity_target)} | ${formatMaybe(row.role_heterogeneity_gap)} | ${row.role_shape_reason} |`);
    });
  }
  lines.push('');

  lines.push('## Watchlist');
  lines.push('');
  if (!watchlist.length) {
    lines.push('- No occupation currently sits on the role-shape watchlist.');
  } else {
    lines.push('| Occupation | Candidate score | Function anchors | Heterogeneity target | Gap | Why not yet |');
    lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
    watchlist.forEach((row) => {
      lines.push(`| ${row.title} | ${formatMaybe(row.role_shape_candidate_score)} | ${row.function_anchor_count} | ${formatMaybe(row.role_heterogeneity_target)} | ${formatMaybe(row.role_heterogeneity_gap)} | ${row.role_shape_reason} |`);
    });
  }
  lines.push('');

  lines.push('## Selection Rule');
  lines.push('');
  lines.push('- Strong candidate: role-shape review is primary and the occupation clears a higher heterogeneity/anchor threshold.');
  lines.push('- Watchlist: role-shape review is primary and the occupation is directionally split-looking, but the evidence is still weaker than the strong-candidate bar.');
  lines.push('- Not now: another layer should be tuned first, or the role-shape evidence is still too weak.');
  lines.push('');

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({
    reviewed: rows.length,
    strongCandidates: strongCandidates.map((row) => row.title),
    watchlist: watchlist.map((row) => row.title),
    csvPath,
    reportPath
  }, null, 2));
}

main();
