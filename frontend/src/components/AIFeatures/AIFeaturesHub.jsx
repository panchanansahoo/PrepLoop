import { useState } from 'react';
import CodeReviewComponent from './CodeReviewComponent';
import InterviewComponent from './InterviewComponent';
import PerformanceAnalyticsComponent from './PerformanceAnalyticsComponent';
import { Code, MessageSquare, BarChart3, Home } from 'lucide-react';
import LoadingAnimation from '../LoadingAnimation';

const AIFeaturesHub = ({ userId, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProblemId, _setSelectedProblemId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const handleTabChange = (tabId) => {
    setIsLoading(true);
    setLoadingMessage(`Loading ${tabs.find(t => t.id === tabId)?.label}...`);
    
    // Simulate loading time
    setTimeout(() => {
      setActiveTab(tabId);
      setIsLoading(false);
    }, 600);
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      description: 'Welcome to AI Features'
    },
    {
      id: 'code-review',
      label: 'Code Review',
      icon: Code,
      description: 'Get AI feedback on your code'
    },
    {
      id: 'interview',
      label: 'AI Interview',
      icon: MessageSquare,
      description: 'Practice interviews with AI'
    },
    {
      id: 'analytics',
      label: 'Performance',
      icon: BarChart3,
      description: 'View your progress'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab tabs={tabs} onSelectTab={handleTabChange} />;
      case 'code-review':
        return (
          <CodeReviewComponent
            problemId={selectedProblemId || 1}
            onReviewSubmitted={() => {
              // Optional: Handle review submission
            }}
          />
        );
      case 'interview':
        return <InterviewComponent userId={userId} onInterviewCompleted={() => {}} />;
      case 'analytics':
        return <PerformanceAnalyticsComponent />;
      default:
        return <OverviewTab tabs={tabs} onSelectTab={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AI Features</h1>
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <LoadingAnimation variant="default" message={loadingMessage} />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
              {renderContent()}
            </div>
          )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ _tabs, onSelectTab }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AI-Powered Learning
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Master coding and interviewing with personalized AI feedback. Get instant reviews on your code,
          practice with realistic technical interviews, and track your progress.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Code Review Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24 flex items-center justify-center">
            <Code className="w-12 h-12 text-white" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Code Review</h3>
            <p className="text-gray-600 mb-4">
              Submit your code and get comprehensive feedback on correctness, efficiency, readability,
              and best practices. Support for multiple languages.
            </p>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">✓</span> Multi-language support (JS, Python, Java, etc.)
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">✓</span> Detailed scoring across 4 dimensions
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">✓</span> Code snippet suggestions
              </p>
            </div>
            <button
              onClick={() => onSelectTab('code-review')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Start Code Review
            </button>
          </div>
        </div>

        {/* Interview Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-24 flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-white" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Interview Practice</h3>
            <p className="text-gray-600 mb-4">
              Practice different interview types with an intelligent AI interviewer. Get real-time feedback
              and detailed performance analysis after each session.
            </p>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">✓</span> DSA, System Design, Behavioral, Mixed
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">✓</span> Easy, Medium, Hard difficulty levels
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">✓</span> Company-specific scenarios
              </p>
            </div>
            <button
              onClick={() => onSelectTab('interview')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Start Interview
            </button>
          </div>
        </div>

        {/* Performance Analytics Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition md:col-span-2">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-24 flex items-center justify-center">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-gray-600 mb-4">
              Track your progress across all AI features. View detailed statistics, trends, and personalized
              recommendations to improve your skills.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">📊 Detailed Statistics</p>
                <p className="font-semibold text-gray-900">Total attempts, average scores</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">📈 Trend Analysis</p>
                <p className="font-semibold text-gray-900">Category breakdown, progress over time</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">🎯 Recommendations</p>
                <p className="font-semibold text-gray-900">Personalized improvement suggestions</p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab('analytics')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              step: '1',
              title: 'Choose a Feature',
              description: 'Select Code Review, Interview, or Analytics'
            },
            {
              step: '2',
              title: 'Submit Your Work',
              description: 'Provide code or answer interview questions'
            },
            {
              step: '3',
              title: 'AI Analysis',
              description: 'Get comprehensive feedback and scores'
            },
            {
              step: '4',
              title: 'Track Progress',
              description: 'View trends and improve over time'
            }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                {item.step}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Key Benefits</h3>
          <ul className="space-y-3">
            {[
              'Instant feedback on your coding',
              'Practice realistic interview scenarios',
              'Multiple difficulty levels',
              'Detailed performance metrics',
              'Identify improvement areas',
              'Track long-term progress'
            ].map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Supported Features</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-2">Languages (Code Review)</p>
              <p className="text-sm text-gray-600">
                JavaScript, Python, Java, C++, C#, Go, Rust, and more
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-2">Interview Types</p>
              <p className="text-sm text-gray-600">
                DSA, System Design, Behavioral, Mixed
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-2">Difficulty Levels</p>
              <p className="text-sm text-gray-600">
                Easy, Medium, Hard
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-2">Company Focus</p>
              <p className="text-sm text-gray-600">
                Google, Amazon, Meta, Apple, and 100+ more
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesHub;
