const test = require('node:test');
const assert = require('node:assert/strict');
const { registerHooks } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const apiCalls = [];
const mockState = {
  apiHandler: async () => ({ data: {} }),
};

globalThis.__lefApi = async (method, url, payload) => {
  apiCalls.push({ method, url, payload });
  return mockState.apiHandler(method, url, payload);
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './apiClient' || specifier.endsWith('/api/apiClient')) {
      return { shortCircuit: true, url: 'mock://lef-api-client' };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock://lef-api-client') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          export default {
            async get(url, config) { return globalThis.__lefApi('GET', url, config); },
            async post(url, body, config) { return globalThis.__lefApi('POST', url, { body, config }); },
          };
        `,
      };
    }
    return nextLoad(url, context);
  },
});

test.beforeEach(() => {
  apiCalls.length = 0;
  mockState.apiHandler = async () => ({ data: {} });
});

test('Bug #1: learningApi.getDSAPath unwraps outer object with modules array and normalizes counts', async () => {
  mockState.apiHandler = async () => ({
    data: {
      id: 'dsa',
      title: 'Complete DSA Mastery Path',
      modules: [
        {
          id: 1,
          slug: 'array',
          title: 'Array Fundamentals',
          description: 'Arrays',
          progress: { solved: 3, total: 45, percentage: 7 },
        },
      ],
    },
  });

  const { learningApi } = await import('../learningApi.js');
  const modules = await learningApi.getDSAPath();

  assert.equal(Array.isArray(modules), true);
  assert.equal(modules.length, 1);
  assert.equal(modules[0].slug, 'array');
  assert.equal(modules[0].completed_topics, 3);
  assert.equal(modules[0].total_topics, 45);
});

test('Bug #2: learningApi.getTopic routes HR, System Design, Technical, and DSA topics to their own endpoints', async () => {
  const { learningApi } = await import('../learningApi.js');

  await learningApi.getTopic('hr1', 'hr');
  await learningApi.getTopic('sd3', 'system-design');
  await learningApi.getTopic('tech2', 'technical');
  await learningApi.getTopic('array', 'dsa');
  // Even without explicit pathType, prefixed IDs resolve away from DSA lookup
  await learningApi.getDSATopic('hr4');
  await learningApi.getDSATopic('sd5');
  await learningApi.getDSATopic('tech1');

  assert.deepEqual(
    apiCalls.map((c) => c.url),
    [
      '/api/user/learning-path/hr/module/hr1',
      '/api/user/learning-path/system-design/module/sd3',
      '/api/user/learning-path/technical/module/tech2',
      '/api/user/learning-path/dsa/module/array',
      '/api/user/learning-path/hr/module/hr4',
      '/api/user/learning-path/system-design/module/sd5',
      '/api/user/learning-path/technical/module/tech1',
    ],
  );
});

test('Bug #3: HR, System Design, and Technical learning path screens fetch real user progress with no hardcoded completions', () => {
  const hrSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/learning/HRLearningPathScreen.js'),
    'utf8',
  );
  const sdSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/learning/SystemDesignPathScreen.js'),
    'utf8',
  );
  const techSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/learning/TechnicalLearningPathScreen.js'),
    'utf8',
  );

  for (const src of [hrSrc, sdSrc, techSrc]) {
    assert.doesNotMatch(src, /MOCK_HR_PATH|MOCK_SD_PATH|MOCK_TECH_PATH/);
    assert.doesNotMatch(src, /completed_topics:\s*[1-9]/);
    assert.match(src, /learningApi\./);
    assert.match(src, /pathType:/);
  }
});

test('Bug #4: mobile editor.html, CodeEditorScreen, and SQLEditorScreen surface CDN errors with Retry and fallback input', () => {
  const editorHtml = fs.readFileSync(
    path.resolve(__dirname, '../../../assets/editor.html'),
    'utf8',
  );
  const codeEditorSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/dsa/CodeEditorScreen.js'),
    'utf8',
  );
  const sqlEditorSrc = fs.readFileSync(
    path.resolve(__dirname, '../../screens/dsa/SQLEditorScreen.js'),
    'utf8',
  );

  assert.match(editorHtml, /onerror=/);
  assert.match(editorHtml, /reportEditorLoadError/);
  assert.match(editorHtml, /setTimeout/);

  for (const src of [codeEditorSrc, sqlEditorSrc]) {
    assert.match(src, /editorStatus === "error"/);
    assert.match(src, /handleRetryEditor/);
    assert.match(src, /onError=\{/);
    assert.match(src, /onHttpError=\{/);
    assert.match(src, /TextInput/);
  }
});
