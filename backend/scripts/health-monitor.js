#!/usr/bin/env node
import fetch from 'node-fetch';
import { createLogger } from '../backend/utils/structuredLogger.js';

const logger = createLogger('health-monitor');

const HEALTH_ENDPOINTS = [
  { name: 'Health', url: '/health' },
  { name: 'Readiness', url: '/health/ready' },
  { name: 'Liveness', url: '/health/live' },
];

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL;
const CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10);

async function checkEndpoint(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint.url}`, {
      timeout: 5000,
    });

    if (!response.ok) {
      return { success: false, status: response.status, endpoint: endpoint.name };
    }

    return { success: true, endpoint: endpoint.name };
  } catch (error) {
    return { success: false, error: error.message, endpoint: endpoint.name };
  }
}

async function sendAlert(failures) {
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
    });
  } catch (error) {
    logger.error('Failed to send alert', { error: error.message });
  }
}

async function runHealthChecks() {
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
}

// Run immediately and then on interval
runHealthChecks();
setInterval(runHealthChecks, CHECK_INTERVAL);

logger.info('Health monitoring started', { interval: CHECK_INTERVAL });
