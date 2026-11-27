import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Payment from './Payment';
import Pricing from './Pricing';

const authMock = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'alex@example.com', fullName: 'Alex Doe', subscriptionTier: 'free' },
  refreshSubscription: vi.fn(),
}));

const authFetchMock = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('../utils/authFetch', () => ({
  authFetch: authFetchMock,
}));

vi.mock('../config/api.js', () => ({
  API_URL: 'http://localhost:5000',
}));

function renderPayment(initialEntry = '/payment?plan=pro&billingCycle=annual') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/payment" element={<Payment />} />
        <Route path="/dashboard" element={<div>Dashboard Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Pricing & Payment checkout flows (Bugs 1, 2, 3)', () => {
  let razorpayOptions = null;

  beforeEach(() => {
    vi.clearAllMocks();
    razorpayOptions = null;
    authMock.user = { id: 'user-1', email: 'alex@example.com', fullName: 'Alex Doe', subscriptionTier: 'free' };
    authMock.refreshSubscription = vi.fn().mockResolvedValue(undefined);

    window.Razorpay = vi.fn(function MockRazorpay(options) {
      razorpayOptions = options;
      return {
        on: vi.fn(),
        open: vi.fn(),
      };
    });

    const existingScript = document.createElement('script');
    existingScript.id = 'razorpay-script';
    document.body.appendChild(existingScript);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete window.Razorpay;
    document.getElementById('razorpay-script')?.remove();
  });

  it('Pricing annual toggle displays the one-time annual price, links to annual checkout, and matches Profile cancellation copy', () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    const toggle = screen.getByRole('button', { name: /toggle billing period/i });
    fireEvent.click(toggle);

    expect(screen.getByText('₹950.4')).toBeInTheDocument();
    expect(screen.getByText('₹2,870.4')).toBeInTheDocument();

    const ctaLinks = screen.getAllByRole('link', { name: /get started/i });
    expect(ctaLinks[1]).toHaveAttribute('href', '/payment?plan=pro&billingCycle=annual');
    expect(ctaLinks[2]).toHaveAttribute('href', '/payment?plan=elite&billingCycle=annual');

    expect(screen.getByRole('button', { name: /Can I cancel anytime\?/i })).toBeInTheDocument();
  });

  it('Pricing links paid users to Profile to manage or cancel their subscription', () => {
    authMock.user = { id: 'user-1', email: 'alex@example.com', fullName: 'Alex Doe', subscriptionTier: 'pro' };
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    const manageLink = screen.getByRole('link', { name: /Manage or cancel in Profile/i });
    expect(manageLink).toHaveAttribute('href', '/profile');
  });

  it('Bug 1: Payment displays ₹950.40 for annual Pro, creates annual order, and rejects mismatched order amounts', async () => {
    authFetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ready: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: 'order_wrong_amt',
          amount: 9900,
          currency: 'INR',
          keyId: 'rzp_test_1',
        }),
      });

    renderPayment('/payment?plan=pro&billingCycle=annual');

    expect(screen.getByText(/Pro Plan • Annual \(Save 20%\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay ₹950\.40/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pay ₹950\.40/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment initialization is incomplete. Please try again.');
    expect(authFetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5000/api/payment/create-order',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billingCycle: 'annual' }),
      })
    );
    expect(window.Razorpay).not.toHaveBeenCalled();
  });

  it('Bug 2: Failed activation or degraded verify does not show success and lets user retry verification', async () => {
    authFetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ready: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: 'order_annual_1',
          amount: 95040,
          currency: 'INR',
          keyId: 'rzp_test_1',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Payment verification failed' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, degraded: true, plan: 'pro', paymentId: 'pay_123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, plan: 'pro', paymentId: 'pay_123' }),
      });

    renderPayment('/payment?plan=pro&billingCycle=annual');
    fireEvent.click(screen.getByRole('button', { name: /Pay ₹950\.40/i }));

    await waitFor(() => expect(window.Razorpay).toHaveBeenCalledTimes(1));
    expect(razorpayOptions.amount).toBe(95040);

    await act(async () => {
      razorpayOptions.handler({
        razorpay_order_id: 'order_annual_1',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment verification failed');
    expect(screen.queryByText(/Payment Successful!/i)).not.toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry payment verification/i });

    // Second attempt returns degraded=true -> still must NOT show success
    fireEvent.click(retryBtn);
    await waitFor(() => expect(authFetchMock).toHaveBeenCalledTimes(4));
    expect(screen.queryByText(/Payment Successful!/i)).not.toBeInTheDocument();

    // Third attempt succeeds -> must NOT call /create-order again, refreshes subscription, shows success
    fireEvent.click(screen.getByRole('button', { name: /Retry payment verification/i }));
    expect(await screen.findByText(/Payment Successful!/i)).toBeInTheDocument();
    expect(authFetchMock).toHaveBeenCalledTimes(5);
    expect(authMock.refreshSubscription).toHaveBeenCalledTimes(1);
  });

  it('Bug 3: Webhook-first verify returning 200 refreshes subscription, shows active plan, and redirects', async () => {
    authFetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ready: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: 'order_elite_1',
          amount: 287040,
          currency: 'INR',
          keyId: 'rzp_test_1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          plan: 'elite',
          paymentId: 'pay_elite_1',
          billingCycle: 'annual',
          subscriptionExpiresAt: '2027-06-15T00:00:00.000Z',
          subscriptionStatus: 'active',
        }),
      });

    renderPayment('/payment?plan=elite&billingCycle=annual');
    expect(screen.getByRole('button', { name: /Pay ₹2,870\.40/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pay ₹2,870\.40/i }));
    await waitFor(() => expect(window.Razorpay).toHaveBeenCalledTimes(1));

    vi.useFakeTimers();
    await act(async () => {
      razorpayOptions.handler({
        razorpay_order_id: 'order_elite_1',
        razorpay_payment_id: 'pay_elite_1',
        razorpay_signature: 'sig_elite_1',
      });
    });

    expect(screen.getByText(/Payment Successful!/i)).toBeInTheDocument();
    expect(screen.getByText(/Your active plan is Elite\./i)).toBeInTheDocument();
    expect(screen.getByText('pay_elite_1')).toBeInTheDocument();
    expect(screen.getByText(/Access Valid Until/i)).toBeInTheDocument();
    expect(authMock.refreshSubscription).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
  });
});
