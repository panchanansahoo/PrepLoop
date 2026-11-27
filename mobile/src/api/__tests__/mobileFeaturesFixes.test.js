const test = require('node:test');
const assert = require('node:assert/strict');
const { registerHooks } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const asyncStore = new Map();
const scheduled = [];
const channels = new Map();
const hapticCalls = [];
const apiCalls = [];
const mockState = {
  permission: { granted: true, status: 'granted', canAskAgain: true },
  requestCalls: 0,
  notificationHandler: null,
  apiHandler: async () => ({ data: {} }),
};

globalThis.__mfAsyncStore = asyncStore;
globalThis.__mfScheduled = scheduled;
globalThis.__mfChannels = channels;
globalThis.__mfHaptics = hapticCalls;
globalThis.__mfState = mockState;
globalThis.__mfApi = async (method, url, payload) => {
  apiCalls.push({ method, url, payload });
  return mockState.apiHandler(method, url, payload);
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { shortCircuit: true, url: 'mock://mf-async-storage' };
    }
    if (specifier === 'react-native') {
      return { shortCircuit: true, url: 'mock://mf-react-native' };
    }
    if (specifier === 'expo-notifications') {
      return { shortCircuit: true, url: 'mock://mf-expo-notifications' };
    }
    if (specifier === 'expo-device') {
      return { shortCircuit: true, url: 'mock://mf-expo-device' };
    }
    if (specifier === 'expo-constants') {
      return { shortCircuit: true, url: 'mock://mf-expo-constants' };
    }
    if (specifier === 'expo-haptics') {
      return { shortCircuit: true, url: 'mock://mf-expo-haptics' };
    }
    if (specifier === './apiClient' || specifier.endsWith('/api/apiClient')) {
      return { shortCircuit: true, url: 'mock://mf-api-client' };
    }
    if (specifier === './notifications' && context.parentURL?.includes('preferences.js')) {
      return {
        shortCircuit: true,
        url: pathToFileURL(path.resolve(__dirname, '../../utils/notifications.js')).href,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'mock://mf-async-storage') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          const store = globalThis.__mfAsyncStore;
          export default {
            async getItem(k) { return store.has(k) ? store.get(k) : null; },
            async setItem(k, v) { store.set(k, String(v)); },
            async removeItem(k) { store.delete(k); },
            async getAllKeys() { return Array.from(store.keys()); },
            async multiRemove(keys) { keys.forEach((k) => store.delete(k)); },
          };
        `,
      };
    }
    if (url === 'mock://mf-react-native') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `export const Platform = { OS: 'android' };`,
      };
    }
    if (url === 'mock://mf-expo-device') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `export const isDevice = true;`,
      };
    }
    if (url === 'mock://mf-expo-constants') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `export default { appOwnership: 'standalone', executionEnvironment: 'standalone', expoConfig: {} };`,
      };
    }
    if (url === 'mock://mf-expo-notifications') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          const scheduled = globalThis.__mfScheduled;
          const channels = globalThis.__mfChannels;
          const state = globalThis.__mfState;
          export const AndroidImportance = { DEFAULT: 3, HIGH: 4 };
          export const SchedulableTriggerInputTypes = { DAILY: 'daily' };
          export function setNotificationHandler(handler) {
            state.notificationHandler = handler;
          }
          export async function setNotificationChannelAsync(id, cfg) {
            channels.set(id, cfg);
          }
          export async function getPermissionsAsync() {
            return { ...state.permission };
          }
          export async function requestPermissionsAsync() {
            state.requestCalls += 1;
            return { ...state.permission };
          }
          export async function getAllScheduledNotificationsAsync() {
            return scheduled.map((s) => ({ ...s }));
          }
          export async function cancelScheduledNotificationAsync(identifier) {
            const idx = scheduled.findIndex((s) => s.identifier === identifier);
            if (idx >= 0) scheduled.splice(idx, 1);
          }
          export async function scheduleNotificationAsync(payload) {
            const entry = { identifier: 'notif-' + (scheduled.length + 1), ...payload };
            scheduled.push(entry);
            return entry.identifier;
          }
        `,
      };
    }
    if (url === 'mock://mf-expo-haptics') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          const calls = globalThis.__mfHaptics;
          export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
          export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
          export async function impactAsync(style) {
            calls.push({ kind: 'impact', style });
          }
          export async function notificationAsync(type) {
            calls.push({ kind: 'notification', type });
          }
        `,
      };
    }
    if (url === 'mock://mf-api-client') {
      return {
        shortCircuit: true,
        format: 'module',
        source: `
          export default {
            defaults: { headers: { common: {} } },
            async get(url, config) { return globalThis.__mfApi('GET', url, config); },
            async post(url, body, config) { return globalThis.__mfApi('POST', url, { body, config }); },
            async delete(url, config) { return globalThis.__mfApi('DELETE', url, config); },
          };
        `,
      };
    }
    return nextLoad(url, context);
  },
});

test.beforeEach(() => {
  asyncStore.clear();
  scheduled.length = 0;
  channels.clear();
  hapticCalls.length = 0;
  apiCalls.length = 0;
  mockState.permission = { granted: true, status: 'granted', canAskAgain: true };
  mockState.requestCalls = 0;
  mockState.apiHandler = async () => ({ data: {} });
});

test('Bugs 13-15: communityApi normalizes author/likes/reply counts and fetches single thread by ID', async () => {
  const { communityApi, normalizePost, normalizeReply } = await import(
    pathToFileURL(path.resolve(__dirname, '../communityApi.js')).href
  );

  const legacyNormalized = normalizePost({
    id: 'p1',
    title: 'Old post',
    author: 'Legacy User',
    upvotes: 4,
    comments_count: 2,
  });
  assert.equal(legacyNormalized.author_name, 'Legacy User');
  assert.equal(legacyNormalized.likes, 4);
  assert.equal(legacyNormalized.reply_count, 2);
  assert.equal(normalizeReply({ id: 'r1', profiles: { full_name: 'Alice' }, content: 'Hi' }).author_name, 'Alice');

  mockState.apiHandler = async (method, url) => {
    if (method === 'GET' && url === '/api/community/posts/thread-old-999') {
      return {
        data: {
          post: {
            id: 'thread-old-999',
            title: 'Very Old Thread',
            content: 'Long body beyond 50 recent posts',
            author_name: 'Ada',
            likes: 12,
            reply_count: 1,
          },
        },
      };
    }
    if (method === 'GET' && url === '/api/community/posts/thread-old-999/replies') {
      return {
        data: {
          replies: [{ id: 'r-1', content: 'First!', author_name: 'Bob' }],
        },
      };
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  const discussion = await communityApi.getDiscussion('thread-old-999');
  assert.equal(discussion.title, 'Very Old Thread');
  assert.equal(discussion.content, 'Long body beyond 50 recent posts');
  assert.equal(discussion.author_name, 'Ada');
  assert.equal(discussion.likes, 12);
  assert.equal(discussion.comments.length, 1);
  assert.equal(discussion.comments[0].author_name, 'Bob');
  assert.ok(!apiCalls.some((c) => c.url === '/api/community/posts'), 'must not scan 50-post feed');

  await assert.rejects(() => communityApi.getDiscussion(''), /Discussion ID is required/);
});

test('Bugs 13 & 16: DiscussionForumScreen and ThreadDetailScreen preserve drafts, format fields, and wire + New', () => {
  const forumSrc = fs.readFileSync(path.resolve(__dirname, '../../screens/community/DiscussionForumScreen.js'), 'utf8');
  const detailSrc = fs.readFileSync(path.resolve(__dirname, '../../screens/community/ThreadDetailScreen.js'), 'utf8');

  assert.ok(forumSrc.includes('onPress={openComposer}'), '+ New button must open composer');
  assert.ok(forumSrc.includes('communityApi.createDiscussion'), 'composer must call createDiscussion');
  assert.ok(forumSrc.includes('thread.author_name') && forumSrc.includes('thread.likes') && forumSrc.includes('thread.reply_count'));

  const handleIdx = detailSrc.indexOf('const handlePostComment');
  const tryIdx = detailSrc.indexOf('try {', handleIdx);
  const catchIdx = detailSrc.indexOf('catch', handleIdx);
  const clearIdx = detailSrc.indexOf('setComment("")', handleIdx);
  assert.ok(clearIdx > tryIdx && clearIdx < catchIdx, 'comment draft must only clear after addComment succeeds');
  assert.ok(detailSrc.includes('setPostError('), 'failed reply must surface an error');
});

test('Bug 17: multiRoundProgress starts at Round 1, scopes by account, and advances only on passing score', async () => {
  const { readCurrentRound, recordPassedRound, clearRoundProgress, ROUND_PASS_SCORE } = await import(
    pathToFileURL(path.resolve(__dirname, '../../utils/multiRoundProgress.js')).href
  );

  assert.equal(await readCurrentRound('user-a'), 1);
  assert.equal(await readCurrentRound('user-b'), 1);

  const failed = await recordPassedRound('user-a', 1, { interviewId: 'iv-1', scores: { overall: ROUND_PASS_SCORE - 1 } });
  assert.equal(failed, false);
  assert.equal(await readCurrentRound('user-a'), 1);

  const skipped = await recordPassedRound('user-a', 2, { interviewId: 'iv-2', scores: { overall: 90 } });
  assert.equal(skipped, false);
  assert.equal(await readCurrentRound('user-a'), 1);

  const passed = await recordPassedRound('user-a', 1, { interviewId: 'iv-3', scores: { overall: ROUND_PASS_SCORE } });
  assert.equal(passed, true);
  assert.equal(await readCurrentRound('user-a'), 2);
  assert.equal(await readCurrentRound('user-b'), 1);

  await clearRoundProgress('user-a');
  assert.equal(await readCurrentRound('user-a'), 1);
});

test('Bug 18: preferences & notifications actually schedule daily challenges, interview results, sound, and haptics', async () => {
  const {
    syncAccountReminders,
    changePreference,
    notifyInterviewResult,
    playHapticFeedback,
    playHapticNotification,
    clearPreferences,
  } = await import(
    pathToFileURL(path.resolve(__dirname, '../../utils/preferences.js')).href
  );

  await syncAccountReminders('user-1');
  assert.equal(scheduled.length, 0);

  await changePreference('user-1', 'dailyChallenge', true);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].content.data.type, 'daily_challenge');
  assert.equal(scheduled[0].content.sound, false);
  assert.equal(scheduled[0].trigger.hour, 9);

  const quietDecision = await mockState.notificationHandler.handleNotification({ request: scheduled[0] });
  assert.equal(quietDecision.shouldPlaySound, false);

  await changePreference('user-1', 'notificationSound', true);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].content.sound, 'default');
  assert.equal(scheduled[0].content.data.playSound, true);
  const loudDecision = await mockState.notificationHandler.handleNotification({ request: scheduled[0] });
  assert.equal(loudDecision.shouldPlaySound, true);

  await notifyInterviewResult('user-1', { interviewId: 'iv-10' });
  assert.equal(scheduled.some((s) => s.content.data.type === 'interview_result'), false);
  await changePreference('user-1', 'interviewResults', true);
  await notifyInterviewResult('user-1', { interviewId: 'iv-10' });
  const ivNotif = scheduled.find((s) => s.content.data.type === 'interview_result');
  assert.ok(ivNotif);
  assert.equal(ivNotif.content.sound, 'default');

  await playHapticFeedback('user-1');
  await playHapticNotification('success', 'user-1');
  assert.equal(hapticCalls.length, 2);

  await changePreference('user-1', 'hapticFeedback', false);
  await playHapticFeedback('user-1');
  await playHapticNotification('error', 'user-1');
  assert.equal(hapticCalls.length, 2);

  await syncAccountReminders('user-2');
  assert.equal(scheduled.filter((s) => s.content.data.practiceReminder).length, 0);
  mockState.permission = { granted: false, status: 'denied', canAskAgain: false };
  await assert.rejects(() => changePreference('user-2', 'dailyChallenge', true), /Allow notifications/);

  await clearPreferences('user-1');
});

test('Bug 18 & 19: Haptics/Notifications wired across screens and account deletion clears caches & signs out', async () => {
  const { userApi } = await import(
    pathToFileURL(path.resolve(__dirname, '../userApi.js')).href
  );

  mockState.apiHandler = async () => ({ data: { success: true } });
  await userApi.deleteAccount('DELETE');
  assert.equal(apiCalls[0].method, 'DELETE');
  assert.equal(apiCalls[0].url, '/api/user/account');
  assert.deepEqual(apiCalls[0].payload, { data: { confirmation: 'DELETE' }, skipAuthRefresh: true });

  mockState.apiHandler = async () => ({ data: { success: false } });
  await assert.rejects(() => userApi.deleteAccount('DELETE'), /Could not delete your account/);

  const settingsSrc = fs.readFileSync(path.resolve(__dirname, '../../screens/profile/SettingsScreen.js'), 'utf8');
  const buttonSrc = fs.readFileSync(path.resolve(__dirname, '../../components/Button.js'), 'utf8');
  const quizSrc = fs.readFileSync(path.resolve(__dirname, '../../screens/quiz/QuizArenaScreen.js'), 'utf8');

  assert.ok(!settingsSrc.includes('Not Available'), 'SettingsScreen must not show Not Available stub');
  assert.ok(settingsSrc.includes('userApi.deleteAccount'), 'SettingsScreen must call userApi.deleteAccount');
  assert.ok(settingsSrc.includes('cache.clear()'), 'SettingsScreen must clear cache on account deletion');
  assert.ok(settingsSrc.includes('clearPreferences(') && settingsSrc.includes('clearRoundProgress('));
  assert.ok(settingsSrc.includes('await logout()'), 'SettingsScreen must sign user out on deletion');
  assert.ok(buttonSrc.includes('playHapticFeedback'), 'Button must trigger haptic feedback');
  assert.ok(quizSrc.includes('playHapticNotification'), 'QuizArenaScreen must trigger haptic feedback');
});
