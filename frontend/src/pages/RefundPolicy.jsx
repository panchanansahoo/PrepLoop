import { RotateCcw, CheckCircle, Clock, AlertCircle, HelpCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', position: 'relative' }}>
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', position: 'relative', zIndex: 10, maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>
            Refund <span className="text-gradient">Policy</span>
          </h1>
          <p style={{ color: 'var(--zinc-400)', fontSize: '16px' }}>Last Updated: February 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))', padding: '32px', borderRadius: '16px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <RotateCcw size={24} color="#a78bfa" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>1. 7-Day Money-Back Guarantee</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', margin: 0 }}>
              At PrepLoop, we want you to be completely satisfied with your interview preparation experience. If you are not satisfied with your paid subscription (Pro or Enterprise tier), you are eligible for a 100% refund within <strong>7 days</strong> of your initial purchase date. No complex questionnaires or dark patterns required.
            </p>
          </section>

          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '28px', borderRadius: '12px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CheckCircle size={24} color="#34d399" />
              <h2 style={{ fontSize: '22px', margin: 0 }}>2. Eligibility Criteria</h2>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--zinc-400)' }}>
              <li style={{ paddingLeft: '16px', borderLeft: '2px solid #34d399' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Initial Subscriptions:</strong> Requests made within 7 calendar days of your initial plan upgrade are approved unconditionally.
              </li>
              <li style={{ paddingLeft: '16px', borderLeft: '2px solid #34d399' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Recurring Renewals:</strong> Renewal cancellations take effect at the conclusion of the active billing cycle. If you forgot to cancel an annual renewal, contact support within 48 hours of billing.
              </li>
              <li style={{ paddingLeft: '16px', borderLeft: '2px solid #34d399' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>PrepCoins & One-Time Tokens:</strong> Unused purchased coin packs are eligible for refund within 7 days if no coin-funded mock interviews have been consumed.
              </li>
            </ul>
          </section>

          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '28px', borderRadius: '12px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Clock size={24} color="#818cf8" />
              <h2 style={{ fontSize: '22px', margin: 0 }}>3. Refund Processing Timelines</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', marginBottom: '12px' }}>
              Once your refund request is submitted, our billing team reviews and initiates the transaction within <strong>24 to 48 hours</strong>.
            </p>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7', margin: 0 }}>
              Depending on your payment method and banking partner (Razorpay, card issuer, or UPI), funds typically credit back to your original payment source within <strong>5 to 7 business days</strong>.
            </p>
          </section>

          <section style={{ background: 'var(--color-bg-secondary, rgba(255,255,255,0.02))', padding: '28px', borderRadius: '12px', border: '1px solid var(--zinc-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertCircle size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '22px', margin: 0 }}>4. Non-Refundable Scenarios</h2>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--zinc-400)' }}>
              <li style={{ paddingLeft: '16px', borderLeft: '2px solid #f59e0b' }}>
                Accounts terminated or banned for severe terms violations (such as automated scraping, abuse of sandboxed runtimes, or credential sharing).
              </li>
              <li style={{ paddingLeft: '16px', borderLeft: '2px solid #f59e0b' }}>
                Requests submitted past the 7-day initial money-back window without documented service degradation.
              </li>
            </ul>
          </section>

          <section style={{ borderTop: '1px solid var(--zinc-800)', paddingTop: '32px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <HelpCircle size={24} color="#a78bfa" />
              <h2 style={{ fontSize: '24px', margin: 0 }}>5. How to Request a Refund</h2>
            </div>
            <p style={{ color: 'var(--zinc-400)', lineHeight: '1.7' }}>
              To initiate a refund, email our support team with your account email address and payment/order ID:
              <br />
              <a href="mailto:support@preploop.me?subject=Refund%20Request" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
                support@preploop.me
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

