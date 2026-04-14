import React, { useState, Component, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CoinProvider } from './context/CoinContext';
import AIAssistantOrb from './components/AIAssistantOrb';
import LoadingScreen from './components/LoadingScreen';
import { Code2 } from 'lucide-react';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Overview = lazy(() => import('./pages/Overview'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DSAPatterns = lazy(() => import('./pages/DSAPatterns'));
const PatternDetail = lazy(() => import('./pages/PatternDetail'));
const ProblemSolver = lazy(() => import('./pages/ProblemSolver'));
const LanguageRoadmap = lazy(() => import('./pages/LanguageRoadmap'));
const SystemDesignRoadmap = lazy(() => import('./pages/SystemDesignRoadmap'));
const WebDevRoadmap = lazy(() => import('./pages/WebDevRoadmap'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Payment = lazy(() => import('./pages/Payment'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const CreateBlog = lazy(() => import('./pages/CreateBlog'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const About = lazy(() => import('./pages/About'));
const Library = lazy(() => import('./pages/Library'));
const Contact = lazy(() => import('./pages/Contact'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const CheckEmail = lazy(() => import('./pages/VerifyEmail'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const CoinWallet = lazy(() => import('./pages/CoinWallet'));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DSACodeEditor = lazy(() => import('./pages/DSACodeEditor'));
const SQLProblemExplorer = lazy(() => import('./pages/SQLProblemExplorer'));
const SQLCodeEditor = lazy(() => import('./pages/SQLCodeEditor'));
const InterviewPlatform = lazy(() => import('./components/InterviewPlatform'));
const AptitudeHub = lazy(() => import('./pages/AptitudeHub'));
const AptitudePractice = lazy(() => import('./pages/AptitudePractice'));
const AptitudeResults = lazy(() => import('./pages/AptitudeResults'));
const ExamHub = lazy(() => import('./pages/ExamHub'));
const ExamPractice = lazy(() => import('./pages/ExamPractice'));
const ProblemExplorer = lazy(() => import('./pages/ProblemExplorer'));
const QuizArena = lazy(() => import('./pages/QuizArena'));
const AlgorithmPlayground = lazy(() => import('./pages/AlgorithmPlayground'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const TopicLearning = lazy(() => import('./pages/TopicLearning'));
const DSALearningPath = lazy(() => import('./pages/DSALearningPath'));
const DSATopicLearning = lazy(() => import('./pages/DSATopicLearning'));
const TechnicalLearningPath = lazy(() => import('./pages/TechnicalLearningPath'));
const TechnicalTopicLearning = lazy(() => import('./pages/TechnicalTopicLearning'));
const AdvancedLearningPathPage = lazy(() => import('./pages/AdvancedLearningPathPage'));
const HRLearningPath = lazy(() => import('./pages/HRLearningPath'));
const HRTopicLearning = lazy(() => import('./pages/HRTopicLearning'));
const SystemDesignPath = lazy(() => import('./pages/SystemDesignPath'));
const SystemDesignTopicLearning = lazy(() => import('./pages/SystemDesignTopicLearning'));
const SystemDesignSimulator = lazy(() => import('./pages/SystemDesignSimulator'));
const AITutorHub = lazy(() => import('./pages/AITutorHub'));
const CompanyPrep = lazy(() => import('./pages/CompanyPrep'));

const MultiRoundInterview = lazy(() => import('./pages/MultiRoundInterview'));
const InterviewAnalytics = lazy(() => import('./pages/InterviewAnalytics'));
const InterviewHistory = lazy(() => import('./pages/InterviewHistory'));
const InterviewSuite = lazy(() => import('./pages/InterviewSuite'));
const DebuggingInterview = lazy(() => import('./pages/DebuggingInterview'));
const CodeReviewInterview = lazy(() => import('./pages/CodeReviewInterview'));
const CodingPlayground = lazy(() => import('./pages/CodingPlayground'));
const DailyChallengesPage = lazy(() => import('./pages/DailyChallengesPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLibrary = lazy(() => import('./pages/AdminLibrary'));
const JobUpdates = lazy(() => import('./pages/JobUpdates'));
const RealInterview = lazy(() => import('./pages/RealInterview'));
const InterviewScheduler = lazy(() => import('./pages/InterviewScheduler'));
const HRLogin = lazy(() => import('./pages/HRLogin'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const AIInterviewPage = lazy(() => import('./pages/AIInterviewPage'));
const CommunityHub = lazy(() => import('./pages/CommunityHub'));

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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReloadPage = this.handleReloadPage.bind(this);
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
  }
  handleReloadPage() {
    window.location.reload();
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#ef4444', background: '#050507', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20, fontSize: 14, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: 20, borderRadius: 12 }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={this.handleReloadPage} className="btn btn-primary" style={{ marginTop: 24 }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/blog', '/about', '/contact', '/verify-email', '/check-email', '/privacy', '/terms', '/library', '/payment', '/forgot-password', '/reset-password'];
  const isCodeEditorRoute = location.pathname.startsWith('/code-editor') || location.pathname.startsWith('/sql-editor');
  const isAIInterviewRoute = location.pathname === '/ai-interview' || location.pathname === '/company-interview';
  const isVisualizerRoute = location.pathname === '/visualizer';
  const isPlaygroundRoute = location.pathname === '/playground';

  const isSimulatorRoute = location.pathname === '/system-design-sim';

  const isPaymentRoute = location.pathname.startsWith('/payment');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isFullScreenRoute = isCodeEditorRoute || isPaymentRoute || isAIInterviewRoute;
  const isPublicPage = publicPaths.includes(location.pathname);
  const showSidebar = user && !isPublicPage;
  const hideNavbar = isPaymentRoute || isAuthRoute || isSimulatorRoute || isPlaygroundRoute || isAIInterviewRoute;
  const isFullBleedCodingRoute = isFullScreenRoute || isVisualizerRoute || isSimulatorRoute || isPlaygroundRoute || isAIInterviewRoute;

  return (
    <div className="app-layout">
      <AIAssistantOrb />
      {showSidebar && !isFullScreenRoute && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className={`main-content ${showSidebar && !isFullScreenRoute ? (sidebarCollapsed ? 'sidebar-collapsed' : '') : 'no-sidebar'}`}>
        {!hideNavbar && !isFullScreenRoute && (
          <Navbar
            hasSidebar={showSidebar}
            onMobileMenuToggle={() => setMobileSidebarOpen(prev => !prev)}
          />
        )}

        <div className={showSidebar && !isFullBleedCodingRoute ? 'page-content' : ''}>
          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/community" element={<CommunityHub />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute><Dashboard /></PrivateRoute>}
            />
            <Route
              path="/overview"
              element={<PrivateRoute><Overview /></PrivateRoute>}
            />
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
            <Route path="/quiz-arena" element={<QuizArena />} />
            <Route path="/code-editor/:problemId" element={<DSACodeEditor />} />
            <Route path="/sql-problems" element={<SQLProblemExplorer />} />
            <Route path="/sql-editor/:problemId" element={<SQLCodeEditor />} />
            <Route path="/visualizer" element={<AlgorithmPlayground />} />
            <Route path="/aptitude" element={<AptitudeHub />} />
            <Route path="/aptitude/practice/:category" element={<AptitudePractice />} />
            <Route path="/aptitude/results" element={<AptitudeResults />} />
            <Route path="/exam-hub" element={<ExamHub />} />
            <Route path="/exam-practice/:examId" element={<ExamPractice />} />
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
            <Route path="/system-design-sim" element={<SystemDesignSimulator />} />
            <Route path="/ai-tutor" element={<AITutorHub />} />
            <Route path="/company-prep" element={<CompanyPrep />} />
            <Route path="/company-interview" element={<PrivateRoute><AIInterviewPage /></PrivateRoute>} />
            <Route path="/ai-interview" element={<PrivateRoute><AIInterviewPage /></PrivateRoute>} />
            <Route path="/interview-hub" element={<Navigate to="/interview-suite" replace />} />
            <Route path="/interview-suite" element={<PrivateRoute><InterviewSuite /></PrivateRoute>} />
            <Route path="/multi-round-interview" element={<PrivateRoute><MultiRoundInterview /></PrivateRoute>} />
            <Route path="/interview-platform" element={<PrivateRoute><InterviewPlatform /></PrivateRoute>} />
            <Route path="/interview-analytics" element={<PrivateRoute><InterviewAnalytics /></PrivateRoute>} />
            <Route path="/interview-history" element={<PrivateRoute><InterviewHistory /></PrivateRoute>} />

            <Route path="/playground" element={<CodingPlayground />} />
            <Route path="/live-coding" element={<PrivateRoute><CodingPlayground /></PrivateRoute>} />
            <Route path="/debugging-interview" element={<PrivateRoute><DebuggingInterview /></PrivateRoute>} />
            <Route path="/code-review-interview" element={<PrivateRoute><CodeReviewInterview /></PrivateRoute>} />
            <Route path="/daily-challenges" element={<DailyChallengesPage />} />
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
            <Route path="/real-interview" element={<PrivateRoute><RealInterview /></PrivateRoute>} />
            <Route path="/interview-scheduler" element={<PrivateRoute><InterviewScheduler /></PrivateRoute>} />
            <Route path="/hr/login" element={<HRLogin />} />
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/library" element={<AdminRoute><AdminLibrary /></AdminRoute>} />

          </Routes>
          </Suspense>
        </div>

        {!showSidebar && !isCodeEditorRoute && !isPaymentRoute && !isAuthRoute && <Footer />}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="text-gradient">
              <Code2 size={24} />
              PrepLoop
            </h3>
            <p>
              Comprehensive interview preparation platform helping engineers land their dream jobs at top tech companies.
            </p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="/#features">Features</a></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul className="footer-links">



              <li><a href="/#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 PrepLoop. All rights reserved. Made with ❤️ for engineers.
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [appReady, setAppReady] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CoinProvider>
            {!appReady && <LoadingScreen onFinished={() => setAppReady(true)} />}
            <Router>
              <AppContent />
            </Router>
          </CoinProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
