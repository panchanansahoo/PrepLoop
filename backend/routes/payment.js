import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

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

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Supabase admin client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Plan configuration (server-side only — price can never be tampered by client)
const PLANS = {
    pro: { name: 'Pro', amount: 9900, currency: 'INR' },       // ₹99
    elite: { name: 'Elite', amount: 29900, currency: 'INR' },   // ₹299
};

// ═══════════════════════════════════════════════
//  SECURITY: JWT verification via Supabase
//  Validates token with Supabase Auth instead of just decoding
// ═══════════════════════════════════════════════
async function getVerifiedUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];

    try {
        // Verify the JWT with Supabase Auth server (not just decode it)
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;
        return { id: user.id, email: user.email };
    } catch (e) {
        return null;
    }
}

// ═══════════════════════════════════════════════
//  SECURITY: Input sanitization helper
// ═══════════════════════════════════════════════
function sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength);
}

// ─────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order for the given plan
// ─────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
    try {
        const user = await getVerifiedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { plan } = req.body;
        const sanitizedPlan = sanitizeString(plan, 20).toLowerCase();

        if (!sanitizedPlan || !PLANS[sanitizedPlan]) {
            return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "elite".' });
        }

        // SECURITY: Prevent duplicate pending orders (anti-abuse)
        const { data: existingOrders } = await supabase
            .from('payments')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'created')
            .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 min

        if (existingOrders && existingOrders.length >= 5) {
            return res.status(429).json({ error: 'Too many pending orders. Please complete or wait before creating new ones.' });
        }

        const planConfig = PLANS[sanitizedPlan];

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
        const { error: dbError } = await supabase.from('payments').insert({
            user_id: user.id,
            razorpay_order_id: order.id,
            plan: sanitizedPlan,
            amount: planConfig.amount,
            currency: planConfig.currency,
            status: 'created',
        });

        if (dbError) {
            console.error('DB insert error:', dbError);
            return res.status(500).json({ error: 'Failed to save order' });
        }

        res.json({
            orderId: order.id,
            amount: planConfig.amount,
            currency: planConfig.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: planConfig.name,
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// ─────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay payment signature and upgrades user
// ─────────────────────────────────────────────
router.post('/verify', async (req, res) => {
    try {
        const user = await getVerifiedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const razorpay_order_id = sanitizeString(req.body.razorpay_order_id);
        const razorpay_payment_id = sanitizeString(req.body.razorpay_payment_id);
        const razorpay_signature = sanitizeString(req.body.razorpay_signature, 512);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification fields' });
        }

        // SECURITY: Verify the order belongs to this user
        const { data: paymentRecord, error: fetchError } = await supabase
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
            await supabase
                .from('payments')
                .update({ status: 'failed' })
                .eq('razorpay_order_id', razorpay_order_id);

            console.error(`SECURITY: Signature mismatch for order ${razorpay_order_id}`);
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Update payment record
        const { error: updatePaymentError } = await supabase
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
        const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ subscription_tier: paymentRecord.plan })
            .eq('id', user.id);

        if (updateProfileError) {
            console.error('Update profile error:', updateProfileError);
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
            const { data: existing } = await supabase
                .from('payments')
                .select('status, plan, user_id')
                .eq('razorpay_order_id', orderId)
                .single();

            if (existing && existing.status !== 'paid') {
                // Update payment record
                await supabase
                    .from('payments')
                    .update({
                        razorpay_payment_id: payment.id,
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                    })
                    .eq('razorpay_order_id', orderId);

                // Upgrade user
                await supabase
                    .from('profiles')
                    .update({ subscription_tier: existing.plan })
                    .eq('id', existing.user_id);

                console.log(`Webhook: Payment ${payment.id} captured, user upgraded to ${existing.plan}`);
            }
        } else if (eventType === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;

            await supabase
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
router.get('/history', async (req, res) => {
    try {
        const user = await getVerifiedUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
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
