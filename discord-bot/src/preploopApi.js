async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await parseJsonSafe(response);

  if (!response.ok) {
    const message = body?.error || body?.message || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return body;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const preploopApi = {
  getProblems(baseUrl) {
    return request(baseUrl, '/api/practice/all-problems');
  },

  getStreak(baseUrl, token) {
    return request(baseUrl, '/api/streak/check', {
      headers: authHeaders(token),
    });
  },

  getCoins(baseUrl, token) {
    return request(baseUrl, '/api/coins/balance', {
      headers: authHeaders(token),
    });
  },

  askAi(baseUrl, token, message) {
    return request(baseUrl, '/api/chat/message', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ message }),
    });
  },

  getMockSlots(baseUrl, token, date) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return request(baseUrl, `/api/real-interview/slots${query}`, {
      headers: authHeaders(token),
    });
  },

  bookMockSlot(baseUrl, token, slotId) {
    return request(baseUrl, '/api/real-interview/book', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ slotId }),
    });
  },

  getMyBookings(baseUrl, token) {
    return request(baseUrl, '/api/real-interview/my-bookings', {
      headers: authHeaders(token),
    });
  },
};
