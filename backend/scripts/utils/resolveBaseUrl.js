import process from 'process';

export const DEFAULT_LOCAL_BASE_CANDIDATES = [
  'http://localhost:5006',
  'http://localhost:5005',
  'http://localhost:5004',
  'http://localhost:5003',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5007',
  'http://localhost:5008',
  'http://localhost:5009',
  'http://localhost:5010',
];

export async function isHealthReady(baseUrl, healthPath = '/health') {
  try {
    const response = await fetch(`${baseUrl}${healthPath}`);
    const json = await response.json().catch(() => null);
    return response.status === 200 && json?.status === 'ok';
  } catch {
    return false;
  }
}

export async function resolveLocalBaseUrl({
  envVarName,
  fallback = 'http://localhost:5000',
  candidates = DEFAULT_LOCAL_BASE_CANDIDATES,
  healthPath = '/health',
} = {}) {
  const envValue = envVarName ? process.env[envVarName] : '';
  if (envValue) {
    return envValue;
  }

  const uniqueCandidates = [...new Set([...candidates, fallback])].filter(Boolean);
  for (const candidate of uniqueCandidates) {
    if (await isHealthReady(candidate, healthPath)) {
      return candidate;
    }
  }

  return fallback;
}
