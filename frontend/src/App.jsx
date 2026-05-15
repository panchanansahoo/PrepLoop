import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CoinProvider } from './context/CoinContext';
import { lazyWithRecovery } from './utils/lazyWithRecovery';
import LoadingScreen from './components/LoadingScreen';
import RouteLoadingSkeleton from './components/RouteLoadingSkeleton';
import AppFooter from './components/AppFooter';

import performanceMonitor from './utils/performanceMonitor';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

import { useToast, ToastContainer } from './hooks/useToast';

const AIAssistantOrb = lazyWithRecovery(() => import('./components/AIAssistantOrb'));

const Home = lazyWithRecovery(() => import('./pages/Home'));
const Login = lazyWithRecovery(() => import('./pages/Login'));
const Signup = lazyWithRecovery(() => import('./pages/Signup'));
const Overview = lazyWithRecovery(() => import('./pages/Overview'));
const Dashboard = lazyWithRecovery(() => import('./pages/Dashboard'));
const DSAPatterns = lazyWithRecovery(() => import('./pages/DSAPatterns'));
const PatternDetail = lazyWithRecovery(() => import('./pages/PatternDetail'));
const ProblemSolver = lazyWithRecovery(() => import('./pages/ProblemSolver'));
const LanguageRoadmap = lazyWithRecovery(() => import('./pages/LanguageRoadmap'));
const SystemDesignRoadmap = lazyWithRecovery(() => import('./pages/SystemDesignRoadmap'));
const WebDevRoadmap = lazyWithRecovery(() => import('./pages/WebDevRoadmap'));
const Pricing = lazyWithRecovery(() => import('./pages/Pricing'));
const Payment = lazyWithRecovery(() => import('./pages/Payment'));
const BlogList = lazyWithRecovery(() => import('./pages/BlogList'));
const BlogPost = lazyWithRecovery(() => import('./pages/BlogPost'));
const CreateBlog = lazyWithRecovery(() => import('./pages/CreateBlog'));
const PrivacyPolicy = lazyWithRecovery(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRecovery(() => import('./pages/TermsOfService'));
const About = lazyWithRecovery(() => import('./pages/About'));
const Library = lazyWithRecovery(() => import('./pages/Library'));
const Contact = lazyWithRecovery(() => import('./pages/Contact'));
const VerifyEmailPage = lazyWithRecovery(() => import('./pages/VerifyEmailPage'));
const CheckEmail = lazyWithRecovery(() => import('./pages/VerifyEmail'));
const Onboarding = lazyWithRecovery(() => import('./pages/Onboarding'));
const Profile = lazyWithRecovery(() => import('./pages/Profile'));
const History = lazyWithRecovery(() => import('./pages/History'));
const CoinWallet = lazyWithRecovery(() => import('./pages/CoinWallet'));
const ResumeAnalyzer = lazyWithRecovery(() => import('./pages/ResumeAnalyzer'));
const Analytics = lazyWithRecovery(() => import('./pages/Analytics'));
const Settings = lazyWithRecovery(() => import('./pages/Settings'));
const ForgotPassword = lazyWithRecovery(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRecovery(() => import('./pages/ResetPassword'));
const DSACodeEditor = lazyWithRecovery(() => import('./pages/DSACodeEditor'));
const SQLProblemExplorer = lazyWithRecovery(() => import('./pages/SQLProblemExplorer'));
const SQLCodeEditor = lazyWithRecovery(() => import('./pages/SQLCodeEditor'));
const InterviewPlatform = lazyWithRecovery(() => import('./components/InterviewPlatform'));
const AptitudeHub = lazyWithRecovery(() => import('./pages/AptitudeHub'));
const AptitudePractice = lazyWithRecovery(() => import('./pages/AptitudePractice'));
const AptitudeResults = lazyWithRecovery(() => import('./pages/AptitudeResults'));
const ExamHub = lazyWithRecovery(() => import('./pages/ExamHub'));
const ExamPractice = lazyWithRecovery(() => import('./pages/ExamPractice'));
const ProblemExplorer = lazyWithRecovery(() => import('./pages/ProblemExplorer'));
const QuizArena = lazyWithRecovery(() => import('./pages/QuizArena'));
const AlgorithmPlayground = lazyWithRecovery(() => import('./pages/AlgorithmPlayground'));
const LearningPath = lazyWithRecovery(() => import('./pages/LearningPath'));
const TopicLearning = lazyWithRecovery(() => import('./pages/TopicLearning'));
const DSALearningPath = lazyWithRecovery(() => import('./pages/DSALearningPath'));
const DSATopicLearning = lazyWithRecovery(() => import('./pages/DSATopicLearning'));
const TechnicalLearningPath = lazyWithRecovery(() => import('./pages/TechnicalLearningPath'));
const TechnicalTopicLearning = lazyWithRecovery(() => import('./pages/TechnicalTopicLearning'));
const AdvancedLearningPathPage = lazyWithRecovery(() => import('./pages/AdvancedLearningPathPage'));
const HRLearningPath = lazyWithRecovery(() => import('./pages/HRLearningPath'));
const HRTopicLearning = lazyWithRecovery(() => import('./pages/HRTopicLearning'));
const SystemDesignPath = lazyWithRecovery(() => import('./pages/SystemDesignPath'));
const SystemDesignTopicLearning = lazyWithRecovery(() => import('./pages/SystemDesignTopicLearning'));
const SystemDesignSimulator = lazyWithRecovery(() => import('./pages/SystemDesignSimulator'));
const CompanyPrep = lazyWithRecovery(() => import('./pages/CompanyPrep'));

const MultiRoundInterview = lazyWithRecovery(() => import('./pages/MultiRoundInterview'));
const InterviewAnalytics = lazyWithRecovery(() => import('./pages/InterviewAnalytics'));
const InterviewHistory = lazyWithRecovery(() => import('./pages/InterviewHistory'));
const InterviewSuite = lazyWithRecovery(() => import('./pages/InterviewSuite'));
const DebuggingInterview = lazyWithRecovery(() => import('./pages/DebuggingInterview'));
const CodeReviewInterview = lazyWithRecovery(() => import('./pages/CodeReviewInterview'));
const CodingPlayground = lazyWithRecovery(() => import('./pages/CodingPlayground'));
const DailyChallengesPage = lazyWithRecovery(() => import('./pages/DailyChallengesPage'));
const AdminDashboard = lazyWithRecovery(() => import('./pages/AdminDashboard'));
const AdminLibrary = lazyWithRecovery(() => import('./pages/AdminLibrary'));
const JobUpdates = lazyWithRecovery(() => import('./pages/JobUpdates'));
const AIJobCopilot = lazyWithRecovery(() => import('./pages/AIJobCopilot'));
const HRLogin = lazyWithRecovery(() => import('./pages/HRLogin'));
const HRDashboard = lazyWithRecovery(() => import('./pages/HRDashboard'));
const AIInterviewPage = lazyWithRecovery(() => import('./pages/AIInterviewPage'));
const SimpleVoiceTest = lazyWithRecovery(() => import('./pages/SimpleVoiceTest'));
const CommunityHub = lazyWithRecovery(() => import('./pages/CommunityHub'));
const ImprovementPlanPage = lazyWithRecovery(() => import('./pages/ImprovementPlanPage'));
const NotFound = lazyWithRecovery(() => import('./pages/NotFound'));

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return children;
}

function ProblemRedirect() {
  const { id } = useParams();
  return <Navigate to={`/code-editor/${id}`} replace />;
}

// ErrorBoundary imported from GlobalErrorBoundary (premium recovery UI)

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  // Make toast globally available for legacy code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.toast = toast;
    }
  }, [toast]);

  // Global Ctrl+K / Cmd+K to open command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      // ? key opens shortcuts (only when not typing in an input)
      if (e.key === '?' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Initialize TTS Service Worker
  // useServiceWorkerTTS();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    if (location.pathname === '/visualizer' || location.pathname === '/system-design-sim' || location.pathname === '/playground') {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  // Reset mobile sidebar state when leaving mobile viewport.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when mobile sidebar drawer is open.
  useEffect(() => {
    const isMobileViewport = window.innerWidth <= 768;

    if (mobileSidebarOpen && isMobileViewport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  // Public pages that don't show sidebar
  const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/pricing', '/blog', '/about', '/contact', '/verify-email', '/check-email', '/privacy', '/terms', '/library', '/payment', '/forgot-password', '/reset-password', '/copilot']);
  const isCodeEditorRoute = location.pathname.startsWith('/code-editor') || location.pathname.startsWith('/sql-editor');
  const isAIInterviewRoute = location.pathname === '/ai-interview' || location.pathname === '/company-interview';
  const isVisualizerRoute = location.pathname === '/visualizer';
  const isPlaygroundRoute = location.pathname === '/playground';

  const isSimulatorRoute = location.pathname === '/system-design-sim';

  const isPaymentRoute = location.pathname.startsWith('/payment');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isPublicPage = PUBLIC_PATHS.has(location.pathname) || location.pathname.startsWith('/blog/');

  // Routes that should NOT have any padding/margins (full viewport)
  const isFullBleedRoute = isCodeEditorRoute || isPlaygroundRoute || isVisualizerRoute || isSimulatorRoute || isAIInterviewRoute || isPaymentRoute;

  // Routes that should show the global sidebar
  const showSidebar = !isPublicPage && !isAuthRoute && !isAIInterviewRoute && !isSimulatorRoute && !isVisualizerRoute;

  // Routes that should hide the top navbar
  const hideNavbar = isPaymentRoute || isAuthRoute || isSimulatorRoute || isPlaygroundRoute || isAIInterviewRoute || isCodeEditorRoute;

  // For backward compatibility with existing class logic
  const isFullScreenRoute = isAIInterviewRoute || isPaymentRoute; 


  return (
    <div className="app-layout">
      {/* <SkipLink /> */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* <OfflineBanner /> */}
      <Suspense fallback={null}><AIAssistantOrb /></Suspense>
      {/* <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} /> */}
      {/* <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} /> */}
      {showSidebar && !isFullScreenRoute && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={`main-content ${showSidebar ? (sidebarCollapsed ? 'sidebar-collapsed' : '') : 'no-sidebar'}`}>
        {!hideNavbar && (
          <Navbar
            hasSidebar={showSidebar}
            onMobileMenuToggle={() => setMobileSidebarOpen(prev => !prev)}
            onOpenCommandPalette={() => setCmdOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
        )}

        <div className={showSidebar && !isFullBleedRoute ? 'page-content' : ''} id="main-content">

          <RouteErrorBoundary routeName="page">
            <Suspense fallback={<RouteLoadingSkeleton />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/community" element={<PrivateRoute><CommunityHub /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/overview" element={<PrivateRoute><Overview /></PrivateRoute>} />
                <Route path="/roadmap/language" element={<LanguageRoadmap />} />
                <Route path="/roadmap/system-design" element={<SystemDesignRoadmap />} />
                <Route path="/roadmap/web-dev" element={<WebDevRoadmap />} />
                <Route path="/patterns/:id" element={<PatternDetail />} />
                <Route
                  path="/problems/:id"
                  element={<PrivateRoute><ProblemSolver /></PrivateRoute>}
                />
                <Route
                  path="/problem/:id"
                  element={<ProblemRedirect />}
                />

                <Route path="/problems" element={<ProblemExplorer />} />
                <Route path="/quiz-arena" element={<PrivateRoute><QuizArena /></PrivateRoute>} />
                <Route path="/code-editor/:problemId" element={<PrivateRoute><CodingPlayground sidebarCollapsed={sidebarCollapsed} /></PrivateRoute>} />

                <Route path="/sql-problems" element={<SQLProblemExplorer />} />
                <Route path="/sql-editor/:problemId" element={<PrivateRoute><SQLCodeEditor /></PrivateRoute>} />
                <Route path="/visualizer" element={<AlgorithmPlayground />} />
                <Route path="/aptitude" element={<AptitudeHub />} />
                <Route path="/aptitude/practice/:category" element={<AptitudePractice />} />
                <Route path="/aptitude/results" element={<AptitudeResults />} />
                <Route path="/exam-hub" element={<PrivateRoute><ExamHub /></PrivateRoute>} />
                <Route path="/exam-practice/:examId" element={<PrivateRoute><ExamPractice /></PrivateRoute>} />
                <Route path="/learning-path" element={<LearningPath />} />
                <Route path="/advanced-learning-path" element={<AdvancedLearningPathPage />} />
                <Route path="/learning-path/:topicId" element={<TopicLearning />} />
                <Route path="/dsa-path" element={<DSALearningPath />} />
                <Route path="/dsa-path/:topicId" element={<DSATopicLearning />} />
                <Route path="/technical-path" element={<TechnicalLearningPath />} />
                <Route path="/technical-path/:topicId" element={<TechnicalTopicLearning />} />
                <Route path="/hr-path" element={<HRLearningPath />} />
                <Route path="/hr-path/:topicId" element={<HRTopicLearning />} />
                <Route path="/system-design" element={<SystemDesignPath />} />
                <Route path="/system-design/:topicId" element={<SystemDesignTopicLearning />} />
                <Route path="/system-design-sim" element={<PrivateRoute><SystemDesignSimulator /></PrivateRoute>} />
                <Route path="/company-prep" element={<PrivateRoute><CompanyPrep /></PrivateRoute>} />
                <Route path="/company-interview" element={<PrivateRoute><AIInterviewPage /></PrivateRoute>} />
                <Route path="/ai-interview" element={<PrivateRoute><AIInterviewPage /></PrivateRoute>} />
                <Route path="/voice-test" element={<PrivateRoute><SimpleVoiceTest /></PrivateRoute>} />
                <Route path="/interview-hub" element={<Navigate to="/interview-suite" replace />} />
                <Route path="/interview" element={<Navigate to="/interview-suite" replace />} />
                <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
                <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
                <Route path="/interview-suite" element={<PrivateRoute><InterviewSuite /></PrivateRoute>} />
                <Route path="/multi-round-interview" element={<PrivateRoute><MultiRoundInterview /></PrivateRoute>} />
                <Route path="/interview-platform" element={<PrivateRoute><InterviewPlatform /></PrivateRoute>} />
                <Route path="/interview-analytics" element={<PrivateRoute><InterviewAnalytics /></PrivateRoute>} />
                <Route path="/interview-history" element={<PrivateRoute><InterviewHistory /></PrivateRoute>} />
                <Route path="/improvement-plan" element={<PrivateRoute><ImprovementPlanPage /></PrivateRoute>} />

                <Route path="/playground" element={<PrivateRoute><CodingPlayground sidebarCollapsed={sidebarCollapsed} /></PrivateRoute>} />

                <Route path="/live-coding" element={<PrivateRoute><CodingPlayground sidebarCollapsed={sidebarCollapsed} /></PrivateRoute>} />

                <Route path="/debugging-interview" element={<PrivateRoute><DebuggingInterview /></PrivateRoute>} />
                <Route path="/code-review-interview" element={<PrivateRoute><CodeReviewInterview /></PrivateRoute>} />
                <Route path="/daily-challenges" element={<PrivateRoute><DailyChallengesPage /></PrivateRoute>} />
                <Route path="/job-updates" element={<PrivateRoute><JobUpdates /></PrivateRoute>} />

                <Route path="/pricing" element={<Pricing />} />
                <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
                <Route path="/library" element={<Library />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/new" element={<PrivateRoute><CreateBlog /></PrivateRoute>} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/copilot" element={<AIJobCopilot />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/check-email" element={<CheckEmail />} />
                <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                <Route path="/wallet" element={<PrivateRoute><CoinWallet /></PrivateRoute>} />
                <Route path="/resume-analyzer" element={<PrivateRoute><ResumeAnalyzer /></PrivateRoute>} />
                <Route path="/dashboard/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                <Route path="/dashboard/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                <Route path="/dashboard/history" element={<PrivateRoute><History /></PrivateRoute>} />
                <Route path="/hr/login" element={<HRLogin />} />
                <Route path="/hr/dashboard" element={<PrivateRoute><HRDashboard /></PrivateRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/library" element={<AdminRoute><AdminLibrary /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />

              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </div>

        {!showSidebar && !isCodeEditorRoute && !isPaymentRoute && !isAuthRoute && <AppFooter />}
      </div>
    </div>
  );
}



function App() {
  const [appReady, setAppReady] = useState(false);

  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CoinProvider>
            {!appReady && <LoadingScreen onFinished={() => setAppReady(true)} />}
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppContent />
            </Router>
          </CoinProvider>
        </AuthProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
