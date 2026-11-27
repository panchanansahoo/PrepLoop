const test = require('node:test');
const assert = require('node:assert/strict');
const { registerHooks } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const asyncStore = new Map();
const apiHistory = [];
let apiResponder = async () => ({ data: {} });

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { shortCircuit: true, url: 'mock://async-storage' };
    }
    if (specifier === './apiClient' || specifier.endsWith('/api/apiClient')) {
      return { shortCircuit: true, url: 'mock://api-client' };
    }
    if (specifier === './notesApi' && context.parentURL?.includes('dsaApi.js')) {
      return {
        shortCircuit: true,
        url: pathToFileURL(path.resolve(__dirname, '../notesApi.js')).href,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock://async-storage') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          const store = globalThis.__mobileCoreAsyncStore;
          export default {
            async getItem(k) { return store.has(k) ? store.get(k) : null; },
            async setItem(k, v) { store.set(k, String(v)); },
            async removeItem(k) { store.delete(k); },
            async getAllKeys() { return Array.from(store.keys()); },
            async multiGet(keys) { return keys.map((k) => [k, store.get(k) ?? null]); },
            async multiRemove(keys) { keys.forEach((k) => store.delete(k)); },
          };
        `,
      };
    }
    if (url === 'mock://api-client') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          export default {
            async get(url, config) { return globalThis.__mobileCoreApi('GET', url, config); },
            async post(url, body, config) { return globalThis.__mobileCoreApi('POST', url, { body, config }); },
            async put(url, body, config) { return globalThis.__mobileCoreApi('PUT', url, { body, config }); },
            async delete(url, config) { return globalThis.__mobileCoreApi('DELETE', url, config); },
          };
        `,
      };
    }
    return nextLoad(url, context);
  },
});

globalThis.__mobileCoreAsyncStore = asyncStore;
globalThis.__mobileCoreApi = (method, url, extra) => {
  apiHistory.push({ method, url, extra });
  return apiResponder(method, url, extra);
};

function importMobile(relPath) {
  return import(pathToFileURL(path.resolve(__dirname, '../../', relPath)).href);
}

function readMobile(relPath) {
  return fs.readFileSync(path.resolve(__dirname, '../../', relPath), 'utf8');
}

test('Bug #3 & #11: cache scopes by userId, clears on clearAccount/clear, and bypasses cache on forceRefresh', async () => {
  const { cache, CACHE_KEYS, accountCacheKey } = await importMobile('utils/cache.js');
  await cache.clear();
  asyncStore.clear();

  const userAKey = accountCacheKey('user-a', CACHE_KEYS.DASHBOARD_STATS);
  const userBKey = accountCacheKey('user-b', CACHE_KEYS.DASHBOARD_STATS);
  assert.notEqual(userAKey, userBKey);
  assert.equal(accountCacheKey(undefined, CACHE_KEYS.COIN_BALANCE), 'account:guest:coin_balance');

  let fetchCount = 0;
  const fetchA = async () => {
    fetchCount += 1;
    return { currentStreak: fetchCount };
  };

  const first = await cache.fetchWithCache(userAKey, fetchA, 300);
  assert.deepEqual(first, { currentStreak: 1 });
  assert.equal(fetchCount, 1);

  // Normal load hits fresh cache
  const cached = await cache.fetchWithCache(userAKey, fetchA, 300);
  assert.deepEqual(cached, { currentStreak: 1 });
  assert.equal(fetchCount, 1);

  // Bug #11: Pull-to-refresh passes forceRefresh: true and fetches fresh data
  const refreshed = await cache.fetchWithCache(userAKey, fetchA, 300, undefined, { forceRefresh: true });
  assert.deepEqual(refreshed, { currentStreak: 2 });
  assert.equal(fetchCount, 2);

  // User B does not see User A's cached data
  await cache.set(userBKey, { currentStreak: 9 }, 300);
  assert.deepEqual(await cache.get(userBKey), { currentStreak: 9 });

  // Clearing account A leaves B intact; full clear wipes everything
  await cache.clearAccount('user-a');
  assert.equal(await cache.get(userAKey), null);
  assert.deepEqual(await cache.get(userBKey), { currentStreak: 9 });

  await cache.clear();
  assert.equal(await cache.get(userBKey), null);

  // Verify AuthContext, CoinContext, and DashboardScreen reset state & clear caches on logout/switch
  const authSrc = readMobile('context/AuthContext.js');
  const coinCtxSrc = readMobile('context/CoinContext.js');
  const dashSrc = readMobile('screens/dashboard/DashboardScreen.js');
  assert.ok(authSrc.includes('cache.clear()'), 'AuthContext must clear cache on logout');
  assert.ok(authSrc.includes('cache.clearAccount('), 'AuthContext must clear previous account cache on account switch');
  assert.ok(coinCtxSrc.includes('key={user?.id || "guest"}'), 'CoinContext must remount per account');
  assert.ok(dashSrc.includes('key={user?.id || "guest"}'), 'DashboardScreen must remount per account');
  assert.ok(dashSrc.includes('loadData(true)'), 'DashboardScreen pull-to-refresh must force network refresh');
});

test('Bug #7: notesApi.getBookmarks paginates beyond 20 items and deduplicates across pages', async () => {
  const { notesApi } = await importMobile('api/notesApi.js');
  apiHistory.length = 0;

  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: `b-${i + 1}`, question_title: `P${i + 1}` }));
  const page2 = Array.from({ length: 25 }, (_, i) => ({ id: `b-${i + 100}`, question_title: `P${i + 100}` })); // overlaps b-100

  apiResponder = async (_method, url, extra) => {
    assert.equal(url, '/api/notes/bookmarks');
    const page = extra?.params?.page;
    if (page === 1) {
      return { data: { bookmarks: page1, pagination: { page: 1, limit: 100, total: 124, hasMore: true } } };
    }
    if (page === 2) {
      return { data: { bookmarks: page2, pagination: { page: 2, limit: 100, total: 124, hasMore: false } } };
    }
    throw new Error(`Unexpected page ${page}`);
  };

  const all = await notesApi.getBookmarks();
  assert.equal(all.length, 124);
  assert.equal(all[0].id, 'b-1');
  assert.equal(all[123].id, 'b-124');
  assert.equal(apiHistory.length, 2);

  // Explicit single page parameter is respected
  apiHistory.length = 0;
  const explicit = await notesApi.getBookmarks({ page: 1, limit: 20 });
  assert.equal(explicit.length, 100);
  assert.equal(apiHistory.length, 1);
  assert.equal(apiHistory[0].extra.params.limit, 20);
});

test('Bug #8: dsaApi.saveNote updates existing bookmark and recovers from Already bookmarked race', async () => {
  const { dsaApi } = await importMobile('api/dsaApi.js');

  // Case 1: Problem already has a bookmark -> calls PUT /api/notes/bookmark/:id/note
  apiHistory.length = 0;
  apiResponder = async (method, url, extra) => {
    if (method === 'GET' && url === '/api/notes/bookmarks') {
      assert.deepEqual(extra.params, { type: 'dsa', questionId: 42, page: 1, limit: 100 });
      return { data: { bookmarks: [{ id: 'bm-42', note: 'first note' }], pagination: { hasMore: false } } };
    }
    if (method === 'PUT' && url === '/api/notes/bookmark/bm-42/note') {
      return { data: { bookmark: { id: 'bm-42', note: extra.body.note } } };
    }
    throw new Error(`Unexpected ${method} ${url}`);
  };

  const updated = await dsaApi.saveNote(42, 'second note', 'Two Sum');
  assert.equal(updated.bookmark.note, 'second note');
  assert.equal(apiHistory.filter((c) => c.method === 'POST').length, 0);
  assert.equal(apiHistory.filter((c) => c.method === 'PUT').length, 1);

  // Case 2: No bookmark on initial check, POST races with "Already bookmarked" -> retries GET + PUT
  apiHistory.length = 0;
  let getCalls = 0;
  apiResponder = async (method, url, extra) => {
    if (method === 'GET' && url === '/api/notes/bookmarks') {
      getCalls += 1;
      if (getCalls === 1) {
        return { data: { bookmarks: [], pagination: { hasMore: false } } };
      }
      return { data: { bookmarks: [{ id: 'bm-99', note: '' }], pagination: { hasMore: false } } };
    }
    if (method === 'POST' && url === '/api/notes/bookmark') {
      const err = new Error('Request failed');
      err.response = { status: 400, data: { error: 'Already bookmarked' } };
      throw err;
    }
    if (method === 'PUT' && url === '/api/notes/bookmark/bm-99/note') {
      return { data: { bookmark: { id: 'bm-99', note: extra.body.note } } };
    }
    throw new Error(`Unexpected ${method} ${url}`);
  };

  const retried = await dsaApi.saveNote(99, 'recovered note', 'Valid Parentheses');
  assert.equal(retried.bookmark.note, 'recovered note');
  assert.equal(apiHistory.some((c) => c.method === 'PUT'), true);

  const detailSrc = readMobile('screens/dsa/DSAProblemDetailScreen.js');
  assert.ok(detailSrc.includes('dsaApi.getNotes(currentProblemId)'), 'DSAProblemDetailScreen must load existing note');
  assert.ok(detailSrc.includes('dsaApi.saveNote(problem.id, note.trim(), problem.title)'), 'DSAProblemDetailScreen must pass problem title to saveNote');
});

test('Bug #12: coinsApi rejects degraded balance / invalid history and CoinWalletScreen surfaces errors + earned/spent totals', async () => {
  const { coinsApi } = await importMobile('api/coinsApi.js');

  apiResponder = async () => ({ data: { coins: 0, degraded: true } });
  await assert.rejects(() => coinsApi.getBalance(), /unavailable/i);

  apiResponder = async () => ({ data: { coins: 75 } });
  const bal = await coinsApi.getBalance();
  assert.equal(bal.balance, 75);

  apiResponder = async () => ({ data: [] });
  await assert.rejects(() => coinsApi.getWalletHistory(), /Invalid wallet history/i);

  apiResponder = async (_method, url, extra) => {
    assert.equal(url, '/api/coins/history');
    assert.equal(extra.params.detailed, 1);
    return {
      data: {
        items: [{ id: 1, amount: 50, type: 'earn', displayType: 'earn' }],
        summary: { totalEarned: 120, totalSpent: 30, totalRedeemed: 15 },
      },
    };
  };
  const history = await coinsApi.getWalletHistory();
  assert.equal(history.summary.totalEarned, 120);
  assert.equal(history.summary.totalSpent, 30);
  assert.equal(history.summary.totalRedeemed, 15);

  const walletSrc = readMobile('screens/wallet/CoinWalletScreen.js');
  assert.ok(walletSrc.includes('coinsApi.getWalletHistory()'), 'CoinWalletScreen must fetch detailed wallet history');
  assert.ok(walletSrc.includes('summary.totalRedeemed'), 'CoinWalletScreen must account for redeemed coins in Spent total');
  assert.ok(walletSrc.includes('<ErrorMessage'), 'CoinWalletScreen must render ErrorMessage banner on failure');
  assert.ok(walletSrc.includes('!error ?'), 'CoinWalletScreen must suppress EmptyState when error is present');
});
