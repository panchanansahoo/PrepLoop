# PrepLoop Mobile (Android)

A React Native + Expo Android app for the PrepLoop AI interview preparation platform. Connects to the **same existing backend** as the web app — no duplicate data, no duplicate servers.

---

## Architecture Overview

```
PrepLoop/
├── backend/        ← Existing Node.js/Express API (shared)
├── frontend/       ← Existing React web app (unchanged)
└── mobile/         ← 🆕 This React Native app
    ├── App.js
    ├── app.json    (Expo config)
    ├── src/
    │   ├── api/          (Axios calls → existing backend)
    │   ├── context/      (Auth, Theme)
    │   ├── navigation/   (Stack + Tab navigators)
    │   ├── screens/      (All app screens)
    │   ├── components/   (Shared UI components)
    │   ├── hooks/        (useApi, usePaginated)
    │   └── utils/        (theme, constants, storage)
    └── assets/
```

---

## Features

| Feature | Screen | Backend Route |
|---------|--------|---------------|
| Login / Signup | `auth/` | `/api/auth/login`, `/api/auth/signup` |
| Dashboard & Stats | `dashboard/` | `/api/user/stats`, `/api/activity` |
| DSA Patterns | `dsa/DSAPatternsScreen` | `/api/dsa/patterns` |
| DSA Problems | `dsa/DSAProblemScreen` | `/api/dsa/problems` |
| AI Interview (Chat) | `interview/AIInterviewScreen` | `/api/interview/*` |
| Interview History | `interview/InterviewHistoryScreen` | `/api/interview/history` |
| Job Board | `jobs/JobsScreen` | `/api/jobs` |
| Profile & Edit | `profile/ProfileScreen` | `/api/user/profile` |
| Coin Wallet | `wallet/CoinWalletScreen` | `/api/coins/*` |
| Forgot Password | `auth/ForgotPasswordScreen` | `/api/auth/forgot-password` |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your Android device (or Android Emulator)

### Setup

```bash
# 1. Enter the mobile directory
cd Preploop/mobile

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your backend URL

# 4. Start Expo dev server
npm start
# or for Android specifically:
npm run android
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Your PrepLoop backend URL | `https://preploop.azurewebsites.net` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Same as `VITE_SUPABASE_URL` in frontend `.env` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Same as `VITE_SUPABASE_ANON_KEY` in frontend `.env` |

> **Local development**: Android Emulator uses `http://10.0.2.2:5000` to reach localhost. Physical device needs your machine's local IP (e.g. `http://192.168.1.x:5000`).

---

## Project Structure

### `src/api/`
All API calls go through **`apiClient.js`** — an Axios instance that:
- Reads `EXPO_PUBLIC_API_URL` as the base URL
- Attaches the JWT Bearer token from SecureStore on every request
- Auto-refreshes the token on 401 responses and retries the original request

| File | Covers |
|------|--------|
| `apiClient.js` | Axios instance, interceptors |
| `authApi.js` | Login, signup, logout, forgot password, refresh |
| `userApi.js` | Profile get/update, activity, stats |
| `dsaApi.js` | Patterns, problems, submit, daily challenge, notes |
| `interviewApi.js` | Session start/message/end, history, feedback, analytics |
| `jobsApi.js` | Job listings, search |
| `coinsApi.js` | Balance, transaction history |

### `src/context/`
- **`AuthContext.js`** — Provides `user`, `login`, `signup`, `logout`, `refreshSession`. Tokens persisted in `expo-secure-store`.
- **`ThemeContext.js`** — Thin wrapper over `utils/theme.js` token exports.

### `src/navigation/`
- **`AppNavigator.js`** — Root: shows `AuthNavigator` when logged out, `MainNavigator` when logged in.
- **`AuthNavigator.js`** — Stack: Login → Signup → ForgotPassword.
- **`MainNavigator.js`** — Bottom Tab: Home, DSA, Interview, Jobs, Profile (each tab has its own Stack navigator for nested screens).

### `src/components/`
| Component | Purpose |
|-----------|---------|
| `Button` | Gradient primary, outline, ghost, danger variants + loading state |
| `Card` | Dark surface card with optional elevation shadow + accent left border |
| `LoadingSpinner` | Centered `ActivityIndicator` with optional message, `fullScreen` mode |
| `ErrorMessage` | Red-tinted error block with optional retry button |
| `StatCard` | Dashboard metric tile — emoji icon, big number, label |
| `EmptyState` | Full-center illustration with optional CTA button |
| `TagBadge` | Pill badge — auto-colors easy/medium/hard by difficulty |

### `src/utils/`
- **`theme.js`** — All design tokens: `colors`, `typography`, `spacing`, `borderRadius`, `shadows`
- **`constants.js`** — Route names, storage keys, interview types, DSA categories, difficulty colors
- **`storage.js`** — `expo-secure-store` wrapper for token/user persistence with silent error handling

---

## Building for Android

### Development APK (Expo Go)
```bash
npm start
# Scan QR code with Expo Go app
```

### Standalone APK (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build Android APK
eas build --platform android --profile preview
```

### Local Build with Android Studio
```bash
# Generate native Android project
npx expo run:android
```

---

## Design System

The app uses a consistent dark theme:

| Token | Value | Use |
|-------|-------|-----|
| `colors.bg` | `#0F0F1A` | Screen backgrounds |
| `colors.bgCard` | `#1A1A2E` | Cards, modals |
| `colors.primary` | `#6C63FF` | CTAs, active states, links |
| `colors.secondary` | `#4ECDC4` | Accent, HR interview type |
| `colors.success` | `#2ECC71` | Easy difficulty, positive |
| `colors.warning` | `#F1C40F` | Medium difficulty, coins |
| `colors.error` | `#E74C3C` | Hard difficulty, errors |
| `colors.textPrimary` | `#FFFFFF` | Headings, primary content |
| `colors.textSecondary` | `#A0ADB8` | Labels, descriptions |

---

## Key Design Decisions

1. **Shares the backend** — No separate mobile API. All requests go to the same Express server the web app uses. Token handling is compatible (same JWT format).

2. **SecureStore over AsyncStorage** — Tokens are stored in `expo-secure-store` (Android Keystore / iOS Keychain) for security. Falls back silently in web/simulator environments.

3. **Offline-tolerant auth init** — On launch, the cached user from SecureStore is shown immediately; the profile is re-synced silently from the backend. The UI is never blocked waiting for network.

4. **`Promise.allSettled` for dashboard** — Dashboard loads stats, coins, and daily challenge in parallel. A single failed endpoint doesn't blank the whole screen.

5. **Chat-based interview** — The AI interview is text-first (voice can be added later via Expo AV). The `phase` state machine (starting → chat → feedback) keeps the UI clean.
