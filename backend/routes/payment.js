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
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const isProfilesAccessBlocked = (error) => {
    const code = String(error?.code || '').toUpperCase();
    const message = String(error?.message || '').toLowerCase();
    return code === '42P17' || message.includes('infinite recursion detected in policy');
};
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
router.use(paymentLimiter);

function isValidEnvValue(value) {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    const invalidMarkers = ['YOUR_KEY_ID', 'YOUR_KEY_SECRET', 'PLACEHOLDER', 'CHANGEME'];
    return !invalidMarkers.some((marker) => trimmed.toUpperCase().includes(marker));
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
            .select('id')
            .limit(1);

        if (error) {
            console.error('[PAYMENT_HEALTH_DB_ERROR]', {
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
        console.error('[PAYMENT_HEALTH_ERROR]', {
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
router.post('/create-order', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const razorpayConfig = getRazorpayConfig();

        if (!razorpayConfig.configured) {
            console.error('[PAYMENT_CONFIG_ERROR] Razorpay keys are missing or invalid. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
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

        const { plan } = req.body;
        const sanitizedPlan = sanitizeString(plan, 20).toLowerCase();

        if (!sanitizedPlan || !PLANS[sanitizedPlan]) {
            return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "elite".' });
        }

        // SECURITY: Prevent duplicate pending orders (anti-abuse)
        const { data: existingOrders, error: existingOrdersError } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'created')
            .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 min

        if (existingOrdersError) {
            console.error('[PAYMENT_CREATE_ORDER_DB_LOOKUP_ERROR]', {
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
            amount: planConfig.amount,
            currency: planConfig.currency,
            receipt: `rcpt_${user.id.substring(0, 8)}_${Date.now()}`,
            notes: {
                user_id: user.id,
                plan: sanitizedPlan,
            },
        });

        // Save order to database
        const { error: dbError } = await supabaseAdmin.from('payments').insert({
            user_id: user.id,
            razorpay_order_id: order.id,
            plan: sanitizedPlan,
            amount: planConfig.amount,
            currency: planConfig.currency,
            status: 'created',
        });

        if (dbError) {
            console.error('[PAYMENT_CREATE_ORDER_DB_INSERT_ERROR]', {
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
            amount: planConfig.amount,
            currency: planConfig.currency,
            keyId: razorpayConfig.keyId,
            planName: planConfig.name,
        });
    } catch (err) {
        const mapped = mapCreateOrderError(err);
        console.error('[PAYMENT_CREATE_ORDER_ERROR]', {
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
router.post('/verify', authenticateToken, async (req, res) => {
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
            .select('plan, user_id, status')
            .eq('razorpay_order_id', razorpay_order_id)
            .single();

        if (fetchError || !paymentRecord) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        // SECURITY: Ensure the order belongs to the authenticated user
        if (paymentRecord.user_id !== user.id) {
            console.error(`SECURITY: User ${user.id} tried to verify order belonging to ${paymentRecord.user_id}`);
            return res.status(403).json({ error: 'Forbidden' });
        }

        // SECURITY: Prevent double-verification of already paid orders
        if (paymentRecord.status === 'paid') {
            return res.status(409).json({ error: 'Payment already verified', plan: paymentRecord.plan });
        }

        // SECURITY: HMAC SHA256 signature verification
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // SECURITY: Timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(razorpay_signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            // Mark payment as failed
            await supabaseAdmin
                .from('payments')
                .update({ status: 'failed' })
                .eq('razorpay_order_id', razorpay_order_id);

            console.error(`SECURITY: Signature mismatch for order ${razorpay_order_id}`);
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Update payment record
        const { error: updatePaymentError } = await supabaseAdmin
            .from('payments')
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: 'paid',
                paid_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', razorpay_order_id);

        if (updatePaymentError) {
            console.error('Update payment error:', updatePaymentError);
        }

        // Upgrade user subscription tier
        const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({ subscription_tier: paymentRecord.plan })
            .eq('id', user.id);

        if (updateProfileError) {
            console.error('Update profile error:', updateProfileError);
            if (isProfilesAccessBlocked(updateProfileError)) {
                return res.status(202).json({
                    success: true,
                    message: 'Payment verified, but plan activation is pending due to temporary profile access issue.',
                    plan: paymentRecord.plan,
                    paymentId: razorpay_payment_id,
                    degraded: true,
                });
            }
            return res.status(500).json({ error: 'Payment verified but failed to upgrade plan' });
        }

        res.json({
            success: true,
            message: `Successfully upgraded to ${paymentRecord.plan} plan`,
            plan: paymentRecord.plan,
            paymentId: razorpay_payment_id,
        });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// ─────────────────────────────────────────────
// POST /api/payment/webhook
// SECURITY: Server-to-server webhook from Razorpay
// This ensures payments are recorded even if the
// user closes the browser mid-payment
// ─────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // If no webhook secret configured, skip webhook processing
        if (!webhookSecret) {
            console.warn('RAZORPAY_WEBHOOK_SECRET not configured. Webhook processing skipped.');
            return res.status(200).json({ status: 'ok' });
        }

        // SECURITY: Verify webhook signature
        const receivedSignature = req.headers['x-razorpay-signature'];
        if (!receivedSignature) {
            return res.status(400).json({ error: 'Missing webhook signature' });
        }

        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== receivedSignature) {
            console.error('SECURITY: Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const eventType = event.event;

        if (eventType === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;

            // Check if already processed
            const { data: existing } = await supabaseAdmin
                .from('payments')
                .select('status, plan, user_id')
                .eq('razorpay_order_id', orderId)
                .single();

            if (existing && existing.status !== 'paid') {
                // Update payment record
                await supabaseAdmin
                    .from('payments')
                    .update({
                        razorpay_payment_id: payment.id,
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                    })
                    .eq('razorpay_order_id', orderId);

                // Upgrade user
                const { error: updateProfileError } = await supabaseAdmin
                    .from('profiles')
                    .update({ subscription_tier: existing.plan })
                    .eq('id', existing.user_id);

                if (updateProfileError) {
                    if (isProfilesAccessBlocked(updateProfileError)) {
                        console.warn(`Webhook: payment captured but profile update blocked for order ${orderId}`);
                    } else {
                        throw updateProfileError;
                    }
                } else {
                    console.log(`Webhook: Payment ${payment.id} captured, user upgraded to ${existing.plan}`);
                }
            }
        } else if (eventType === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;

            await supabaseAdmin
                .from('payments')
                .update({ status: 'failed' })
                .eq('razorpay_order_id', orderId);

            console.log(`Webhook: Payment failed for order ${orderId}`);
        }

        // Always respond 200 to Razorpay to acknowledge receipt
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('Webhook error:', err);
        // Still respond 200 to prevent Razorpay from retrying
        res.status(200).json({ status: 'ok' });
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
        console.error('Payment history error:', err);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

export default router;
