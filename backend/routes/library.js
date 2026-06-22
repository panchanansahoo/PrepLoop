import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const ADMIN_BOOK_UPDATABLE_FIELDS = [
  'title',
  'author',
  'isbn',
  'description',
  'cover_url',
  'category',
  'subcategory',
  'tags',
  'publisher',
  'publication_date',
  'language',
  'pages',
  'edition',
  'amazon_url',
  'goodreads_url',
  'resource_url',
  'difficulty_level',
  'rating',
  'total_ratings'
];

export function sanitizeAdminBookPayloadForUpdate(payload = {}) {
  const sanitized = {};

  for (const field of ADMIN_BOOK_UPDATABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      sanitized[field] = payload[field];
    }
  }

  return sanitized;
}

// ─── ADMIN ENDPOINTS (Require Authentication + Admin Role) ─────────────────────

// POST /api/library/admin/books - Add a new book (ADMIN ONLY)
router.post('/admin/books', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      description,
      cover_url,
      category,
      subcategory,
      tags,
      publisher,
      publication_date,
      language,
      pages,
      edition,
      amazon_url,
      goodreads_url,
      resource_url,
      difficulty_level
    } = req.body;

    // Validation
    if (!title || !author) {
      return res.status(400).json({
        error: 'Title and author are required'
      });
    }

    // Insert book
    const { data, error } = await supabaseAdmin
      .from('library_books')
      .insert([
        {
          title,
          author,
          isbn,
          description,
          cover_url,
          category,
          subcategory,
          tags: tags || [],
          publisher,
          publication_date,
          language: language || 'English',
          pages,
          edition,
          amazon_url,
          goodreads_url,
          resource_url,
          difficulty_level,
          added_by: req.user.id,
          approved: true
        }
      ])
      .select();

    if (error) {
      console.error('Error adding book:', error);
      return res.status(500).json({ error: 'Failed to add book' });
    }

    res.status(201).json({
      message: 'Book added successfully',
      book: data[0]
    });
  } catch (error) {
    console.error('Error in POST /admin/books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/library/admin/books/:id - Update a book (ADMIN ONLY)
router.put('/admin/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = sanitizeAdminBookPayloadForUpdate(req.body);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('library_books')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating book:', error);
      return res.status(500).json({ error: 'Failed to update book' });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      message: 'Book updated successfully',
      book: data[0]
    });
  } catch (error) {
    console.error('Error in PUT /admin/books/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/library/admin/books/:id - Delete a book (ADMIN ONLY)
router.delete('/admin/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('library_books')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting book:', error);
      return res.status(500).json({ error: 'Failed to delete book' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /admin/books/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUBLIC ENDPOINTS (No Auth Required) ─────────────────────

// GET /api/library/books - List all approved books with filtering
router.get('/books', async (req, res) => {
  try {
    const {
      category,
      difficulty_level,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let query = supabaseAdmin
      .from('library_books')
      .select('*', { count: 'exact' })
      .eq('approved', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty_level) {
      query = query.eq('difficulty_level', difficulty_level);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%, author.ilike.%${search}%, description.ilike.%${search}%`
      );
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching books:', error);
      return res.status(500).json({ error: 'Failed to fetch books' });
    }

    res.json({
      books: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in GET /books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/library/books/:id - Get a single book
router.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: book, error: bookError } = await supabaseAdmin
      .from('library_books')
      .select('*')
      .eq('id', id)
      .eq('approved', true)
      .single();

    if (bookError || !book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get reviews if user is authenticated
    let reviews = [];
    let avgRating = 0;
    
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from('library_book_reviews')
      .select('*')
      .eq('book_id', id);

    if (!reviewError && reviewData) {
      reviews = reviewData;
      if (reviews.length > 0) {
        avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2);
      }
    }

    res.json({
      book: {
        ...book,
        avgRating: parseFloat(avgRating),
        reviewCount: reviews.length
      },
      reviews
    });
  } catch (error) {
    console.error('Error in GET /books/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── AUTHENTICATED USER ENDPOINTS ─────────────────────

// POST /api/library/reviews - Add a book review
router.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { book_id, rating, review_text } = req.body;

    if (!book_id || !rating) {
      return res.status(400).json({
        error: 'Book ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('library_book_reviews')
      .upsert(
        [
          {
            book_id,
            user_id: req.user.id,
            rating,
            review_text
          }
        ],
        { onConflict: 'book_id,user_id' }
      )
      .select();

    if (error) {
      console.error('Error posting review:', error);
      return res.status(500).json({ error: 'Failed to post review' });
    }

    res.status(201).json({
      message: 'Review posted successfully',
      review: data[0]
    });
  } catch (error) {
    console.error('Error in POST /reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/library/shelf - Add book to user's shelf
router.post('/shelf', authenticateToken, async (req, res) => {
  try {
    const { book_id, status, notes } = req.body;

    if (!book_id || !status) {
      return res.status(400).json({
        error: 'Book ID and status are required'
      });
    }

    if (!['reading', 'completed', 'wishlist', 'favorite'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be reading, completed, wishlist, or favorite'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('library_user_shelves')
      .upsert(
        [
          {
            user_id: req.user.id,
            book_id,
            status,
            notes
          }
        ],
        { onConflict: 'user_id,book_id' }
      )
      .select();

    if (error) {
      console.error('Error adding to shelf:', error);
      return res.status(500).json({ error: 'Failed to add to shelf' });
    }

    res.status(201).json({
      message: 'Book added to shelf',
      shelf: data[0]
    });
  } catch (error) {
    console.error('Error in POST /shelf:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/library/shelf - Get user's books
router.get('/shelf', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('library_user_shelves')
      .select('*, library_books(*)', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching shelf:', error);
      return res.status(500).json({ error: 'Failed to fetch shelf' });
    }

    res.json({
      books: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in GET /shelf:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/library/shelf/:book_id - Remove book from shelf
router.delete('/shelf/:book_id', authenticateToken, async (req, res) => {
  try {
    const { book_id } = req.params;

    const { error } = await supabaseAdmin
      .from('library_user_shelves')
      .delete()
      .eq('user_id', req.user.id)
      .eq('book_id', book_id);

    if (error) {
      console.error('Error removing from shelf:', error);
      return res.status(500).json({ error: 'Failed to remove from shelf' });
    }

    res.json({ message: 'Book removed from shelf' });
  } catch (error) {
    console.error('Error in DELETE /shelf/:book_id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
