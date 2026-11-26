import { useState, useEffect, useRef } from 'react';
import './Payment.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {Shield, Lock, CheckCircle2, ArrowLeft, Zap, Check, Code2, Sparkles} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import { API_URL } from '../config/api.js';
const isDev = import.meta.env.DEV;

function getPaymentErrorMessage(status, errorCode, fallbackMessage) {
    if (errorCode === 'PAYMENT_PROVIDER_NOT_CONFIGURED') {
        return 'Payment service is not configured. Please contact support.';
    }

    if (errorCode === 'PAYMENT_DB_UNAVAILABLE' || errorCode === 'PAYMENT_HEALTH_CHECK_FAILED') {
        return 'Payment service is temporarily unavailable. Please try again in a moment.';
    }

    if (errorCode === 'PAYMENT_PROVIDER_AUTH_FAILED') {
        return 'Payment provider authentication failed. Please contact support.';
    }

    if (errorCode === 'PAYMENT_ORDER_SAVE_FAILED' || errorCode === 'PAYMENT_PENDING_LOOKUP_FAILED') {
        return 'Unable to initialize payment right now. Please retry shortly.';
    }

    if (status === 401 || status === 403 || errorCode === 'AUTH_REQUIRED') {
        return 'Your session has expired. Please log in again and retry payment.';
    }

    if (status === 429 || errorCode === 'PAYMENT_PROVIDER_RATE_LIMITED') {
        return 'Too many payment attempts right now. Please wait a moment and retry.';
    }

    if (status >= 500) {
        return fallbackMessage || 'Payment server error. Please try again shortly.';
    }

    return fallbackMessage || 'Failed to create order';
}

async function parseJsonSafely(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

// Load Razorpay checkout script dynamically
function loadRazorpayScript() {
    return new Promise((resolve) => {
        const existing = document.getElementById('razorpay-script');
        if (existing) {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            existing.addEventListener('load', () => resolve(true), { once: true });
            existing.addEventListener('error', () => resolve(false), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function Payment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, refreshSubscription } = useAuth();
    const plan = searchParams.get('plan') || 'pro';

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const verificationInProgress = useRef(false);
    const [paymentProof, setPaymentProof] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        return () => {
            const script = document.getElementById('razorpay-script') || document.querySelector('script[src*="checkout.razorpay.com"]');
            if (script) {
                script.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (!isSuccess) return undefined;
        const timer = setTimeout(() => {
            navigate('/dashboard');
        }, 3000);
        return () => clearTimeout(timer);
    }, [isSuccess, navigate]);

    const billingCycle = (searchParams.get('billingCycle') || 'monthly').trim().toLowerCase();
    const isAnnual = billingCycle === 'annual';

    const basePlans = {
        pro: {
            name: 'Pro',
            basePrice: 99,
            features: ['Unlimited AI mock interviews', 'Advanced code feedback', 'Full DSA patterns & solutions', 'Priority support']
        },
        premium: {
            name: 'Premium',
            basePrice: 299,
            features: ['Everything in Pro', 'Extended time limits', 'Behavioral coaching', 'Custom study plans']
        },
        elite: {
            name: 'Elite',
            basePrice: 299,
            features: ['Everything in Pro', 'Extended time limits', 'Behavioral coaching', 'Custom study plans']
        }
    };

    const requestedPlan = plan.toLowerCase();
    const targetKey = Object.hasOwn(basePlans, requestedPlan) ? requestedPlan : 'pro';
    const currentBase = basePlans[targetKey];
    const amountPaise = isAnnual ? Math.round(currentBase.basePrice * 100 * 12 * 0.8) : currentBase.basePrice * 100;
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: amountPaise % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(amountPaise / 100);
    const formattedPeriod = isAnnual ? '/ year' : '/ month';

    const selectedPlan = {
        name: currentBase.name,
        price: formattedPrice,
        priceInr: formattedPrice,
        originalPrice: `₹${currentBase.basePrice}`,
        period: formattedPeriod,
        features: currentBase.features,
        isAnnual,
        discountPercent: isAnnual ? 20 : 0,
    };

    const verifyPayment = async (proof) => {
        if (verificationInProgress.current) return;
        verificationInProgress.current = true;
        setError('');
        setIsProcessing(true);
        try {
            const verifyRes = await authFetch(`${API_URL}/api/payment/verify`, {
                method: 'POST',
                body: JSON.stringify({
                    razorpay_order_id: proof.razorpay_order_id,
                    razorpay_payment_id: proof.razorpay_payment_id,
                    razorpay_signature: proof.razorpay_signature,
                }),
            });
            const verified = await parseJsonSafely(verifyRes);
            if (verifyRes.ok && verified?.success && !verified.degraded) {
                try { await refreshSubscription?.(); } catch (error) { console.error('Subscription refresh failed after payment:', error); }
                setPaymentData({ paymentId: verified.paymentId, plan: verified.plan });
                setIsSuccess(true);
                setPaymentProof(null);
            } else {
                if (verified?.paymentFailed) setPaymentProof(null);
                setError(verified?.message || verified?.error || 'Payment confirmation is pending. Retry verification to check this payment.');
            }
        } catch {
            setError('Could not check payment status. Retry verification to check this payment.');
        } finally {
            verificationInProgress.current = false;
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (isProcessing) return;
        if (paymentProof) return verifyPayment(paymentProof);
        setError('');
        setIsProcessing(true);

        try {
            // 1. Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setError('Failed to load payment gateway. Please check your internet connection.');
                setIsProcessing(false);
                return;
            }


            if (!user) {
                setError('Please log in to make a payment.');
                setIsProcessing(false);
                return;
            }

            // 2. Payment health preflight
            const healthRes = await authFetch(`${API_URL}/api/payment/health`);

            const healthData = await parseJsonSafely(healthRes);
            if (!healthRes.ok || !healthData?.ready) {
                if (isDev) {
                    console.error('[PAYMENT_HEALTH_FAILED]', {
                        status: healthRes.status,
                        payload: healthData,
                    });
                }
                setError(
                    getPaymentErrorMessage(
                        healthRes.status,
                        healthData?.errorCode || healthData?.code,
                        healthData?.error || 'Payment service is temporarily unavailable.'
                    )
                );
                setIsProcessing(false);
                return;
            }

            // 3. Create order on backend
            const orderRes = await authFetch(`${API_URL}/api/payment/create-order`, {
                method: 'POST',
                body: JSON.stringify({
                    plan: targetKey === 'premium' ? 'elite' : targetKey,
                    billingCycle: isAnnual ? 'annual' : 'monthly',
                }),
            });

            const orderData = await parseJsonSafely(orderRes);
            if (!orderRes.ok) {
                if (isDev) {
                    console.error('[PAYMENT_CREATE_ORDER_FAILED]', {
                        status: orderRes.status,
                        payload: orderData,
                    });
                }

                setError(
                    getPaymentErrorMessage(
                        orderRes.status,
                        orderData?.errorCode || orderData?.code,
                        orderData?.error
                    )
                );
                setIsProcessing(false);
                return;
            }

            if (!orderData?.orderId || !orderData?.keyId || orderData.amount !== amountPaise || orderData.currency !== 'INR') {
                setError('Payment initialization is incomplete. Please try again.');
                setIsProcessing(false);
                return;
            }

            // 4. Open Razorpay Checkout
            let paymentReceived = false;
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'PrepLoop',
                description: `${selectedPlan.name} Plan - ${isAnnual ? 'Annual (20% off)' : 'Monthly'}`,
                order_id: orderData.orderId,
                prefill: {
                    email: user?.email || '',
                    name: user?.fullName || user?.full_name || '',
                },
                theme: {
                    color: '#6366f1',
                    backdrop_color: 'rgba(0, 0, 0, 0.7)',
                },
                handler: (response) => {
                    paymentReceived = true;
                    setPaymentProof(response);
                    void verifyPayment(response);
                },
                modal: {
                    ondismiss: function () {
                        if (!paymentReceived) setIsProcessing(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Payment error:', err);
            setError('Something went wrong. Please try again.');
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="payment-page success-view">
                <div className="success-container">
                    <div className="success-icon-wrapper">
                        <div className="success-icon-bg pulse-ring" />
                        <CheckCircle2 size={64} className="success-icon text-green-500" />
                    </div>
                    <h1 className="success-title text-gradient">Payment Successful!</h1>
                    <p className="success-message">Your payment was confirmed. Your active plan is {paymentData?.plan === 'free' ? 'Free' : basePlans[paymentData?.plan]?.name || selectedPlan.name}.</p>
                    <div className="success-details glass-panel">
                        <div className="detail-row">
                            <span className="detail-label">Payment ID</span>
                            <span className="detail-value font-mono">{paymentData?.paymentId || '—'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Amount Paid</span>
                            <span className="detail-value font-semibold">{selectedPlan.price}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Plan</span>
                            <span className="detail-value">{selectedPlan.name} Plan {isAnnual ? '(Annual)' : ''}</span>
                        </div>
                    </div>
                    <p className="redirect-text">Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            {/* Background Orbs */}
            <div className="ambient-orb orb-1" />
            <div className="ambient-orb orb-2" />

            <div className="payment-container">

                {/* Left Side: Order Summary */}
                <div className="order-summary glass-panel">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div className="summary-header">
                        <div className="payment-brand-logo">
                            <div className="payment-logo-icon">
                                <Code2 size={20} color="white" />
                            </div>
                            <span>PrepLoop Inc.</span>
                        </div>
                    </div>

                    <div className="plan-details">
                        <div className="plan-badge">
                            {selectedPlan.name} Plan {isAnnual ? '• Annual (Save 20%)' : ''}
                        </div>
                        <h2 className="plan-title text-gradient">Upgrade to {selectedPlan.name}</h2>
                        <p className="plan-desc">Unlock premium tools and fast-track your prep.</p>

                        <div className="price-display">
                            <span className="currency">₹</span>
                            <span className="amount">{selectedPlan.price.replace('₹', '')}</span>
                            <span className="period">{selectedPlan.period}</span>
                        </div>
                        {isAnnual && (
                            <div className="annual-discount-callout" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#34d399', marginTop: '6px' }}>
                                <Sparkles size={14} />
                                <span>20% Annual Discount Applied (was {selectedPlan.originalPrice}/mo)</span>
                            </div>
                        )}

                        <div className="divider" />

                        <ul className="feature-list">
                            {selectedPlan.features.map((feature, idx) => (
                                <li key={idx}>
                                    <div className="feature-icon"><Check size={14} /></div>
                                    <span className="feature-text">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="summary-footer">
                        <div className="secure-badge">
                            <Shield size={14} color="#10b981" />
                            <span>Secured by Razorpay</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Razorpay Checkout */}
                <div className="payment-form-container glass-panel">
                    <div className="checkout-header">
                        <h3>Complete your payment</h3>
                        <div className="payment-amount">{selectedPlan.priceInr}</div>
                    </div>

                    <div className="razorpay-checkout-section">
                        <div className="razorpay-info">
                            <div className="razorpay-info-icon">
                                <Zap size={24} className="text-indigo-400" />
                            </div>
                            <h4>Secure Payment via Razorpay</h4>
                            <p>Pay securely using UPI, Credit/Debit Cards, Net Banking, or Wallets through Razorpay's trusted checkout.</p>

                            <div className="payment-methods-grid">
                                <div className="method-badge">💳 Cards</div>
                                <div className="method-badge">📱 UPI</div>
                                <div className="method-badge">🏦 Netbanking</div>
                                <div className="method-badge">👛 Wallets</div>
                            </div>
                        </div>

                        {error && (
                            <div className="payment-error">
                                <p role="alert">{error}</p>
                            </div>
                        )}

                        <div className="payment-actions">
                            <Button
                                type="button"
                                className="btn-pay w-full h-[52px]"
                                disabled={isProcessing}
                                onClick={handlePayment}
                            >
                                {isProcessing ? (
                                    <span className="loading-spinner" />
                                ) : (
                                    <>
                                        <Lock size={16} className="mr-2" />
                                        {paymentProof ? 'Retry payment verification' : `Pay ${selectedPlan.priceInr}`}
                                    </>
                                )}
                            </Button>
                            <p className="payment-security-note">
                                Your payment is 256-bit SSL encrypted. We never store your card details.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
