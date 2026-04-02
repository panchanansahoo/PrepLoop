# Library Management API

## Overview

The Library Management API provides functionality for admins to manage books and for users to interact with the library, including adding books to personal shelves, leaving reviews, and discovering content.

## Features

- **Admin Book Management**: Add, update, and delete books
- **Book Discovery**: Browse and search books with filtering
- **User Shelving**: Mark books as reading, completed, wishlist, or favorite
- **User Reviews**: Rate and review books with text feedback
- **Role-Based Access**: Admin-only endpoints for book management

---

## Database Schema

### Tables Created

1. **library_books** - Core book information
2. **library_book_reviews** - User reviews and ratings
3. **library_user_shelves** - User library shelves (reading status)

All tables include Row Level Security (RLS) policies for data protection.

---

## API Endpoints

### Admin Endpoints (Require Authentication + Admin Role)

#### 1. Add a New Book
```http
POST /api/library/admin/books
```

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "title": "The Pragmatic Programmer",
  "author": "David Thomas, Andrew Hunt",
  "isbn": "978-0201616224",
  "description": "Essential guide to becoming a more effective programmer",
  "cover_url": "https://example.com/cover.jpg",
  "category": "Programming",
  "subcategory": "Best Practices",
  "tags": ["programming", "career", "best-practices"],
  "publisher": "Addison-Wesley",
  "publication_date": "1999-10-30",
  "language": "English",
  "pages": 352,
  "edition": "1st",
  "amazon_url": "https://amazon.com/...",
  "goodreads_url": "https://goodreads.com/...",
  "resource_url": "https://example.com/book-pdf",
  "difficulty_level": "Intermediate"
}
```

**Required Fields**: `title`, `author`

**Optional Fields**: All others

**Response** (201 Created):
```json
{
  "message": "Book added successfully",
  "book": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "The Pragmatic Programmer",
    "author": "David Thomas, Andrew Hunt",
    "isbn": "978-0201616224",
    "category": "Programming",
    "difficulty_level": "Intermediate",
    "added_by": "user-uuid",
    "approved": true,
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-01T10:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields (title, author)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not an admin
- `500 Server Error`: Database error

---

#### 2. Update a Book
```http
PUT /api/library/admin/books/:id
```

**Authentication**: Required (Admin role)

**URL Parameters**:
- `id` (UUID) - Book ID to update

**Request Body**: Any fields from book schema to update

**Response** (200 OK):
```json
{
  "message": "Book updated successfully",
  "book": { ... }
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Book not found
- `500 Server Error`: Database error

---

#### 3. Delete a Book
```http
DELETE /api/library/admin/books/:id
```

**Authentication**: Required (Admin role)

**URL Parameters**:
- `id` (UUID) - Book ID to delete

**Response** (200 OK):
```json
{
  "message": "Book deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not an admin
- `500 Server Error`: Database error

---

### Public Endpoints (No Authentication Required)

#### 4. List Books
```http
GET /api/library/books
```

**Query Parameters**:
- `category` (string, optional) - Filter by category
- `difficulty_level` (string, optional) - Filter by difficulty (Beginner, Intermediate, Advanced)
- `search` (string, optional) - Search by title, author, or description
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20) - Items per page

**Example**:
```http
GET /api/library/books?category=DSA&difficulty_level=Intermediate&search=algorithms&page=1&limit=20
```

**Response** (200 OK):
```json
{
  "books": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Introduction to Algorithms",
      "author": "Cormen, Leiserson, Rivest, Stein",
      "category": "DSA",
      "difficulty_level": "Advanced",
      "pages": 1312,
      "cover_url": "https://...",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

#### 5. Get Single Book
```http
GET /api/library/books/:id
```

**URL Parameters**:
- `id` (UUID) - Book ID

**Response** (200 OK):
```json
{
  "book": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introduction to Algorithms",
    "author": "Cormen, Leiserson, Rivest, Stein",
    "isbn": "978-0262033848",
    "description": "Comprehensive textbook on algorithms...",
    "cover_url": "https://...",
    "category": "DSA",
    "difficulty_level": "Advanced",
    "pages": 1312,
    "publisher": "MIT Press",
    "avgRating": 4.8,
    "reviewCount": 156
  },
  "reviews": [
    {
      "id": "review-uuid",
      "user_id": "user-uuid",
      "rating": 5,
      "review_text": "Essential book for understanding algorithms"
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Book not found or not approved

---

### Authenticated User Endpoints

#### 6. Add a Book Review
```http
POST /api/library/reviews
```

**Authentication**: Required

**Request Body**:
```json
{
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 5,
  "review_text": "Excellent book! Highly recommend for DSA preparation."
}
```

**Required Fields**: `book_id`, `rating`

**Rating Range**: 1-5

**Response** (201 Created):
```json
{
  "message": "Review posted successfully",
  "review": {
    "id": "review-uuid",
    "book_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "rating": 5,
    "review_text": "Excellent book! Highly recommend for DSA preparation.",
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields or invalid rating (not 1-5)
- `401 Unauthorized`: Not authenticated

---

#### 7. Add Book to Shelf
```http
POST /api/library/shelf
```

**Authentication**: Required

**Request Body**:
```json
{
  "book_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "reading",
  "notes": "Started reading this, great so far!"
}
```

**Required Fields**: `book_id`, `status`

**Status Values**: `reading`, `completed`, `wishlist`, `favorite`

**Response** (201 Created):
```json
{
  "message": "Book added to shelf",
  "shelf": {
    "id": "shelf-uuid",
    "user_id": "user-uuid",
    "book_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "reading",
    "notes": "Started reading this, great so far!",
    "reading_progress": 0,
    "added_at": "2026-04-01T10:00:00Z"
  }
}
```

---

#### 8. Get User's Books
```http
GET /api/library/shelf
```

**Authentication**: Required

**Query Parameters**:
- `status` (string, optional) - Filter by status (reading, completed, wishlist, favorite)
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page

**Example**:
```http
GET /api/library/shelf?status=reading&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "books": [
    {
      "id": "shelf-entry-uuid",
      "user_id": "user-uuid",
      "book_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "reading",
      "notes": "Started reading this...",
      "reading_progress": 25,
      "library_books": {
        "title": "Introduction to Algorithms",
        "author": "...",
        "cover_url": "..."
      }
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### 9. Remove Book from Shelf
```http
DELETE /api/library/shelf/:book_id
```

**Authentication**: Required

**URL Parameters**:
- `book_id` (UUID) - Book ID to remove from shelf

**Response** (200 OK):
```json
{
  "message": "Book removed from shelf"
}
```

---

## Usage Examples

### Example 1: Admin Adding a Book

```bash
curl -X POST http://localhost:5000/api/library/admin/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "System Design Interview",
    "author": "Alex Xu",
    "isbn": "978-1736049952",
    "description": "A practical guide to system design interviews",
    "category": "System Design",
    "difficulty_level": "Advanced",
    "pages": 352,
    "publisher": "ByteByteGo"
  }'
```

### Example 2: Browsing Books by Category

```bash
curl -X GET "http://localhost:5000/api/library/books?category=DSA&limit=10"
```

### Example 3: User Adding Book to Reading List

```bash
curl -X POST http://localhost:5000/api/library/shelf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "book_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "reading",
    "notes": "Starting this for interview prep"
  }'
```

### Example 4: User Leaving a Review

```bash
curl -X POST http://localhost:5000/api/library/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "book_id": "550e8400-e29b-41d4-a716-446655440000",
    "rating": 5,
    "review_text": "Absolutely essential read for DSA. Clarifies so many concepts!"
  }'
```

---

## Categories and Recommendations

Suggested book categories:
- **DSA** - Data Structures & Algorithms
- **System Design** - Large-scale system design
- **Web Development** - Frontend/Backend/Full-stack
- **Interview Prep** - General interview preparation
- **Career** - Career development and growth
- **Leadership** - Management and leadership
- **AI/ML** - Machine Learning and AI

---

## Security

- ✅ **Authentication**: JWT token required for user endpoints
- ✅ **Authorization**: Admin-only endpoints protected with role checking
- ✅ **RLS Policies**: Row Level Security enforced at database level
- ✅ **Rate Limiting**: API endpoints subject to global rate limits
- ✅ **Input Validation**: All inputs validated before database operations

---

## Migration

To apply the database migration:

```bash
cd backend
npm run migrate -- db/migration_library.sql
```

Or manually run the SQL in your Supabase console.

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (need authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

All endpoints are subject to the global rate limit:
- Default: 250 requests per 15 minutes per IP
- Can be configured via `GLOBAL_RATE_LIMIT_MAX` environment variable

---

## Frontend Integration

The frontend components should:

1. Import library route (already done in Library.jsx)
2. Call `/api/library/books` to fetch books
3. Use `/api/library/shelf` for user's personal library
4. Call `/api/library/reviews` for user reviews
5. For admins, provide UI to access `/api/library/admin/books` endpoints

Example component integration:
```javascript
// Fetch books
const response = await fetch('/api/library/books?category=DSA');
const { books, pagination } = await response.json();

// Add to shelf
await fetch('/api/library/shelf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ book_id, status: 'reading' })
});
```

---

## Future Enhancements

- [ ] Recommendations engine based on user's reading history
- [ ] Integration with external book APIs (Google Books, OpenLibrary)
- [ ] Book reading progress tracking
- [ ] Bookmarks and highlights feature
- [ ] Social sharing and recommendations between users
- [ ] Admin-approved book submissions from community
- [ ] PDF/EPUB file hosting
- [ ] Reading challenges and goals
