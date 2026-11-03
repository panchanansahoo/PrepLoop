import crypto from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';
import { isSafeOutboundUrl } from '../utils/ssrfGuard.js';

const logger = createLogger('webhook-dispatcher');

export class WebhookDispatcher {
  /**
   * Dispatches an event payload to all matching active webhook subscriptions
   */
  static async dispatchEvent(eventType, payload, targetUserId = null) {
    try {
      let query = supabaseAdmin
        .from('webhook_subscriptions')
        .select('*')
        .eq('is_active', true)
        .contains('events', [eventType]);

      if (targetUserId) {
        query = query.eq('user_id', targetUserId);
      }

      const { data: subscriptions, error } = await query;
      if (error || !subscriptions || subscriptions.length === 0) {
        logger.debug('No active webhook subscriptions found for event', { eventType, targetUserId });
        return [];
      }

      const deliveryPromises = subscriptions.map((sub) => this.deliverToSubscription(sub, eventType, payload));
      return await Promise.allSettled(deliveryPromises);
    } catch (err) {
      logger.error('Failed to dispatch webhook event', { eventType, error: err.message });
      return [];
    }
  }

  /**
   * Delivers payload to an individual webhook endpoint with HMAC signature
   */
  static async deliverToSubscription(sub, eventType, payload) {
    if (!isSafeOutboundUrl(sub.url)) {
      logger.warn('SSRF defense blocked dispatch to unsafe webhook URL', { subId: sub.id, url: sub.url });
      return { success: false, error: 'Target webhook URL blocked by SSRF defense policy' };
    }

    const rawBody = JSON.stringify({
      id: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      event: eventType,
      createdAt: new Date().toISOString(),
      data: payload,
    });

    const signature = crypto
      .createHmac('sha256', sub.secret)
      .update(rawBody)
      .digest('hex');

    try {
      const response = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PrepLoop-Event': eventType,
          'X-PrepLoop-Signature': `sha256=${signature}`,
          'User-Agent': 'PrepLoop-Webhook/1.0',
        },
        body: rawBody,
        signal: AbortSignal.timeout(5000),
      });

      const responseStatus = response.status;
      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: sub.id,
        event_type: eventType,
        payload,
        response_status: responseStatus,
      });

      logger.info('Webhook successfully delivered', { subId: sub.id, eventType, responseStatus });
      return { success: true, status: responseStatus };
    } catch (err) {
      logger.warn('Webhook delivery failed', { subId: sub.id, eventType, error: err.message });

      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: sub.id,
        event_type: eventType,
        payload,
        response_status: 0,
        error: err.message,
      });

      return { success: false, error: err.message };
    }
  }
}

