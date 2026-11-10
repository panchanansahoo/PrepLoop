#!/usr/bin/env node
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('health-monitor');

export const HEALTH_ENDPOINTS = [
  { name: 'Health', url: '/health' },
  { name: 'Readiness', url: '/health/ready' },
  { name: 'Liveness', url: '/health/live' },
];

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL;
const CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10);

export async function checkEndpoint(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint.url}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { success: false, status: response.status, endpoint: endpoint.name };
    }

    return { success: true, endpoint: endpoint.name };
  } catch (error) {
    return { success: false, error: error.message, endpoint: endpoint.name };
  }
}

export async function sendAlert(failures) {
  if (!ALERT_WEBHOOK) {
    logger.error('Health check failures detected but no webhook configured', { failures });
    return;
  }

  try {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Health Check Failures: ${failures.map(f => f.endpoint).join(', ')}`,
        failures,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    logger.error('Failed to send alert', { error: error.message });
  }
}

export async function runHealthChecks() {
  const results = await Promise.all(
    HEALTH_ENDPOINTS.map(endpoint => checkEndpoint(endpoint))
  );

  const failures = results.filter(r => !r.success);

  if (failures.length > 0) {
    logger.error('Health check failures', { failures });
    await sendAlert(failures);
  } else {
    logger.info('All health checks passed');
  }

  return results;
}

// Immediate run
const isContinuous = process.argv.includes('--continuous') || process.argv.includes('--watch');
await runHealthChecks();

if (isContinuous) {
  setInterval(runHealthChecks, CHECK_INTERVAL);
  logger.info('Health monitoring started', { interval: CHECK_INTERVAL });
}
