-- Payments table for Razorpay integration
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(512),
  plan VARCHAR(50) NOT NULL,       -- 'pro' or 'elite'
  amount INTEGER NOT NULL,          -- amount in paise (e.g., 9900 = ₹99)
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created',  -- 'created', 'paid', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_order ON payments(razorpay_order_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update payments" ON payments FOR UPDATE USING (true);
