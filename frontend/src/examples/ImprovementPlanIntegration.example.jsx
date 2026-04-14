// ============================================================================
// EXAMPLE: Adding AI Improvement Plan to Your Existing App
// ============================================================================

// ----------------------------------------------------------------------------
// 1. UPDATE YOUR ROUTER (App.jsx or Routes.jsx)
// ----------------------------------------------------------------------------

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ImprovementPlanPage from './pages/ImprovementPlanPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* ADD THIS: Improvement Plan route */}
        <Route path="/improvement-plan" element={<ImprovementPlanPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// ----------------------------------------------------------------------------
// 2. ADD WIDGET TO DASHBOARD (Dashboard.jsx)
// ----------------------------------------------------------------------------

import ImprovementPlanWidget from '../components/ImprovementPlanWidget';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsWidget />
      <ActivityWidget />
      
      {/* ADD THIS: Improvement Plan widget */}
      <ImprovementPlanWidget />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. ADD NOTIFICATION TO LAYOUT (Layout.jsx)
// ----------------------------------------------------------------------------

import ImprovementPlanNotification from '../components/ImprovementPlanNotification';

function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
      
      {/* ADD THIS: Daily notification */}
      <ImprovementPlanNotification />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. LINK FROM INTERVIEW RESULTS
// ----------------------------------------------------------------------------

import { improvementPlan } from '../api/aiService';

function InterviewResults({ sessionId }) {
  const navigate = useNavigate();

  const handleGeneratePlan = async () => {
    await improvementPlan.generate({ sessionIds: [sessionId] });
    navigate('/improvement-plan');
  };

  return (
    <button onClick={handleGeneratePlan}>
      Get Improvement Plan
    </button>
  );
}

// ----------------------------------------------------------------------------
// 5. CUSTOM COMPONENT USING HOOK
// ----------------------------------------------------------------------------

import { useImprovementPlan } from '../hooks/useImprovementPlan';

function CustomPlanView() {
  const { plan, generate, completeTask, getStats } = useImprovementPlan();

  if (!plan) {
    return <button onClick={() => generate({ timeframe: 7 })}>Generate</button>;
  }

  const stats = getStats();

  return (
    <div>
      <p>Day {stats.currentDay}/{stats.totalDays}</p>
      <p>{stats.completionRate}% Complete</p>
    </div>
  );
}
