import React, { useState, useEffect } from 'react';
import './Payment.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, ArrowLeft, Zap, Sparkles, Check, Code2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function Payment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const plan = searchParams.get('plan') || 'pro';

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [error, setError] = useState('');

    const plans = {
        pro: {
            name: 'Pro',
            price: '₹99',
            priceInr: '₹99',
            period: 'per month',
            features: ['Unlimited AI mock interviews', 'Advanced code feedback', 'Full DSA patterns & solutions', 'Priority support']
        },
        premium: {
            name: 'Premium',
            price: '₹299',
            priceInr: '₹299',
            period: 'per month',
            features: ['Everything in Pro', 'Extended time limits', 'Behavioral coaching', 'Custom study plans']
        },
        elite: {
            name: 'Elite',
            price: '₹299',
            priceInr: '₹299',
            period: 'per month',
            features: ['Everything in Pro', 'Extended time limits', 'Behavioral coaching', 'Custom study plans']
        }
    };

    const selectedPlan = plans[plan.toLowerCase()] || plans.pro;

    const handlePayment = async () => {
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

            const authHeaders = buildAuthHeaders(user);
            if (!authHeaders.Authorization) {
                setError('Please log in to make a payment.');
                setIsProcessing(false);
                return;
            }

            // 2. Payment health preflight
            const healthRes = await fetch(`${API_URL}/api/payment/health`, {
                method: 'GET',
                headers: authHeaders,
            });

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
            const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ plan: plan.toLowerCase() === 'premium' ? 'elite' : plan.toLowerCase() }),
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

            if (!orderData?.orderId || !orderData?.keyId) {
                setError('Payment initialization is incomplete. Please try again.');
                setIsProcessing(false);
                return;
            }

            // 4. Open Razorpay Checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'PrepLoop',
                description: `${selectedPlan.name} Plan - Monthly`,
                order_id: orderData.orderId,
                prefill: {
                    email: user?.email || '',
                    name: user?.fullName || user?.full_name || '',
                },
                theme: {
                    color: '#6366f1',
                    backdrop_color: 'rgba(0, 0, 0, 0.7)',
                },
                handler: async function (response) {
                    // 5. Verify payment on backend
                    try {
                        const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
                            method: 'POST',
                            headers: authHeaders,
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const verifyData = await parseJsonSafely(verifyRes);
                        if (verifyRes.ok && verifyData.success) {
                            setPaymentData({
                                paymentId: verifyData.paymentId,
                                plan: verifyData.plan,
                            });
                            setIsSuccess(true);
                            setIsProcessing(false);

                            // Redirect to dashboard after 3 seconds
                            setTimeout(() => {
                                navigate('/dashboard');
                            }, 3000);
                        } else {
                            if (isDev) {
                                console.error('[PAYMENT_VERIFY_FAILED]', {
                                    status: verifyRes.status,
                                    payload: verifyData,
                                });
                            }
                            setError(
                                getPaymentErrorMessage(
                                    verifyRes.status,
                                    verifyData?.errorCode || verifyData?.code,
                                    verifyData?.error || 'Payment verification failed'
                                )
                            );
                            setIsProcessing(false);
                        }
                    } catch (verifyErr) {
                        if (isDev) {
                            console.error('[PAYMENT_VERIFY_ERROR]', verifyErr);
                        }
                        setError('Payment verification failed. Please contact support.');
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
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
                    <p className="success-message">Welcome to PrepLoop {selectedPlan.name}. Your account has been upgraded.</p>
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
                            <span className="detail-value">{selectedPlan.name} Plan</span>
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
                            {selectedPlan.name} Plan
                        </div>
                        <h2 className="plan-title text-gradient">Upgrade to {selectedPlan.name}</h2>
                        <p className="plan-desc">Unlock premium tools and fast-track your prep.</p>

                        <div className="price-display">
                            <span className="currency">₹</span>
                            <span className="amount">{selectedPlan.price.replace('₹', '')}</span>
                            <span className="period">/ month</span>
                        </div>

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
                                <p>{error}</p>
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
                                        Pay {selectedPlan.priceInr}
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
