import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readLocal(fileName) {
  return fs.readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

describe('auth access policy', () => {
  it('keeps dashboard/job-updates/library/problem explorer/blog public while protecting payment and profile routes', () => {
    const appSource = readLocal('./App.jsx');

    // Public routes (no PrivateRoute wrapper)
    expect(appSource).toContain('path="/dashboard"');
    expect(appSource).toContain('element={<Dashboard />}');

    expect(appSource).toContain('path="/job-updates" element={<JobUpdates />}');
    expect(appSource).toContain('path="/library" element={<Library />}');
    expect(appSource).toContain('path="/problems" element={<ProblemExplorer />}');
    expect(appSource).toContain('path="/blog" element={<BlogList />}');
    expect(appSource).toContain('path="/community" element={<CommunityHub />}');
    expect(appSource).toContain('path="/exam-hub" element={<ExamHub />}');
    expect(appSource).toContain('path="/exam-practice/:examId" element={<ExamPractice />}');
    expect(appSource).toContain('path="/problems/:id"');
    expect(appSource).toContain('element={<ProblemSolver />}');

    // Protected routes (wrapped in PrivateRoute)
    expect(appSource).toContain('element={<PrivateRoute><Payment /></PrivateRoute>}');
    expect(appSource).toContain('element={<PrivateRoute><Profile /></PrivateRoute>}');
    expect(appSource).toContain('element={<PrivateRoute><Onboarding /></PrivateRoute>}');
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
