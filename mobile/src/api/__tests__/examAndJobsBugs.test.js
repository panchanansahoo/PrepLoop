const test = require('node:test');
const assert = require('node:assert/strict');
const { registerHooks } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const apiCalls = [];
let apiHandler = async () => ({ data: {} });

globalThis.__examJobsTestApi = async (method, url, config) => {
  apiCalls.push({ method, url, config });
  return apiHandler(method, url, config);
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './apiClient' || specifier.endsWith('/api/apiClient')) {
      return { shortCircuit: true, url: 'mock://ej-api-client' };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock://ej-api-client') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          export default {
            async get(url, config) { return globalThis.__examJobsTestApi('GET', url, config); },
          };
        `,
      };
    }
    return nextLoad(url, context);
  },
});

function readMobile(relPath) {
  return fs.readFileSync(path.resolve(__dirname, '../../', relPath), 'utf8');
}

function loadJobsScreenHelpers() {
  const src = readMobile('screens/jobs/JobsScreen.js');
  const cardIdx = src.indexOf('function JobCard(');
  assert.ok(cardIdx > 0, 'JobsScreen.js must define JobCard after pure helpers');

  const helperBlock = src
    .slice(0, cardIdx)
    .replace(/^import[\s\S]*?;\s*/gm, '');

  const sandbox = {
    module: { exports: {} },
  };
  vm.runInNewContext(
    `${helperBlock}
    module.exports = {
      JOB_TYPES,
      PAGE_LIMIT,
      extractJobsList,
      getJobKey,
      mergeUniqueJobs,
      computeHasMore,
      buildJobsQueryParams,
    };`,
    sandbox,
  );
  return sandbox.module.exports;
}

test.beforeEach(() => {
  apiCalls.length = 0;
  apiHandler = async () => ({ data: {} });
});

test('Bug #6: EXAM_CATALOG includes TCS/Infosys/Wipro, resolves legacy aliases, and rejects missing/invalid IDs cleanly', async () => {
  const {
    EXAM_CATALOG,
    getExamById,
    getFullExamQuestions,
    resolveExamId,
  } = await import(pathToFileURL(path.resolve(__dirname, '../../data/examData.js')).href);

  // Every exam in catalog loads non-empty sections and questions
  assert.ok(EXAM_CATALOG.length >= 3);
  for (const exam of EXAM_CATALOG) {
    const result = getFullExamQuestions(exam.id);
    assert.equal(result.exam?.id, exam.id);
    assert.ok(result.sections.length > 0, `${exam.id} must have sections`);
    const delivered = result.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
    assert.equal(delivered, exam.totalQuestions, `${exam.id} must deliver all questions`);
  }

  // Legacy aliases map to valid TCS & Infosys exams
  assert.equal(resolveExamId('tcs-nqt'), 'tcs-nqt-foundation');
  assert.equal(resolveExamId('infosys'), 'infosys-sp');
  assert.equal(getExamById('tcs-nqt')?.id, 'tcs-nqt-foundation');
  assert.equal(getExamById('infosys')?.id, 'infosys-sp');
  assert.ok(getFullExamQuestions('tcs-nqt').sections.length > 0);
  assert.ok(getFullExamQuestions('infosys').sections.length > 0);

  // Unknown / missing exam IDs return empty sections without throwing
  for (const invalidId of [undefined, null, '', 'missing-exam-xyz']) {
    const res = getFullExamQuestions(invalidId);
    assert.equal(res.exam ?? null, null);
    assert.deepEqual(res.sections, []);
    assert.deepEqual(res.questions, []);
  }

  // ExamHubScreen uses EXAM_CATALOG directly instead of stale hardcoded IDs
  const hubSrc = readMobile('screens/exam/ExamHubScreen.js');
  assert.match(hubSrc, /from "\.\.\/\.\.\/data\/examData"/);
  assert.match(hubSrc, /EXAM_CATALOG\.map/);
  assert.doesNotMatch(hubSrc, /id:\s*["']tcs-nqt["']/);
  assert.doesNotMatch(hubSrc, /id:\s*["']infosys["']/);

  // ExamPracticeScreen renders graceful error UI with Go Back instead of hanging on Preparing Exam Environment
  const practiceSrc = readMobile('screens/exam/ExamPracticeScreen.js');
  assert.match(practiceSrc, /const \[loadError, setLoadError\] = useState\(""\)/);
  assert.match(practiceSrc, /if \(loading\)/);
  assert.match(practiceSrc, /if \(loadError \|\| !examData \|\| !examData\.questions\?\.length\)/);
  assert.match(practiceSrc, /Unable to Start Exam/);
  assert.match(practiceSrc, /navigation\.goBack\(\)/);
  assert.match(practiceSrc, /if \(loading \|\| !examData \|\| !examData\.questions\?\.length\) return undefined;/);
});

test('Bug #7: Wipro NLTH and all EXAM_CATALOG metadata match section totals and ExamHubScreen derives cards from catalog', async () => {
  const { EXAM_CATALOG, getFullExamQuestions } = await import(
    pathToFileURL(path.resolve(__dirname, '../../data/examData.js')).href
  );

  const wipro = EXAM_CATALOG.find((e) => e.id === 'wipro-nlth');
  assert.ok(wipro, 'wipro-nlth must exist in EXAM_CATALOG');
  assert.equal(wipro.totalTime, 60);
  assert.equal(wipro.totalQuestions, 60);

  const wiproFull = getFullExamQuestions('wipro-nlth');
  const wiproDelivered = wiproFull.sections.reduce((sum, s) => sum + s.questions.length, 0);
  assert.equal(wiproDelivered, 60);

  for (const exam of EXAM_CATALOG) {
    const sectionQuestions = exam.sections.reduce((sum, s) => sum + s.questionCount, 0);
    const sectionMinutes = exam.sections.reduce((sum, s) => sum + s.timeLimit, 0);
    assert.equal(exam.totalQuestions, sectionQuestions, `${exam.id} totalQuestions must match section sum`);
    assert.equal(exam.totalTime, sectionMinutes, `${exam.id} totalTime must match section sum`);
  }

  const hubSrc = readMobile('screens/exam/ExamHubScreen.js');
  assert.doesNotMatch(hubSrc, /140 mins/);
  assert.doesNotMatch(hubSrc, /questions:\s*100/);
  assert.match(hubSrc, /exam\.totalTime/);
  assert.match(hubSrc, /exam\.totalQuestions/);
  assert.match(hubSrc, /exam\.sections/);
});

test('Bug #8: JobsScreen queries backend with search/type filters and paginates beyond first 50 listings', async () => {
  const { jobsApi } = await import(pathToFileURL(path.resolve(__dirname, '../jobsApi.js')).href);
  const helpers = loadJobsScreenHelpers();

  // Query param construction passes search and normalized type across all listings
  assert.deepEqual(
    { ...helpers.buildJobsQueryParams({ targetPage: 1, searchQuery: '  Wipro  ', selectedType: 'Remote' }) },
    { page: 1, limit: 50, search: 'Wipro', type: 'remote' },
  );
  assert.deepEqual(
    { ...helpers.buildJobsQueryParams({ targetPage: 2, searchQuery: '', selectedType: 'All' }) },
    { page: 2, limit: 50 },
  );

  // Pagination & deduplication across pages beyond 50 items
  const page1 = Array.from({ length: 50 }, (_, i) => ({
    id: `job-${i + 1}`,
    title: `Role ${i + 1}`,
    company: `Company ${i + 1}`,
  }));
  const page2 = [
    { id: 'job-50', title: 'Role 50', company: 'Company 50' }, // overlap should be deduped
    { id: 'job-51', title: 'SDE 1', company: 'Zoho' },
    { id: 'job-52', title: 'Backend Intern', company: 'Razorpay' },
  ];
  const merged = helpers.mergeUniqueJobs(page1, page2);
  assert.equal(merged.length, 52);
  assert.equal(merged[50].company, 'Zoho');
  assert.equal(merged[51].company, 'Razorpay');

  assert.equal(helpers.computeHasMore({ totalPages: 3, total: 120 }, 1, 50, 50), true);
  assert.equal(helpers.computeHasMore({ totalPages: 3, total: 120 }, 3, 120, 20), false);
  assert.equal(helpers.computeHasMore({ total: 80 }, 1, 50, 50), true);
  assert.equal(helpers.computeHasMore({ total: 52 }, 2, 52, 2), false);
  assert.equal(helpers.computeHasMore({ totalPages: 5 }, 2, 50, 0), false);

  // jobsApi forwards search, type, page, limit to /api/jobs so page-2 companies are found
  apiHandler = async (_method, url, config) => {
    assert.equal(url, '/api/jobs');
    const { search, type, page } = config.params;
    if (search === 'Zoho' && type === 'internship') {
      return {
        data: {
          jobs: [{ id: 'job-51', title: 'SDE Intern', company: 'Zoho', type: 'internship' }],
          total: 1,
          page: 1,
          totalPages: 1,
        },
      };
    }
    return { data: { jobs: page === 2 ? page2.slice(1) : page1, total: 52, page, totalPages: 2 } };
  };

  const searchRes = await jobsApi.getJobs(
    helpers.buildJobsQueryParams({ targetPage: 1, searchQuery: 'Zoho', selectedType: 'Internship' }),
  );
  assert.equal(searchRes.jobs.length, 1);
  assert.equal(searchRes.jobs[0].company, 'Zoho');
  assert.deepEqual({ ...apiCalls[0].config.params }, {
    page: 1,
    limit: 50,
    search: 'Zoho',
    type: 'internship',
  });

  // JobsScreen source wires server search/filter, debounce, stale-response guard, and pagination
  const jobsSrc = readMobile('screens/jobs/JobsScreen.js');
  assert.match(jobsSrc, /jobsApi\.getJobs\(params\)/);
  assert.match(jobsSrc, /buildJobsQueryParams/);
  assert.match(jobsSrc, /debouncedSearch/);
  assert.match(jobsSrc, /onEndReached=\{handleLoadMore\}/);
  assert.match(jobsSrc, /requestSeqRef/);
  assert.doesNotMatch(jobsSrc, /if \(loading\) return <LoadingSpinner fullScreen/);
});
