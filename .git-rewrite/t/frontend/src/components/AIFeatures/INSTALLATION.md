# AI Features Frontend Configuration

## Environment Variables

Create a `.env` file in the frontend root directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Optional: Authentication settings
VITE_AUTH_TOKEN_KEY=auth_token
VITE_AUTH_FALLBACK_KEY=session_token
```

## Usage in Components

The API service automatically reads the `VITE_API_URL` environment variable:

```javascript
import { submitCodeReview, startInterview } from '@/api/aiService';

// Components handle auth token retrieval from localStorage or sessionStorage
```

## Integration Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your backend URL:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Import Components

```javascript
import { AIFeaturesHub } from '@/components/AIFeatures';

function App() {
  return (
    <AIFeaturesHub 
      userId={currentUserId}
      onNavigateHome={() => router.push('/dashboard')}
    />
  );
}
```

### 4. Update Router/Navigation

Add route to your router configuration:

```javascript
// React Router example
import { AIFeaturesHub } from '@/components/AIFeatures';

const router = createBrowserRouter([
  {
    path: '/ai-features',
    element: <AIFeaturesHub 
      userId={user?.id}
      onNavigateHome={() => navigate('/dashboard')}
    />
  }
]);
```

## Authentication

The API service expects an authentication token in localStorage or sessionStorage:

```javascript
// After user login, store token
localStorage.setItem('auth_token', response.token);

// Or use sessionStorage for temporary sessions
sessionStorage.setItem('auth_token', response.token);
```

The service automatically includes this in request headers:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## API Error Handling

The service provides helper functions for error handling:

```javascript
import { formatErrorMessage, isAuthError } from '@/api/aiService';

try {
  const result = await submitCodeReview(problemId, code, language);
} catch (error) {
  const message = formatErrorMessage(error);
  console.error(message);
  
  if (isAuthError(error)) {
    // Redirect to login
    navigate('/login');
  }
}
```

## Component Props

### AIFeaturesHub

```typescript
interface AIFeaturesHubProps {
  userId: string | number;        // Current user ID
  onNavigateHome: () => void;      // Callback to navigate back to dashboard
}
```

### CodeReviewComponent

```typescript
interface CodeReviewComponentProps {
  problemId: number;              // Problem ID for context
  onReviewSubmitted?: (result) => void;  // Optional callback after review
}
```

### InterviewComponent

```typescript
interface InterviewComponentProps {
  userId: string | number;        // Current user ID
  onInterviewCompleted?: (result) => void;  // Optional callback after completion
}
```

### PerformanceAnalyticsComponent

No required props - displays user's own data based on authentication.

## Styling

All components use Tailwind CSS v3+. Ensure your Tailwind configuration is present:

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Icons

Components use Lucide React icons. These are already installed:

```bash
npm install lucide-react
```

## TypeScript Support

Import types from components:

```typescript
import type { CodeReviewResult } from '@/api/aiService';

interface MyComponentProps {
  onReview?: (result: CodeReviewResult) => void;
}
```

## Testing Components

### Mock API Service

```javascript
// __mocks__/aiService.js
export const submitCodeReview = jest.fn().mockResolvedValue({
  overall_score: 8.5,
  scores: { correctness: 9, efficiency: 8, readability: 9, best_practices: 8 },
  performance_level: 'Excellent',
  feedback: {
    strengths: ['Clean code', 'Good variable names'],
    improvements: ['Add error handling'],
    suggestions: ['Consider caching']
  }
});
```

### Component Testing

```javascript
import { render, screen } from '@testing-library/react';
import CodeReviewComponent from '@/components/AIFeatures/CodeReviewComponent';

test('renders code review component', () => {
  render(<CodeReviewComponent problemId={1} />);
  expect(screen.getByText(/AI Code Review/i)).toBeInTheDocument();
});
```

## Performance Optimization

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

const AIFeaturesHub = lazy(() => import('@/components/AIFeatures'));

export function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AIFeaturesHub userId={user.id} onNavigateHome={handleHome} />
    </Suspense>
  );
}
```

### Component Virtualization

For large lists (interviews, reviews), consider virtualization:

```javascript
import { FixedSizeList } from 'react-window';

// Use for long lists of interview history
```

## Common Issues

### 1. CORS Errors

Ensure backend CORS is configured:
```javascript
// Backend Express setup
app.use(cors({ origin: 'http://localhost:3000' }));
```

### 2. Auth Token Not Found

Ensure user is logged in before accessing AI features:
```javascript
if (!localStorage.getItem('auth_token')) {
  navigate('/login');
  return;
}
```

### 3. API URL Not Configured

Check `.env` file exists with `VITE_API_URL` set.

## Deployment

### Build for Production

```bash
npm run build
```

### Production Environment Variables

Update `.env.production`:
```env
VITE_API_URL=https://api.production.com/api
```

The build process automatically uses the correct environment variables.
