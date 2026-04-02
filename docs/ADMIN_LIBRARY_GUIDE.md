# Admin Library Management Guide

## Quick Start

### Prerequisites
- Admin role in the system
- JWT authentication token
- Base URL: `http://localhost:5000/api` (or production URL)

---

## Adding a Book (Step by Step)

### 1. Minimal Add (Title & Author Only)
```bash
curl -X POST http://localhost:5000/api/library/admin/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin"
  }'
```

**Response**: Returns book with UUID and all default values

---

### 2. Complete Book Addition (Full Details)
```bash
curl -X POST http://localhost:5000/api/library/admin/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
    "author": "Robert C. Martin",
    "isbn": "978-0132350884",
    "description": "Practical guide to writing clean, readable, and maintainable code",
    "cover_url": "https://example.com/clean-code-cover.jpg",
    "category": "Programming",
    "subcategory": "Best Practices",
    "tags": ["programming", "clean-code", "best-practices", "refactoring"],
    "publisher": "Prentice Hall",
    "publication_date": "2008-08-01",
    "language": "English",
    "pages": 464,
    "edition": "1st",
    "amazon_url": "https://amazon.com/Clean-Code-Robert-Martin/dp/0132350884",
    "goodreads_url": "https://goodreads.com/book/show/3735293",
    "resource_url": "https://our-platform.com/resources/clean-code.pdf",
    "difficulty_level": "Intermediate"
  }'
```

---

## Common Book Categories

Use these suggested categories for consistency:

| Category | Use Case | Sub-categories |
|----------|----------|-----------------|
| **DSA** | Data Structures & Algorithms | Sorting, Dynamic Programming, Graphs, Arrays |
| **System Design** | Large-scale system architecture | Database Design, Scalability, APIs |
| **Programming** | General programming | Best Practices, Design Patterns, Refactoring |
| **Web Development** | Web technologies | Frontend, Backend, Full-stack, DevOps |
| **Interview Prep** | Interview preparation | Behavioral, Technical, Case Studies |
| **Career** | Career development | Leadership, Negotiations, Growth |
| **AI/ML** | Machine Learning | Neural Networks, NLP, Computer Vision |
| **Database** | Database systems | SQL, NoSQL, Performance Tuning |

---

## Difficulty Levels

Use one of three levels:
- **Beginner** - For first-time readers or introductory concepts
- **Intermediate** - For developers with 1-3 years experience
- **Advanced** - For experienced developers or specialized topics

---

## Books Frequently Added to Preploop

### DSA
```json
{
  "title": "Introduction to Algorithms",
  "author": "Cormen, Leiserson, Rivest, Stein",
  "isbn": "978-0262033848",
  "category": "DSA",
  "difficulty_level": "Advanced",
  "pages": 1312,
  "publisher": "MIT Press"
}
```

```json
{
  "title": "Cracking the Coding Interview",
  "author": "Gayle Laakmann McDowell",
  "isbn": "978-0984782857",
  "category": "Interview Prep",
  "difficulty_level": "Intermediate",
  "pages": 687,
  "publisher": "CareerCup"
}
```

### System Design
```json
{
  "title": "Designing Data-Intensive Applications",
  "author": "Martin Kleppmann",
  "isbn": "978-1491901915",
  "category": "System Design",
  "difficulty_level": "Advanced",
  "pages": 616,
  "publisher": "O'Reilly Media"
}
```

### Programming
```json
{
  "title": "The Pragmatic Programmer",
  "author": "David Thomas, Andrew Hunt",
  "isbn": "978-0201616224",
  "category": "Programming",
  "difficulty_level": "Intermediate",
  "pages": 352,
  "publisher": "Addison-Wesley"
}
```

---

## Updating a Book

### Update Specific Fields
```bash
curl -X PUT http://localhost:5000/api/library/admin/books/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 4.8,
    "total_ratings": 250,
    "resource_url": "https://new-link.com/book.pdf"
  }'
```

**Note**: `added_by` and `approved` cannot be updated via API

---

## Deleting a Book

```bash
curl -X DELETE http://localhost:5000/api/library/admin/books/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Warning**: This will delete the book and cascade delete all reviews and user shelf entries

---

## Monitoring Library

### List All Books (Admin View - All Books)
Since you're an admin, you need to fetch and filter:

```bash
# Get public approved books
curl -X GET "http://localhost:5000/api/library/books?limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Bulk Book Addition

For adding multiple books, use this script pattern:

```bash
#!/bin/bash

BOOKS=(
  '{"title":"Clean Code","author":"Robert C. Martin","category":"Programming"}'
  '{"title":"Cracking the Coding Interview","author":"Gayle Laakmann McDowell","category":"Interview Prep"}'
  '{"title":"Introduction to Algorithms","author":"Cormen et al","category":"DSA"}'
)

TOKEN="YOUR_JWT_TOKEN"
API_URL="http://localhost:5000/api/library/admin/books"

for book in "${BOOKS[@]}"; do
  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$book"
  echo "Added: $book"
done
```

---

## Troubleshooting

### Error: "401 Unauthorized"
- Check JWT token is valid and not expired
- Ensure token is included in Authorization header with "Bearer " prefix

### Error: "403 Forbidden"
- Your account is not an admin
- Contact a system admin to promote your account

### Error: "400 Bad Request: Title and author are required"
- Always include `title` and `author` fields
- Example: `"title": "Book Name", "author": "Author Name"`

### Error: "500 Server Error"
- Check database connection
- Check Supabase credentials
- Review logs at `/backend/debug-logs`

---

## Best Practices for Admins

1. **Always include**: Title, Author, Category, Difficulty Level, Pages
2. **Cover images**: Use high-quality images (minimum 200x300 pixels)
3. **Descriptions**: Keep descriptions 1-3 sentences, clear and concise
4. **Tags**: Use lowercase, consistent tags for better filtering
5. **URLs**: Verify working before saving (Amazon, Goodreads, resource links)
6. **Reviews**: Monitor and moderate user reviews for inappropriate content
7. **Categories**: Use standardized categories for consistency
8. **ISBN**: Include when available for tracking and library integration

---

## Database Direct Access

If needed, check books directly in Supabase:

```sql
-- View all books
SELECT id, title, author, category, difficulty_level, created_at 
FROM library_books 
ORDER BY created_at DESC;

-- View approved books only
SELECT * FROM library_books WHERE approved = TRUE;

-- Get book statistics
SELECT 
  category, 
  COUNT(*) as total_books,
  AVG(pages) as avg_pages
FROM library_books 
GROUP BY category;
```

---

## API Response Examples

### Success: Book Added
```json
HTTP/1.1 201 Created

{
  "message": "Book added successfully",
  "book": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "category": "Programming",
    "difficulty_level": "Intermediate",
    "created_at": "2026-04-01T10:30:00Z",
    "approved": true
  }
}
```

### Error: Missing Required Field
```json
HTTP/1.1 400 Bad Request

{
  "error": "Title and author are required"
}
```

### Error: Not Admin
```json
HTTP/1.1 403 Forbidden

{
  "error": "Access denied"
}
```

---

## Integration with Frontend

Once books are added via admin endpoints, they automatically appear in:
- Public library view (`/library` page)
- Search functionality
- Category browse
- User shelf management
- Review system

No additional frontend configuration needed!

---

## Need Help?

- Check [LIBRARY_API.md](./LIBRARY_API.md) for full API documentation
- Review backend logs for database/auth errors
- Verify admin role via `/api/admin/stats` endpoint
- Test JWT token validity before debugging API calls
