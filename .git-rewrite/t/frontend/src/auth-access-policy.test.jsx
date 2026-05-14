import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readLocal(fileName) {
  return fs.readFileSync(new URL(fileName, import.meta.url), 'utf8');
}

describe('auth access policy', () => {
  it('allows guests to browse feature pages (no PrivateRoute wrapper)', () => {
    const appSource = readLocal('./App.jsx');

    // These pages should be browseable by guests (no PrivateRoute)
    expect(appSource).toContain('path="/dashboard" element={<Dashboard />}');
    expect(appSource).toContain('path="/job-updates" element={<JobUpdates />}');
    expect(appSource).toContain('path="/library" element={<Library />}');
    expect(appSource).toContain('path="/problems" element={<ProblemExplorer />}');
    expect(appSource).toContain('path="/blog" element={<BlogList />}');
    expect(appSource).toContain('path="/community" element={<CommunityHub />}');
    expect(appSource).toContain('path="/quiz-arena" element={<QuizArena />}');
    expect(appSource).toContain('path="/exam-hub" element={<ExamHub />}');
    expect(appSource).toContain('path="/interview-suite" element={<InterviewSuite />}');
    expect(appSource).toContain('path="/resume-analyzer" element={<ResumeAnalyzer />}');
    expect(appSource).toContain('path="/daily-challenges" element={<DailyChallengesPage />}');
    expect(appSource).toContain('path="/problems/:id" element={<ProblemSolver />}');
  });

  it('keeps personal account pages behind PrivateRoute', () => {
    const appSource = readLocal('./App.jsx');

    expect(appSource).toContain('path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>}');
    expect(appSource).toContain('path="/wallet" element={<PrivateRoute><CoinWallet /></PrivateRoute>}');
    expect(appSource).toContain('path="/history" element={<PrivateRoute><History /></PrivateRoute>}');
    expect(appSource).toContain('path="/dashboard/settings" element={<PrivateRoute><Settings /></PrivateRoute>}');
    expect(appSource).toContain('path="/dashboard/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>}');
    expect(appSource).toContain('path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>}');
    expect(appSource).toContain('path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>}');
  });

  it('includes GuestGateModal in the app', () => {
    const appSource = readLocal('./App.jsx');

    expect(appSource).toContain('import GuestGateModal');
    expect(appSource).toContain('<GuestGateModal />');
    expect(appSource).toContain("import './styles/guest-gate.css'");
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
