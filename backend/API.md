# PrepLoop API Reference

**Base URLs:**
- Development: `http://localhost:5000`
- Staging: `https://preploop-api-staging.azurewebsites.net`

**Authentication:** Bearer token via Supabase Auth
```
Authorization: Bearer <supabase_access_token>
```

---

## Health Checks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Basic health check |
| GET | `/health/ready` | No | Readiness probe |
| GET | `/health/live` | No | Liveness probe |

## Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | User registration |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/logout` | Yes | User logout |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/forgot-password` | No | Password reset request |
| POST | `/api/auth/reset-password` | No | Password reset |

## User — `/api/user`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/user/profile` | Yes | Get user profile |
| PUT | `/api/user/profile` | Yes | Update user profile |
| GET | `/api/user/stats` | Yes | Get user statistics |
| GET | `/api/user/dashboard` | Yes | Dashboard data |

## Coins — `/api/coins`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/coins/balance` | Yes | Get coin balance |
| POST | `/api/coins/earn` | Yes | Earn coins (daily, activity) |
| POST | `/api/coins/spend` | Yes | Spend coins |
| GET | `/api/coins/history` | Yes | Transaction history |

## AI Interview — `/api/ai/interview`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/interview/start` | Yes | Start AI interview session |
| POST | `/api/ai/interview/respond` | Yes | Submit interview response |
| POST | `/api/ai/interview/end` | Yes | End and get feedback |
| GET | `/api/ai/interview/history` | Yes | Past interview sessions |

## Interview Suite — `/api/interview-suite`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/interview-suite/start` | Yes | Start full interview suite |
| POST | `/api/interview-suite/answer` | Yes | Submit answer |
| GET | `/api/interview-suite/status/:id` | Yes | Get session status |

## Company Interview — `/api/company-interview`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/company-interview/start` | Yes | Start company-specific prep |
| POST | `/api/company-interview/answer` | Yes | Submit answer |
| GET | `/api/company-interview/companies` | No | List available companies |

## Code Execution — `/api/practice`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/practice/run` | Yes | Execute code (JS, Python, C, C++) |
| POST | `/api/practice/submit` | Yes | Submit code solution |
| GET | `/api/practice/problems` | No | List coding problems |
| GET | `/api/practice/problem/:id` | No | Get problem details |

## DSA — `/api/dsa`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dsa/topics` | No | List DSA topics |
| GET | `/api/dsa/problems` | No | List DSA problems |
| POST | `/api/dsa/submit` | Yes | Submit DSA solution |

## AI Features — `/api/ai-features`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai-features/explain` | Yes | AI code explanation |
| POST | `/api/ai-features/hint` | Yes | Get AI hint |
| POST | `/api/ai-features/review` | Yes | AI code review |

## AI Chat — `/api/chat`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat/message` | Yes | Send chat message |
| GET | `/api/chat/history` | Yes | Get chat history |
| DELETE | `/api/chat/clear` | Yes | Clear chat history |

## Resume — `/api/resume`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/resume/analyze` | Yes | Analyze resume |
| POST | `/api/resume/upload` | Yes | Upload resume file |
| GET | `/api/resume/history` | Yes | Past analyses |

## Blog — `/api/blog`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/blog` | No | List blog posts |
| GET | `/api/blog/:slug` | No | Get single post |
| POST | `/api/blog` | Yes | Create post |
| PUT | `/api/blog/:id` | Yes | Update post |
| DELETE | `/api/blog/:id` | Yes | Delete post |

## Community — `/api/community`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/community/posts` | No | List community posts |
| POST | `/api/community/posts` | Yes | Create post |
| POST | `/api/community/posts/:id/like` | Yes | Like a post |

## Jobs — `/api/jobs`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/jobs` | No | List job postings |
| GET | `/api/jobs/:id` | No | Get job details |
| POST | `/api/jobs/scrape` | Yes | Trigger job scrape |

## Payment — `/api/payment`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payment/create-order` | Yes | Create Razorpay order |
| POST | `/api/payment/verify` | Yes | Verify payment |
| POST | `/api/payment/webhook` | No | Razorpay webhook |

## Voice — `/api/voice`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/voice/tts` | Yes | Text-to-speech |
| POST | `/api/voice/stt` | Yes | Speech-to-text |

## Admin — `/api/admin`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/stats` | Admin | System statistics |
| PUT | `/api/admin/user/:id` | Admin | Update user |

## Other Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/contact` | No | Contact form |
| GET | `/api/activity` | Yes | Activity log |
| GET | `/api/feed` | Yes | Activity feed |
| POST | `/api/errors/report` | Optional | Client error reporting |
| GET | `/api/csrf-token` | No | Get CSRF token |
| GET | `/api/notes` | Yes | User notes |
| GET | `/api/schedule` | Yes | Study schedule |
| GET | `/api/library` | No | Resource library |
| GET | `/api/analytics` | Yes | Performance analytics |
| GET | `/api/career` | Yes | Career analytics |
| GET | `/api/portfolio` | Yes | User portfolio |
| POST | `/api/copilot/assist` | Yes | AI copilot assistance |
| GET | `/api/monitoring` | Admin | Enhanced monitoring |

---

## Rate Limiting

| Route Group | Limit |
|-------------|-------|
| `/api/auth` | Auth-specific limiter |
| `/api/ai`, `/api/ai-features` | AI endpoint limiter |
| `/api/payment` | Payment endpoint limiter |
| `/api/jobs` | Jobs endpoint limiter |
| `/api/admin` | Admin endpoint limiter |
| `/api/*` (default) | General rate limiter |

## Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## CSRF Protection
For cookie-based endpoints, include the CSRF token:
1. `GET /api/csrf-token` → returns `{ csrfToken: "..." }` and sets `__csrf_token` cookie
2. Include `x-csrf-token` header with the token value on subsequent POST/PUT/DELETE requests
3. Bearer token requests skip CSRF (naturally protected)
