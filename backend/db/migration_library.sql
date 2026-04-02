-- Migration: Library Management System
-- Purpose: Add database tables for library book management
-- Date: 2026-04-01

-- 1. Books Table
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Book Information
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20),
  description TEXT,
  cover_url VARCHAR(500),
  
  -- Categorization
  category VARCHAR(100), -- e.g., 'DSA', 'System Design', 'Web Development', 'Interview Prep'
  subcategory VARCHAR(100),
  tags TEXT[], -- Array of tags for filtering
  
  -- Book Details
  publisher VARCHAR(255),
  publication_date DATE,
  language VARCHAR(50) DEFAULT 'English',
  pages INTEGER,
  edition VARCHAR(50),
  
  -- Resource Links
  amazon_url VARCHAR(500),
  goodreads_url VARCHAR(500),
  resource_url VARCHAR(500), -- Link to read online or download
  
  -- Metadata
  difficulty_level VARCHAR(50), -- 'Beginner', 'Intermediate', 'Advanced'
  rating NUMERIC(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Admin Information
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Book Reviews Table
CREATE TABLE IF NOT EXISTS library_book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reviews from same user for same book
  UNIQUE(book_id, user_id)
);

-- 3. User Library Shelf Table (for marking books as read/favorites)
CREATE TABLE IF NOT EXISTS library_user_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  
  -- Shelf status
  status VARCHAR(50), -- 'reading', 'completed', 'wishlist', 'favorite'
  
  notes TEXT,
  reading_progress INTEGER DEFAULT 0, -- Percentage (0-100)
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate shelf entries
  UNIQUE(user_id, book_id)
);

-- Indexes for performance
CREATE INDEX idx_library_books_category ON library_books(category);
CREATE INDEX idx_library_books_created_at ON library_books(created_at DESC);
CREATE INDEX idx_library_books_approved ON library_books(approved);
CREATE INDEX idx_library_books_tags ON library_books USING GIN(tags);
CREATE INDEX idx_library_book_reviews_book_id ON library_book_reviews(book_id);
CREATE INDEX idx_library_user_shelves_user_id ON library_user_shelves(user_id);
CREATE INDEX idx_library_user_shelves_book_id ON library_user_shelves(book_id);

-- Enable Row Level Security (RLS)
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_user_shelves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view approved books
CREATE POLICY "Anyone can view approved books"
  ON library_books FOR SELECT
  USING (approved = TRUE);

-- Only admins can insert/update/delete books
CREATE POLICY "Only admins can manage books"
  ON library_books FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE (raw_user_meta_data->>'role')::text = 'admin' OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Anyone authenticated can view and create reviews
CREATE POLICY "Authenticated users can view reviews"
  ON library_book_reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create their own reviews"
  ON library_book_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON library_book_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON library_book_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- User shelf policies
CREATE POLICY "Authenticated users can view shelves"
  ON library_user_shelves FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own shelf"
  ON library_user_shelves FOR ALL
  USING (auth.uid() = user_id);
