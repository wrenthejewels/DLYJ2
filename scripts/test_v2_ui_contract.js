const fs = require('fs');
const path = require('path');

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Expected ${label} to include ${needle}`);
  }
}

function assertExcludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new Error(`Expected ${label} to exclude ${needle}`);
  }
}

function main() {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

  [
    'v2-composition-headline',
    'v2-composition-summary',
    'v2-composition-onet_tasks',
    'v2-composition-reviewed_job_posting_tasks',
    'v2-composition-reviewed_role_graph_tasks',
    'v2-composition-functions',
    'v2-current-bundle',
    'v2-bargaining-bundle',
    'v2-direct-bundle',
    'v2-indirect-bundle',
    'v2-residual-bundle',
    'v2-explanation-driver',
    'v2-explanation-counterweight',
    'v2-explanation-evidence',
    'v2-explanation-review',
    'v2-explanation-copy'
  ].forEach((id) => {
    assertIncludes(html, `id="${id}"`, 'index.html');
  });

  [
    'populateV2RoleComposition',
    'renderV2RoleComposition',
    'getCompositionEditsForEngine',
    'buildRoleFateMap',
    'renderV2OccupationExplanation',
    'QUESTIONNAIRE_MODULES',
    'buildQuestionNode',
    "renderV2ClusterList('v2-bargaining-bundle'",
    "renderV2ClusterList('v2-direct-bundle'",
    "renderV2ClusterList('v2-indirect-bundle'"
  ].forEach((token) => {
    assertIncludes(app, token, 'app.js');
  });

  assertExcludes(html, 'id="q1-1"', 'index.html');
  [
    'id="v2-task-primary"',
    'id="v2-task-secondary"',
    'id="v2-task-critical"',
    'id="v2-task-supported"',
    'id="v2-task-spillover"'
  ].forEach((needle) => {
    assertExcludes(html, needle, 'index.html');
  });

  console.log(JSON.stringify({
    status: 'ok',
    checked: {
      compositionCards: 4,
      roleFateColumns: 5,
      questionnaireRenderedFromSchema: true
    }
  }, null, 2));
}

main();
