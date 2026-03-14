import React, { useState, Component, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/Overview';
import Dashboard from './pages/Dashboard';
import DSAPatterns from './pages/DSAPatterns';
import PatternDetail from './pages/PatternDetail';
import ProblemSolver from './pages/ProblemSolver';








import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import CreateBlog from './pages/CreateBlog';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import About from './pages/About';
import Library from './pages/Library';
import Contact from './pages/Contact';
import VerifyEmail from './pages/VerifyEmail';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


import DSACodeEditor from './pages/DSACodeEditor';
import SQLProblemExplorer from './pages/SQLProblemExplorer';
import SQLCodeEditor from './pages/SQLCodeEditor';

import InterviewPlatform from './components/InterviewPlatform';

import AptitudeHub from './pages/AptitudeHub';
import AptitudePractice from './pages/AptitudePractice';
import AptitudeResults from './pages/AptitudeResults';
import ProblemExplorer from './pages/ProblemExplorer';
import AlgorithmPlayground from './pages/AlgorithmPlayground';
import LearningPath from './pages/LearningPath';
import TopicLearning from './pages/TopicLearning';
import DSALearningPath from './pages/DSALearningPath';
import DSATopicLearning from './pages/DSATopicLearning';
import TechnicalLearningPath from './pages/TechnicalLearningPath';
import TechnicalTopicLearning from './pages/TechnicalTopicLearning';
import HRLearningPath from './pages/HRLearningPath';
import HRTopicLearning from './pages/HRTopicLearning';
import SystemDesignPath from './pages/SystemDesignPath';
import SystemDesignTopicLearning from './pages/SystemDesignTopicLearning';
import SystemDesignSimulator from './pages/SystemDesignSimulator';
import AITutorHub from './pages/AITutorHub';
import CompanyPrep from './pages/CompanyPrep';
import CompanyInterview from './pages/CompanyInterview';
import MultiRoundInterview from './pages/MultiRoundInterview';
import InterviewAnalytics from './pages/InterviewAnalytics';
import InterviewHistory from './pages/InterviewHistory';

import CodingPlayground from './pages/CodingPlayground';
import DailyChallengesPage from './pages/DailyChallengesPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Code2 } from 'lucide-react';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function ProblemRedirect() {
  const { id } = useParams();
  return <Navigate to={`/code-editor/${id}`} replace />;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#ef4444', background: '#050507', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20, fontSize: 14, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: 20, borderRadius: 12 }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 24 }}>
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
    if (location.pathname === '/visualizer' || location.pathname === '/system-design-sim') {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  // Public pages that don't show sidebar
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/blog', '/about', '/contact', '/verify-email', '/dsa-patterns', '/privacy', '/terms', '/library', '/payment', '/forgot-password', '/reset-password'];
  const isCodeEditorRoute = location.pathname.startsWith('/code-editor') || location.pathname.startsWith('/sql-editor');
  const isVisualizerRoute = location.pathname === '/visualizer';
  const isPlaygroundRoute = location.pathname === '/playground';
  const isSimulatorRoute = location.pathname === '/system-design-sim';

  const isPaymentRoute = location.pathname.startsWith('/payment');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isFullScreenRoute = isCodeEditorRoute || isPlaygroundRoute || isPaymentRoute;
  const isPublicPage = publicPaths.includes(location.pathname);
  const showSidebar = user && !isPublicPage;
  const hideNavbar = isPaymentRoute || isAuthRoute || isSimulatorRoute;
  const isFullBleedCodingRoute = isFullScreenRoute || isVisualizerRoute || isSimulatorRoute;

  return (
    <div className="app-layout">
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute><Dashboard /></PrivateRoute>}
            />
            <Route
              path="/overview"
              element={<PrivateRoute><Overview /></PrivateRoute>}
            />
            <Route path="/dsa-patterns" element={<DSAPatterns />} />
            <Route path="/patterns/:id" element={<PatternDetail />} />
            <Route
              path="/problems/:id"
              element={<PrivateRoute><ProblemSolver /></PrivateRoute>}
            />
            <Route
              path="/problem/:id"
              element={<ProblemRedirect />}
            />











            <Route path="/gamification" element={<Navigate to="/profile" replace />} />
            <Route path="/problems" element={<ProblemExplorer />} />
            <Route path="/code-editor/:problemId" element={<DSACodeEditor />} />
            <Route path="/sql-problems" element={<SQLProblemExplorer />} />
            <Route path="/sql-editor/:problemId" element={<SQLCodeEditor />} />
            <Route path="/visualizer" element={<AlgorithmPlayground />} />
            <Route path="/aptitude" element={<AptitudeHub />} />
            <Route path="/aptitude/practice/:category" element={<AptitudePractice />} />
            <Route path="/aptitude/results" element={<AptitudeResults />} />
            <Route path="/learning-path" element={<LearningPath />} />
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
            <Route path="/company-interview" element={<CompanyInterview />} />
            <Route path="/multi-round-interview" element={<PrivateRoute><MultiRoundInterview /></PrivateRoute>} />
            <Route path="/interview-platform" element={<PrivateRoute><InterviewPlatform /></PrivateRoute>} />
            <Route path="/interview-analytics" element={<PrivateRoute><InterviewAnalytics /></PrivateRoute>} />
            <Route path="/interview-history" element={<PrivateRoute><InterviewHistory /></PrivateRoute>} />

            <Route path="/playground" element={<CodingPlayground />} />
            <Route path="/daily-challenges" element={<DailyChallengesPage />} />

            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/library" element={<Library />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/new" element={<PrivateRoute><CreateBlog /></PrivateRoute>} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/dashboard/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/dashboard/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            <Route path="/dashboard/history" element={<PrivateRoute><History /></PrivateRoute>} />

          </Routes>
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
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
