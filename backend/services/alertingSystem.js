import { createLogger } from '../utils/structuredLogger.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const logger = createLogger('alerting-system');

/**
 * Alerting System for Production Monitoring
 * 
 * Features:
 * - Multi-channel alerts (Slack, Email, Webhook)
 * - Threshold-based monitoring
 * - Alert deduplication
 * - Incident tracking
 * - Auto-recovery detection
 */

class AlertingSystem {
  constructor(config = {}) {
    this.config = {
      slackWebhook: config.slackWebhook || process.env.SLACK_WEBHOOK_URL,
      emailConfig: config.emailConfig || {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      alertEmail: config.alertEmail || process.env.ALERT_EMAIL || 'alerts@preploop.com',
      webhookUrl: config.webhookUrl || process.env.ALERT_WEBHOOK_URL,
      ...config,
    };

    this.alerts = new Map(); // alertId -> alert details
    this.incidents = new Map(); // incidentId -> incident details
    this.alertHistory = [];
    this.deduplicationWindow = 5 * 60 * 1000; // 5 minutes

    // Thresholds
    this.thresholds = {
      errorRate: { warning: 2, critical: 5 }, // percentage
      responseTime: { warning: 1000, critical: 2000 }, // ms
      memoryUsage: { warning: 80, critical: 90 }, // percentage
      cpuUsage: { warning: 70, critical: 85 }, // percentage
      diskUsage: { warning: 80, critical: 90 }, // percentage
      cacheHitRate: { warning: 50, critical: 30 }, // percentage (lower is worse)
      dbConnections: { warning: 80, critical: 95 }, // percentage of max
      queueSize: { warning: 100, critical: 500 }, // items
    };

    this.setupEmailTransporter();
    logger.info('Alerting system initialized');
  }

  setupEmailTransporter() {
    if (this.config.emailConfig.host) {
      this.emailTransporter = nodemailer.createTransport(this.config.emailConfig);
      logger.info('Email transporter configured');
    } else {
      logger.warn('Email configuration missing, email alerts disabled');
    }
  }

  /**
   * Send alert through all configured channels
   */
  async sendAlert(alert) {
    const {
      severity = 'warning',
      title,
      message,
      metric,
      value,
      threshold,
      timestamp = new Date().toISOString(),
      metadata = {},
    } = alert;

    // Check for duplicate alerts
    if (this.isDuplicate(alert)) {
      logger.debug('Duplicate alert suppressed', { title });
      return;
    }

    const alertId = this.generateAlertId();
    const fullAlert = {
      id: alertId,
      severity,
      title,
      message,
      metric,
      value,
      threshold,
      timestamp,
      metadata,
      channels: [],
    };

    // Store alert
    this.alerts.set(alertId, fullAlert);
    this.alertHistory.push(fullAlert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory.shift();
    }

    // Create or update incident
    const incidentId = this.trackIncident(fullAlert);
    fullAlert.incidentId = incidentId;

    // Send through all channels
    const results = await Promise.allSettled([
      this.sendSlackAlert(fullAlert),
      this.sendEmailAlert(fullAlert),
      this.sendWebhookAlert(fullAlert),
    ]);

    results.forEach((result, index) => {
      const channel = ['slack', 'email', 'webhook'][index];
      if (result.status === 'fulfilled') {
        fullAlert.channels.push(channel);
      } else {
        logger.error(`Failed to send ${channel} alert`, { error: result.reason });
      }
    });

    logger.info('Alert sent', {
      alertId,
      severity,
      title,
      channels: fullAlert.channels,
    });

    return fullAlert;
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert) {
    if (!this.config.slackWebhook) {
      return;
    }

    const color = {
      info: '#36a64f',
      warning: '#ff9900',
      critical: '#ff0000',
    }[alert.severity] || '#808080';

    const emoji = {
      info: ':information_source:',
      warning: ':warning:',
      critical: ':rotating_light:',
    }[alert.severity] || ':bell:';

    const payload = {
      username: 'PrepLoop Alerts',
      icon_emoji: emoji,
      attachments: [
        {
          color,
          title: `${emoji} ${alert.title}`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Metric',
              value: alert.metric || 'N/A',
              short: true,
            },
            {
              title: 'Current Value',
              value: alert.value?.toString() || 'N/A',
              short: true,
            },
            {
              title: 'Threshold',
              value: alert.threshold?.toString() || 'N/A',
              short: true,
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString(),
              short: false,
            },
          ],
          footer: 'PrepLoop Monitoring',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
        },
      ],
    };

    const response = await fetch(this.config.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    logger.debug('Slack alert sent', { alertId: alert.id });
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    if (!this.emailTransporter) {
      return;
    }

    const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${this.getSeverityColor(alert.severity)}; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${alert.title}</h2>
          </div>
          <div class="content">
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            
            <div class="metric">
              <p><strong>Metric:</strong> ${alert.metric || 'N/A'}</p>
              <p><strong>Current Value:</strong> ${alert.value || 'N/A'}</p>
              <p><strong>Threshold:</strong> ${alert.threshold || 'N/A'}</p>
            </div>
            
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            
            ${alert.metadata && Object.keys(alert.metadata).length > 0 ? `
              <p><strong>Additional Info:</strong></p>
              <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
            ` : ''}
          </div>
          <div class="footer">
            <p>PrepLoop Monitoring System</p>
            <p>Alert ID: ${alert.id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.emailTransporter.sendMail({
      from: this.config.emailConfig.auth.user,
      to: this.config.alertEmail,
      subject,
      html,
    });

    logger.debug('Email alert sent', { alertId: alert.id });
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    if (!this.config.webhookUrl) {
      return;
    }

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    logger.debug('Webhook alert sent', { alertId: alert.id });
  }

  /**
   * Check if alert is duplicate
   */
  isDuplicate(alert) {
    const now = Date.now();
    const recentAlerts = this.alertHistory.filter(
      a => now - new Date(a.timestamp).getTime() < this.deduplicationWindow
    );

    return recentAlerts.some(
      a => a.title === alert.title && a.metric === alert.metric
    );
  }

  /**
   * Track incident
   */
  trackIncident(alert) {
    // Find existing open incident for this metric
    for (const [incidentId, incident] of this.incidents.entries()) {
      if (incident.metric === alert.metric && incident.status === 'open') {
        incident.alerts.push(alert.id);
        incident.lastUpdate = alert.timestamp;
        incident.count++;
        return incidentId;
      }
    }

    // Create new incident
    const incidentId = this.generateIncidentId();
    this.incidents.set(incidentId, {
      id: incidentId,
      metric: alert.metric,
      severity: alert.severity,
      status: 'open',
      alerts: [alert.id],
      startTime: alert.timestamp,
      lastUpdate: alert.timestamp,
      count: 1,
    });

    return incidentId;
  }

  /**
   * Resolve incident
   */
  resolveIncident(incidentId, resolution = 'auto-resolved') {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    incident.status = 'resolved';
    incident.endTime = new Date().toISOString();
    incident.resolution = resolution;
    incident.duration = new Date(incident.endTime) - new Date(incident.startTime);

    logger.info('Incident resolved', {
      incidentId,
      metric: incident.metric,
      duration: `${Math.round(incident.duration / 1000)}s`,
    });

    // Send recovery notification
    this.sendAlert({
      severity: 'info',
      title: `✅ Incident Resolved: ${incident.metric}`,
      message: `The issue with ${incident.metric} has been resolved.`,
      metric: incident.metric,
      metadata: {
        incidentId,
        duration: `${Math.round(incident.duration / 1000)}s`,
        alertCount: incident.count,
      },
    });

    return true;
  }

  /**
   * Monitor metrics and send alerts
   */
  async monitorMetrics(metrics) {
    const alerts = [];

    // Error rate
    if (metrics.errorRate !== undefined) {
      if (metrics.errorRate >= this.thresholds.errorRate.critical) {
        alerts.push({
          severity: 'critical',
          title: 'Critical Error Rate',
          message: `Error rate is ${metrics.errorRate.toFixed(2)}%, exceeding critical threshold`,
          metric: 'errorRate',
          value: `${metrics.errorRate.toFixed(2)}%`,
          threshold: `${this.thresholds.errorRate.critical}%`,
        });
      } else if (metrics.errorRate >= this.thresholds.errorRate.warning) {
        alerts.push({
          severity: 'warning',
          title: 'High Error Rate',
          message: `Error rate is ${metrics.errorRate.toFixed(2)}%, exceeding warning threshold`,
          metric: 'errorRate',
          value: `${metrics.errorRate.toFixed(2)}%`,
          threshold: `${this.thresholds.errorRate.warning}%`,
        });
      }
    }

    // Response time
    if (metrics.responseTime !== undefined) {
      if (metrics.responseTime >= this.thresholds.responseTime.critical) {
        alerts.push({
          severity: 'critical',
          title: 'Critical Response Time',
          message: `Response time is ${metrics.responseTime}ms, exceeding critical threshold`,
          metric: 'responseTime',
          value: `${metrics.responseTime}ms`,
          threshold: `${this.thresholds.responseTime.critical}ms`,
        });
      } else if (metrics.responseTime >= this.thresholds.responseTime.warning) {
        alerts.push({
          severity: 'warning',
          title: 'Slow Response Time',
          message: `Response time is ${metrics.responseTime}ms, exceeding warning threshold`,
          metric: 'responseTime',
          value: `${metrics.responseTime}ms`,
          threshold: `${this.thresholds.responseTime.warning}ms`,
        });
      }
    }

    // Memory usage
    if (metrics.memoryUsage !== undefined) {
      if (metrics.memoryUsage >= this.thresholds.memoryUsage.critical) {
        alerts.push({
          severity: 'critical',
          title: 'Critical Memory Usage',
          message: `Memory usage is ${metrics.memoryUsage.toFixed(2)}%, exceeding critical threshold`,
          metric: 'memoryUsage',
          value: `${metrics.memoryUsage.toFixed(2)}%`,
          threshold: `${this.thresholds.memoryUsage.critical}%`,
        });
      } else if (metrics.memoryUsage >= this.thresholds.memoryUsage.warning) {
        alerts.push({
          severity: 'warning',
          title: 'High Memory Usage',
          message: `Memory usage is ${metrics.memoryUsage.toFixed(2)}%, exceeding warning threshold`,
          metric: 'memoryUsage',
          value: `${metrics.memoryUsage.toFixed(2)}%`,
          threshold: `${this.thresholds.memoryUsage.warning}%`,
        });
      }
    }

    // Cache hit rate (lower is worse)
    if (metrics.cacheHitRate !== undefined) {
      if (metrics.cacheHitRate <= this.thresholds.cacheHitRate.critical) {
        alerts.push({
          severity: 'critical',
          title: 'Critical Cache Hit Rate',
          message: `Cache hit rate is ${metrics.cacheHitRate.toFixed(2)}%, below critical threshold`,
          metric: 'cacheHitRate',
          value: `${metrics.cacheHitRate.toFixed(2)}%`,
          threshold: `${this.thresholds.cacheHitRate.critical}%`,
        });
      } else if (metrics.cacheHitRate <= this.thresholds.cacheHitRate.warning) {
        alerts.push({
          severity: 'warning',
          title: 'Low Cache Hit Rate',
          message: `Cache hit rate is ${metrics.cacheHitRate.toFixed(2)}%, below warning threshold`,
          metric: 'cacheHitRate',
          value: `${metrics.cacheHitRate.toFixed(2)}%`,
          threshold: `${this.thresholds.cacheHitRate.warning}%`,
        });
      }
    }

    // Send all alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * Get alert statistics
   */
  getStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentAlerts = this.alertHistory.filter(
      a => new Date(a.timestamp).getTime() > last24h
    );

    return {
      totalAlerts: this.alertHistory.length,
      last24h: recentAlerts.length,
      bySeverity: {
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        warning: recentAlerts.filter(a => a.severity === 'warning').length,
        info: recentAlerts.filter(a => a.severity === 'info').length,
      },
      openIncidents: Array.from(this.incidents.values()).filter(i => i.status === 'open').length,
      resolvedIncidents: Array.from(this.incidents.values()).filter(i => i.status === 'resolved').length,
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 50) {
    return this.alertHistory.slice(-limit).reverse();
  }

  /**
   * Get open incidents
   */
  getOpenIncidents() {
    return Array.from(this.incidents.values())
      .filter(i => i.status === 'open')
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }

  // Helper methods
  generateAlertId() {
    return `alert_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  generateIncidentId() {
    return `incident_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  getSeverityColor(severity) {
    return {
      info: '#36a64f',
      warning: '#ff9900',
      critical: '#ff0000',
    }[severity] || '#808080';
  }
}

// Singleton instance
let alertingSystem = null;

export function initializeAlertingSystem(config) {
  if (alertingSystem) {
    logger.warn('Alerting system already initialized');
    return alertingSystem;
  }

  alertingSystem = new AlertingSystem(config);
  return alertingSystem;
}

export function getAlertingSystem() {
  if (!alertingSystem) {
    throw new Error('Alerting system not initialized');
  }
  return alertingSystem;
}

export default {
  initializeAlertingSystem,
  getAlertingSystem,
  AlertingSystem,
};
