import { buildApiUrl, normalizeRelativePath } from '../utils/safeApiUrl';

function resolveApiBaseUrl() {
	const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
	if (!rawBaseUrl) return 'http://localhost:5000/api';

	// Support both forms: http://host:port and http://host:port/api
	if (rawBaseUrl.endsWith('/api')) return rawBaseUrl;
	if (rawBaseUrl.endsWith('/api/')) return rawBaseUrl.slice(0, -1);
	return `${rawBaseUrl.replace(/\/$/, '')}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

function buildLibraryApiUrl(endpoint) {
	const safeEndpoint = normalizeRelativePath(endpoint);
	return buildApiUrl(`/library${safeEndpoint}`, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' });
}

function resolveToken(explicitToken) {
	if (explicitToken) return explicitToken;
	return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function buildQuery(params = {}) {
	const query = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null || value === '') return;
		query.append(key, value);
	});

	const queryString = query.toString();
	return queryString ? `?${queryString}` : '';
}

async function request(endpoint, { method = 'GET', body, token } = {}) {
	const authToken = resolveToken(token);
	const headers = {
		'Content-Type': 'application/json'
	};

	if (authToken) {
		headers.Authorization = `Bearer ${authToken}`;
	}

	const response = await fetch(buildLibraryApiUrl(endpoint), {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined
	});

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(data.error || `Library API error (${response.status})`);
	}

	return data;
}

export async function getBooks(params = {}) {
	return request(`/books${buildQuery(params)}`);
}

export async function getBookById(bookId) {
	return request(`/books/${bookId}`);
}

export async function addBook(bookData, token) {
	return request('/admin/books', {
		method: 'POST',
		body: bookData,
		token
	});
}

export async function updateBook(bookId, bookData, token) {
	return request(`/admin/books/${bookId}`, {
		method: 'PUT',
		body: bookData,
		token
	});
}

export async function deleteBook(bookId, token) {
	return request(`/admin/books/${bookId}`, {
		method: 'DELETE',
		token
	});
}

export async function addReview(reviewData, token) {
	return request('/reviews', {
		method: 'POST',
		body: reviewData,
		token
	});
}

export async function addToShelf(bookId, shelfData = {}, token) {
	return request('/shelf', {
		method: 'POST',
		body: {
			book_id: bookId,
			...shelfData
		},
		token
	});
}

export async function getShelf(params = {}, token) {
	return request(`/shelf${buildQuery(params)}`, { token });
}

export async function removeFromShelf(bookId, token) {
	return request(`/shelf/${bookId}`, {
		method: 'DELETE',
		token
	});
}
