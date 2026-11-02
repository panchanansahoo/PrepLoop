const test = require('node:test');
const assert = require('node:assert/strict');

// Normalizers extracted for unit verification
const TYPE_MAP = {
  technical: 'technical',
  hr: 'behavioral',
  system_design: 'system-design',
  dsa: 'dsa',
  behavioral: 'behavioral',
  mixed: 'mixed',
  coding: 'coding',
};

function normalizeInterviewType(type) {
  return TYPE_MAP[type] || type || 'dsa';
}

function normalizeCoinBalanceResponse(data) {
  return {
    balance: data?.coins ?? data?.balance ?? 0,
    totalEarned: data?.totalEarned ?? null,
    totalSpent: data?.totalSpent ?? null,
  };
}

function normalizeCoinTransactionsResponse(data) {
  if (Array.isArray(data)) return data;
  return data?.items || data?.transactions || data?.data || [];
}

test('normalizeInterviewType maps mobile track names to backend enum contracts', () => {
  assert.equal(normalizeInterviewType('hr'), 'behavioral');
  assert.equal(normalizeInterviewType('system_design'), 'system-design');
  assert.equal(normalizeInterviewType('technical'), 'technical');
  assert.equal(normalizeInterviewType('dsa'), 'dsa');
  assert.equal(normalizeInterviewType('custom_track'), 'custom_track');
  assert.equal(normalizeInterviewType(null), 'dsa');
});

test('normalizeCoinBalanceResponse safely handles backend coins and fallback formats', () => {
  const backendStandard = normalizeCoinBalanceResponse({ coins: 75 });
  assert.deepEqual(backendStandard, { balance: 75, totalEarned: null, totalSpent: null });

  const directBalance = normalizeCoinBalanceResponse({ balance: 120, totalEarned: 200, totalSpent: 80 });
  assert.deepEqual(directBalance, { balance: 120, totalEarned: 200, totalSpent: 80 });

  const emptyResponse = normalizeCoinBalanceResponse(null);
  assert.deepEqual(emptyResponse, { balance: 0, totalEarned: null, totalSpent: null });
});

test('normalizeCoinTransactionsResponse unpacks both raw arrays and nested envelopes', () => {
  const rawList = [{ id: '1', amount: 10 }];
  assert.deepEqual(normalizeCoinTransactionsResponse(rawList), rawList);

  const envelopeList = { items: [{ id: '2', amount: 20 }] };
  assert.deepEqual(normalizeCoinTransactionsResponse(envelopeList), [{ id: '2', amount: 20 }]);

  assert.deepEqual(normalizeCoinTransactionsResponse(null), []);
});

