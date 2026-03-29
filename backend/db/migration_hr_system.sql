-- Migration: HR System additions
-- Adds HR-specific columns to profiles, updates interview_slots, creates interview_bookings

-- 1. Add HR columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- 2. Add max_bookings and status to interview_slots
ALTER TABLE interview_slots ADD COLUMN IF NOT EXISTS max_bookings INTEGER DEFAULT 1;
ALTER TABLE interview_slots ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';

-- 3. Interview bookings table (replaces simple booked_by on slots)
CREATE TABLE IF NOT EXISTS interview_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slot_id INTEGER REFERENCES interview_slots(id) ON DELETE CASCADE,
  hr_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_bookings_user ON interview_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_bookings_slot ON interview_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_interview_bookings_hr ON interview_bookings(hr_id);

-- 4. Add source column to job_listings for HR-posted jobs
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin';

-- 5. RLS
ALTER TABLE interview_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON interview_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "HR can view their bookings" ON interview_bookings FOR SELECT USING (auth.uid() = hr_id);
