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
    'v2-task-primary',
    'v2-task-secondary',
    'v2-task-critical',
    'v2-task-supported',
    'v2-task-spillover',
    'v2-current-bundle',
    'v2-bargaining-bundle',
    'v2-direct-bundle',
    'v2-indirect-bundle',
    'v2-residual-bundle'
  ].forEach((id) => {
    assertIncludes(html, `id="${id}"`, 'index.html');
  });

  [
    'populateV2TaskInputs',
    'syncV2TaskSelectionState',
    'buildRoleFateMap',
    'QUESTIONNAIRE_MODULES',
    'buildQuestionNode',
    "renderV2ClusterList('v2-bargaining-bundle'",
    "renderV2ClusterList('v2-direct-bundle'",
    "renderV2ClusterList('v2-indirect-bundle'"
  ].forEach((token) => {
    assertIncludes(app, token, 'app.js');
  });

  assertExcludes(html, 'id="q1-1"', 'index.html');

  console.log(JSON.stringify({
    status: 'ok',
    checked: {
      taskInputs: 5,
      roleFateColumns: 5,
      questionnaireRenderedFromSchema: true
    }
  }, null, 2));
}

main();
