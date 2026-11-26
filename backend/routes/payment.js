import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import '../config/env.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.ts';
import { createLogger } from '../utils/structuredLogger.js';
import cacheManager from '../utils/cacheManager.js';
import { invalidateCache } from '../middleware/apiCache.js';
import { DEFAULT_FEATURE_GATES, getUserTier } from '../services/featureGateService.ts';

const router = express.Router();
const logger = createLogger('payment');

const isDev = process.env.NODE_ENV !== 'production';

// ═══════════════════════════════════════════════
//  SECURITY: Stricter rate limiter for payment routes
//  Max 10 payment attempts per 15 minutes per IP
// ═══════════════════════════════════════════════
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many payment attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Applied selectively to sensitive payment initiation/verification routes rather than router-level
// to avoid blocking Razorpay webhooks and operational health check monitors.

function isValidEnvValue(value) {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    const invalidMarkers = ['YOUR_KEY_ID', 'YOUR_KEY_SECRET', 'PLACEHOLDER', 'CHANGEME'];
    return !invalidMarkers.some((marker) => trimmed.toUpperCase().includes(marker));
}

function isHexString(value) {
    if (typeof value !== 'string' || value.length === 0) return false;
    for (const ch of value) {
        const code = ch.charCodeAt(0);
        const isDigit = code >= 48 && code <= 57;
        const isLowerHex = code >= 97 && code <= 102;
        const isUpperHex = code >= 65 && code <= 70;
        if (!isDigit && !isLowerHex && !isUpperHex) return false;
    }
    return true;
}

let cachedEnvFileValues = null;

function readBackendEnvFileValues() {
    if (cachedEnvFileValues) return cachedEnvFileValues;

    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const envPath = path.resolve(__dirname, '..', '.env');
        const raw = fs.readFileSync(envPath, 'utf8');
        cachedEnvFileValues = dotenv.parse(raw);
        return cachedEnvFileValues;
    } catch {
        cachedEnvFileValues = {};
        return cachedEnvFileValues;
    }
}

function getRazorpayConfig() {
    const envFileValues = readBackendEnvFileValues();

    const keyId = process.env.RAZORPAY_KEY_ID || envFileValues.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || envFileValues.RAZORPAY_KEY_SECRET;
    const configured = isValidEnvValue(keyId) && isValidEnvValue(keySecret);

    return {
        keyId,
        keySecret,
        configured,
    };
}

function createRazorpayClient(config) {
    return new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
    });
}

function mapCreateOrderError(err) {
    const providerStatus = Number(err?.statusCode || err?.status || 0);

    if (providerStatus === 400) {
        return {
            status: 400,
            error: 'Payment provider rejected the order request. Please retry.',
            errorCode: 'PAYMENT_PROVIDER_BAD_REQUEST',
        };
    }

    if (providerStatus === 401 || providerStatus === 403) {
        return {
            status: 502,
            error: 'Payment provider authentication failed. Please contact support.',
            errorCode: 'PAYMENT_PROVIDER_AUTH_FAILED',
        };
    }

    if (providerStatus === 429) {
        return {
            status: 503,
            error: 'Payment provider is temporarily rate-limited. Please try again shortly.',
            errorCode: 'PAYMENT_PROVIDER_RATE_LIMITED',
        };
    }

    return {
        status: 500,
        error: 'Failed to create order',
        errorCode: 'PAYMENT_CREATE_ORDER_FAILED',
    };
}

// Plan configuration (server-side only — price can never be tampered by client)
const PLANS = {
    pro: { name: 'Pro', amount: 9900, currency: 'INR' },       // ₹99
    elite: { name: 'Elite', amount: 29900, currency: 'INR' },   // ₹299
};

export function getPaymentAmount(plan, billingCycle) {
    const monthly = PLANS[plan]?.amount;
    if (!monthly) return null;
    if (billingCycle === 'monthly') return monthly;
    if (billingCycle === 'annual') return Math.round(monthly * 12 * 0.8);
    return null;
}

async function activateCapturedPayment(payment, signature = null) {
    const createdAtSeconds = Number(payment.created_at);
    const capturedAt = Number.isFinite(createdAtSeconds)
        ? new Date(createdAtSeconds * 1000).toISOString()
        : new Date().toISOString();

    const { data, error } = await supabaseAdmin.rpc('activate_captured_payment', {
        captured_order: payment.order_id,
        captured_payment: payment.id,
        captured_amount: payment.amount,
        captured_currency: payment.currency,
        captured_at: capturedAt,
        checkout_signature: signature,
    });
    if (error) throw error;
    if (data) {
        await cacheManager.delete(`profile:${data.userId}`).catch(() => {});
        invalidateCache('/api/user');
        invalidateCache('/api/payment');
    }
    return data;
}

// ═══════════════════════════════════════════════
//  SECURITY: Input sanitization helper
// ═══════════════════════════════════════════════
function sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength);
}

// ─────────────────────────────────────────────
// GET /api/payment/health
// Lightweight readiness check for payment flow
// ─────────────────────────────────────────────
router.get('/health', authenticateToken, async (req, res) => {
    const razorpayConfig = getRazorpayConfig();
    const response = {
        ready: false,
        checks: {
            providerConfigured: razorpayConfig.configured,
            databaseReachable: false,
        },
    };

    if (!razorpayConfig.configured) {
        return res.status(503).json({
            ...response,
            error: 'Payment service is not configured. Please contact support.',
            errorCode: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        });
    }

    try {
        const { error } = await supabaseAdmin
            .from('payments')
            .select('id, billing_cycle, activated_at')
            .limit(1);

        if (error) {
            logger.error('Payment health DB error', {
                code: error.code,
                message: error.message,
            });
            return res.status(503).json({
                ...response,
                checks: {
                    ...response.checks,
                    databaseReachable: false,
                },
                error: 'Payment database is temporarily unavailable. Please retry shortly.',
                errorCode: 'PAYMENT_DB_UNAVAILABLE',
            });
        }

        return res.json({
            ready: true,
            checks: {
                providerConfigured: true,
                databaseReachable: true,
            },
        });
    } catch (err) {
        logger.error('Payment health check failed', {
            message: err?.message,
            stack: isDev ? err?.stack : undefined,
        });
        return res.status(503).json({
            ...response,
            error: 'Payment health check failed. Please retry.',
            errorCode: 'PAYMENT_HEALTH_CHECK_FAILED',
        });
    }
});

// ─────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order for the given plan
// ─────────────────────────────────────────────
router.post('/create-order', paymentLimiter, authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const razorpayConfig = getRazorpayConfig();

        if (!razorpayConfig.configured) {
            logger.error('Razorpay keys are missing or invalid. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
            return res.status(503).json({
                error: 'Payment service is not configured. Please contact support.',
                errorCode: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
            });
        }

        if (!user?.id) {
            return res.status(401).json({
                error: 'Authentication required',
                errorCode: 'AUTH_REQUIRED',
            });
        }

        const { plan, billingCycle } = req.body || {};
        const sanitizedPlan = sanitizeString(plan, 20).toLowerCase();
        const sanitizedBillingCycle = billingCycle === undefined
            ? 'monthly'
            : sanitizeString(billingCycle, 20).toLowerCase();

        if (!Object.hasOwn(PLANS, sanitizedPlan)) {
            return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "elite".' });
        }

        const amount = getPaymentAmount(sanitizedPlan, sanitizedBillingCycle);
        if (amount === null) {
            return res.status(400).json({ error: 'Invalid billing cycle. Choose monthly or annual.' });
        }

        // SECURITY: Prevent duplicate pending orders (anti-abuse)
        const { data: existingOrders, error: existingOrdersError } = await supabaseAdmin
            .from('payments')
            .select('id, billing_cycle, activated_at')
            .eq('user_id', user.id)
            .eq('status', 'created')
            .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 min

        if (existingOrdersError) {
            logger.error('Payment create order DB lookup error', {
                userId: user.id,
                code: existingOrdersError.code,
                message: existingOrdersError.message,
            });
            return res.status(500).json({
                error: 'Failed to validate pending payments',
                errorCode: 'PAYMENT_PENDING_LOOKUP_FAILED',
            });
        }

        if (existingOrders && existingOrders.length >= 5) {
            return res.status(429).json({ error: 'Too many pending orders. Please complete or wait before creating new ones.' });
        }

        const planConfig = PLANS[sanitizedPlan];
        const razorpay = createRazorpayClient(razorpayConfig);

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount,
            currency: planConfig.currency,
            receipt: `rcpt_${user.id.substring(0, 8)}_${Date.now()}`,
            notes: {
                user_id: user.id,
                plan: sanitizedPlan,
                billing_cycle: sanitizedBillingCycle,
            },
        });

        // Save order to database
        const { error: dbError } = await supabaseAdmin.from('payments').insert({
            user_id: user.id,
            razorpay_order_id: order.id,
            plan: sanitizedPlan,
            billing_cycle: sanitizedBillingCycle,
            amount,
            currency: planConfig.currency,
            status: 'created',
        });

        if (dbError) {
            logger.error('Payment create order DB insert error', {
                userId: user.id,
                orderId: order.id,
                code: dbError.code,
                message: dbError.message,
                details: dbError.details,
            });
            return res.status(500).json({
                error: 'Failed to save order',
                errorCode: 'PAYMENT_ORDER_SAVE_FAILED',
            });
        }

        res.json({
            orderId: order.id,
            amount,
            currency: planConfig.currency,
            keyId: razorpayConfig.keyId,
            planName: planConfig.name,
        });
    } catch (err) {
        const mapped = mapCreateOrderError(err);
        logger.error('Payment create order error', {
            statusCode: err?.statusCode,
            code: err?.error?.code || err?.code,
            message: err?.error?.description || err?.message,
            stack: isDev ? err?.stack : undefined,
        });

        return res.status(mapped.status).json({
            error: mapped.error,
            errorCode: mapped.errorCode,
            ...(isDev && err?.message ? { debugMessage: err.message } : {}),
        });
    }
});

// ─────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay payment signature and upgrades user
// ─────────────────────────────────────────────
router.post('/verify', paymentLimiter, authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        const razorpay_order_id = sanitizeString(req.body.razorpay_order_id);
        const razorpay_payment_id = sanitizeString(req.body.razorpay_payment_id);
        const razorpay_signature = sanitizeString(req.body.razorpay_signature, 512);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification fields' });
        }

        // SECURITY: Verify the order belongs to this user
        const { data: paymentRecord, error: fetchError } = await supabaseAdmin
            .from('payments')
            .select('user_id')
            .eq('razorpay_order_id', razorpay_order_id)
            .single();

        if (fetchError || !paymentRecord) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        // SECURITY: Ensure the order belongs to the authenticated user
        if (paymentRecord.user_id !== user.id) {
            logger.error('SECURITY: User tried to verify order belonging to another user', { userId: user.id, ownerUserId: paymentRecord.user_id });
            return res.status(403).json({ error: 'Forbidden' });
        }

        // SECURITY: HMAC SHA256 signature verification
        const config = getRazorpayConfig();
        const { keySecret, configured } = config;
        if (!configured || !keySecret) {
            return res.status(503).json({ error: 'Payment gateway not configured' });
        }
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // Fix #5: safe hex decode — non-hex input produces wrong-length buffer and crashes timingSafeEqual
        // Compare as utf8 strings of equal known length to avoid RangeError
        const sigBuffer = Buffer.from(expectedSignature, 'utf8');
        const receivedSigBuffer = Buffer.from(
            isHexString(razorpay_signature) ? razorpay_signature : ' '.repeat(expectedSignature.length),
            'utf8'
        );
        const signaturesEqual = sigBuffer.length === receivedSigBuffer.length &&
            crypto.timingSafeEqual(sigBuffer, receivedSigBuffer);

        if (!signaturesEqual) {
            logger.error('SECURITY: Signature mismatch for order', { orderId: razorpay_order_id });
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        const payment = await createRazorpayClient(config).payments.fetch(razorpay_payment_id);
        if (payment?.order_id !== razorpay_order_id) {
            return res.status(400).json({ error: 'Payment does not match the order' });
        }
        if (payment.status === 'failed') {
            return res.status(422).json({ paymentFailed: true, error: 'The provider declined this payment.' });
        }
        if (payment.status !== 'captured') {
            return res.status(202).json({ pending: true, message: 'Waiting for the payment provider to confirm capture.' });
        }

        const activated = await activateCapturedPayment(payment, razorpay_signature);
        if (!activated) return res.status(404).json({ error: 'Payment record not found' });
        return res.json({ success: true, plan: activated.plan, paymentId: activated.paymentId });
    } catch (err) {
        logger.error('Verify payment error', { error: err.message });
        if (err?.code === '22023') {
            return res.status(400).json({ error: 'Captured payment does not match the saved order' });
        }
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// ─────────────────────────────────────────────
// POST /api/payment/webhook
// SECURITY: Server-to-server webhook from Razorpay
// This ensures payments are recorded even if the
// user closes the browser mid-payment
// ─────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // If no webhook secret configured, skip webhook processing
        if (!webhookSecret) {
            logger.warn('RAZORPAY_WEBHOOK_SECRET not configured. Webhook processing skipped.');
            return res.status(200).json({ status: 'ok' });
        }

        // SECURITY: Verify webhook signature
        const receivedSignature = req.headers['x-razorpay-signature'];
        if (!receivedSignature) {
            return res.status(400).json({ error: 'Missing webhook signature' });
        }

        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : 
                        typeof req.body === 'string' ? req.body : 
                        JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        // Fix #6: use timing-safe comparison to prevent timing attacks
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(receivedSignature, 'utf8');
        const signaturesMatch = expectedBuf.length === receivedBuf.length &&
            crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!signaturesMatch) {
            logger.error('SECURITY: Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) :
                      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const eventType = event.event;

        if (eventType === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;

            if (orderId) await activateCapturedPayment(payment);
        } else if (eventType === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;

            const { error } = await supabaseAdmin
                .from('payments')
                .update({ status: 'failed' })
                .eq('razorpay_order_id', orderId)
                .neq('status', 'paid');
            if (error) throw error;

            logger.info('Webhook: Payment failed for order', { orderId });
        }

        // Always respond 200 to Razorpay to acknowledge receipt
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        logger.error('Webhook error', { error: err.message });
        if (err?.code === '22023') {
            return res.status(400).json({ error: 'Captured payment does not match the saved order' });
        }
        res.status(503).json({ error: 'Payment event could not be processed' });
    }
});

// ─────────────────────────────────────────────
// GET /api/payment/history
// Returns payment history for the logged-in user
// ─────────────────────────────────────────────
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        const { data, error } = await supabaseAdmin
            .from('payments')
            .select('id, plan, amount, currency, status, created_at, paid_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch payment history' });
        }

        // SECURITY: Never return razorpay_signature or internal IDs to frontend
        res.json({ payments: data });
    } catch (err) {
        logger.error('Payment history error', { error: err.message });
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// G3-1: Freemium Feature Gates matrix + current user tier
router.get('/feature-gates', authenticateToken, async (req, res) => {
    try {
        const tier = await getUserTier(req.user.id);
        const gates = Object.fromEntries(
            Object.entries(DEFAULT_FEATURE_GATES).map(([key, tiers]) => [
                key,
                { current: tiers[tier], allTiers: tiers },
            ])
        );
        return res.json({ tier, gates });
    } catch (err) {
        logger.error('Feature gates error', { error: err.message });
        return res.status(500).json({ error: 'Failed to load feature gates' });
    }
});

export default router;
