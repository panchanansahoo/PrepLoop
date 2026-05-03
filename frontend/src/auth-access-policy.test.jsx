import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readLocal(fileName) {
  return fs.readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

describe('auth access policy', () => {
  it('opens most routes for preview while keeping personal routes private', () => {
    const appSource = readLocal('./App.jsx');

    // Dashboard, community, overview are now open (no PrivateRoute)
    expect(appSource).toContain('path="/dashboard" element={<Dashboard />}');
    expect(appSource).toContain('path="/community" element={<CommunityHub />}');
    expect(appSource).toContain('path="/overview" element={<Overview />}');

    // Public routes remain open
    expect(appSource).toContain('path="/job-updates" element={<JobUpdates />}');
    expect(appSource).toContain('path="/library" element={<Library />}');
    expect(appSource).toContain('path="/problems" element={<ProblemExplorer />}');
    expect(appSource).toContain('path="/blog" element={<BlogList />}');

    // Personal data routes stay behind PrivateRoute
    expect(appSource).toContain('<PrivateRoute><Profile /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><History /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><CoinWallet /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><Payment /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><Settings /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><Analytics /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><ResumeAnalyzer /></PrivateRoute>');
    expect(appSource).toContain('<PrivateRoute><Onboarding /></PrivateRoute>');
  });

  it('has AuthGateProvider and AuthGate wired in', () => {
    const appSource = readLocal('./App.jsx');

    expect(appSource).toContain('AuthGateProvider');
    expect(appSource).toContain('<AuthGate />');
  });

  it('removes guest mode from auth context and auth pages', () => {
    const authContextSource = readLocal('./context/AuthContext.jsx');
    const loginSource = readLocal('./pages/Login.jsx');
    const signupSource = readLocal('./pages/Signup.jsx');

    expect(authContextSource).not.toContain('loginAsGuest');
    expect(authContextSource).not.toContain('isGuest');

    expect(loginSource).not.toContain('Try as Guest');
    expect(loginSource).not.toContain('loginAsGuest');

    expect(signupSource).not.toContain('Try as Guest');
    expect(signupSource).not.toContain('loginAsGuest');
  });
});
