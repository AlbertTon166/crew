/**
 * Webhook Trigger Utility
 * Handles webhook delivery with retry logic
 */

import crypto from 'crypto';
import { query } from '../config/db.js';
import { logger } from '../config/logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 30000]; // ms

/**
 * Generate HMAC signature for webhook payload
 * @param {string} payload - JSON string payload
 * @param {string} secret - Webhook secret
 * @returns {string} HMAC-SHA256 signature
 */
export function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Trigger a webhook for a specific event
 * @param {Object} webhook - Webhook record from DB
 * @param {string} event - Event name
 * @param {Object} data - Event payload data
 */
export async function triggerWebhook(webhook, event, data) {
  // Check if webhook is active
  if (!webhook.active) {
    logger.debug('Webhook skipped - not active', { webhookId: webhook.id });
    return;
  }

  // Check if webhook subscribes to this event
  const events = Array.isArray(webhook.events) ? webhook.events : [];
  if (!events.includes(event) && event !== 'test') {
    logger.debug('Webhook skipped - not subscribed to event', { webhookId: webhook.id, event });
    return;
  }

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadStr = JSON.stringify(payload);
  const signature = signPayload(payloadStr, webhook.secret);

  // Store delivery record
  const delivery = await query(
    `INSERT INTO webhook_deliveries (webhook_id, event, payload, success, attempts, delivered_at)
     VALUES ($1, $2, $3, false, 1, NOW())
     RETURNING id`,
    [webhook.id, event, payloadStr]
  );

  const deliveryId = delivery.rows[0].id;

  // Attempt delivery
  let lastError = null;
  let lastStatusCode = null;
  let responseBody = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event,
          'X-Webhook-Delivery': deliveryId,
          'User-Agent': 'Crew-Webhook/1.0',
        },
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      lastStatusCode = response.status;
      responseBody = await response.text().catch(() => null);

      if (response.ok) {
        // Success
        await query(
          `UPDATE webhook_deliveries SET status_code = $1, response = $2, success = true WHERE id = $3`,
          [lastStatusCode, JSON.stringify({ body: responseBody }), deliveryId]
        );
        logger.info('Webhook delivered successfully', { webhookId: webhook.id, event, deliveryId });
        return;
      }

      lastError = `HTTP ${response.status}: ${responseBody}`;
      logger.warn('Webhook delivery failed', { webhookId: webhook.id, event, attempt, status: response.status });
    } catch (error) {
      lastError = error.message;
      logger.warn('Webhook delivery error', { webhookId: webhook.id, event, attempt, error: error.message });
    }

    // Retry with delay if not last attempt
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAYS[attempt - 1] || 5000);
    }
  }

  // All retries exhausted
  await query(
    `UPDATE webhook_deliveries SET status_code = $1, response = $2, error = $3, success = false WHERE id = $4`,
    [lastStatusCode, JSON.stringify({ body: responseBody }), lastError, deliveryId]
  );

  logger.error('Webhook delivery failed after all retries', { webhookId: webhook.id, event, deliveryId, lastError });
}

/**
 * Trigger webhooks for multiple webhooks
 * @param {string[]} webhookIds - Array of webhook IDs
 * @param {string} event - Event name
 * @param {Object} data - Event payload data
 */
export async function triggerWebhooks(webhookIds, event, data) {
  if (!webhookIds || webhookIds.length === 0) return;

  const result = await query(
    `SELECT * FROM webhooks WHERE id = ANY($1) AND active = true`,
    [webhookIds]
  );

  const webhooks = result.rows;

  // Fire all webhooks concurrently (don't await)
  webhooks.forEach(webhook => {
    triggerWebhook(webhook, event, data).catch(err => {
      logger.error('Webhook trigger error', { webhookId: webhook.id, error: err.message });
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default { triggerWebhook, triggerWebhooks, signPayload };
