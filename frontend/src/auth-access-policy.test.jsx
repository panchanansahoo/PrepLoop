import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readLocal(fileName) {
  return fs.readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

describe('auth access policy', () => {
  it('keeps job-updates/library/problem explorer/blog public while protecting dashboard, community, exams, and problem solver', () => {
    const appSource = readLocal('./App.jsx');

    expect(appSource).toContain('path="/dashboard"');
    expect(appSource).toContain('element={<PrivateRoute><Dashboard /></PrivateRoute>}');

    expect(appSource).toContain('path="/job-updates" element={<JobUpdates />}');
    expect(appSource).toContain('path="/library" element={<Library />}');
    expect(appSource).toContain('path="/problems" element={<ProblemExplorer />}');
    expect(appSource).toContain('path="/blog" element={<BlogList />}');

    expect(appSource).toContain('path="/community" element={<PrivateRoute><CommunityHub /></PrivateRoute>}');
    expect(appSource).toContain('path="/exam-hub" element={<PrivateRoute><ExamHub /></PrivateRoute>}');
    expect(appSource).toContain('path="/exam-practice/:examId" element={<PrivateRoute><ExamPractice /></PrivateRoute>}');
    expect(appSource).toContain('path="/problems/:id"');
    expect(appSource).toContain('element={<PrivateRoute><ProblemSolver /></PrivateRoute>}');
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
