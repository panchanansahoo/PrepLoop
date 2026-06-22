import { useState } from 'react';
import ImprovementPlanSimple from '../components/ImprovementPlanSimple';
import ImprovementProgressChart from '../components/ImprovementProgressChart';
import { useImprovementPlan } from '../hooks/useImprovementPlan';
import './ImprovementPlanPage.css';

export default function ImprovementPlanPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const { plan, getStats, getNextMilestone } = useImprovementPlan();

  const stats = plan ? getStats() : null;
  const nextMilestone = plan ? getNextMilestone() : null;

  return (
    <div className="imp-page">
      {/* Header */}
      <div className="imp-header">
        <div className="imp-header-inner">
          <h1>AI Interview Improvement Plan</h1>
          <p>Personalized practice plans based on your interview performance</p>
        </div>
      </div>

      {/* Stats Bar (if plan exists) */}
      {stats && (
        <div className="imp-stats-bar">
          <div className="imp-stats-inner">
            <div className="imp-stats-grid">
              <div>
                <div className="imp-stat-label">Current Day</div>
                <div className="imp-stat-value">
                  {stats.currentDay}/{stats.totalDays}
                </div>
              </div>
              <div>
                <div className="imp-stat-label">Tasks Completed</div>
                <div className="imp-stat-value">
                  {stats.completedCount}/{stats.totalTasks}
                </div>
              </div>
              <div>
                <div className="imp-stat-label">Overall Progress</div>
                <div className="imp-stat-value">{stats.completionRate}%</div>
              </div>
              <div>
                <div className="imp-stat-label">Today's Progress</div>
                <div className="imp-stat-value">
                  {stats.todaysTasksCompleted}/{stats.todaysTotalTasks}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="imp-tabs">
        <div className="imp-tabs-inner">
          <button
            onClick={() => setActiveTab('plan')}
            className={`imp-tab ${activeTab === 'plan' ? 'imp-tab--active' : ''}`}
          >
            Current Plan
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`imp-tab ${activeTab === 'progress' ? 'imp-tab--active' : ''}`}
          >
            Progress History
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`imp-tab ${activeTab === 'resources' ? 'imp-tab--active' : ''}`}
          >
            Resources
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="imp-content">
        <div className="imp-grid">
          {/* Main Content */}
          <div>
            {activeTab === 'plan' && <ImprovementPlanSimple />}
            
            {activeTab === 'progress' && (
              <div className="imp-section">
                <ImprovementProgressChart />
                
                {/* Additional Stats */}
                {plan && (
                  <div className="imp-card" style={{ marginTop: '1.5rem' }}>
                    <h3>Plan Details</h3>
                    <div>
                      <div className="imp-detail-row">
                        <span className="imp-detail-label">Plan Created:</span>
                        <span className="imp-detail-value">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="imp-detail-row">
                        <span className="imp-detail-label">Status:</span>
                        <span className="imp-detail-value">{plan.status}</span>
                      </div>
                      <div className="imp-detail-row">
                        <span className="imp-detail-label">Overall Trend:</span>
                        <span className="imp-detail-value">
                          {plan.plan_data.overallTrend.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && plan && (
              <div className="imp-section">
                {/* Recommendations */}
                {plan.plan_data.recommendations && (
                  <div className="imp-card">
                    <h3>AI Recommendations</h3>
                    
                    {plan.plan_data.recommendations.immediate_actions && (
                      <div className="imp-section-mb">
                        <h4>Immediate Actions</h4>
                        <ul className="imp-list">
                          {plan.plan_data.recommendations.immediate_actions.map((action, idx) => (
                            <li key={idx}>
                              <span className="imp-list-icon imp-list-icon--blue">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.plan_data.recommendations.practice_focus && (
                      <div className="imp-section-mb">
                        <h4>Practice Focus</h4>
                        <ul className="imp-list">
                          {plan.plan_data.recommendations.practice_focus.map((focus, idx) => (
                            <li key={idx}>
                              <span className="imp-list-icon imp-list-icon--green">✓</span>
                              <span>{focus}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.plan_data.recommendations.mindset_tips && (
                      <div>
                        <h4>Mindset Tips</h4>
                        <ul className="imp-list">
                          {plan.plan_data.recommendations.mindset_tips.map((tip, idx) => (
                            <li key={idx}>
                              <span className="imp-list-icon imp-list-icon--purple">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Resources */}
                {plan.plan_data.resources && plan.plan_data.resources.length > 0 && (
                  <div className="imp-card" style={{ marginTop: '1.5rem' }}>
                    <h3>Recommended Resources</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {plan.plan_data.resources.map((resource, idx) => (
                        <div key={idx} className="imp-resource">
                          <span className="imp-resource-icon">
                            {resource.type === 'book' ? '📚' :
                             resource.type === 'course' ? '🎓' :
                             resource.type === 'video' ? '🎥' :
                             resource.type === 'practice' ? '💻' : '📄'}
                          </span>
                          <div className="imp-resource-body">
                            <h4>{resource.title}</h4>
                            <p>{resource.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="imp-sidebar">
            {/* Next Milestone */}
            {nextMilestone && (
              <div className="imp-card">
                <h3>Next Milestone</h3>
                <div className="imp-milestone">
                  <div className="imp-milestone-header">
                    <span>🎯</span>
                    <span>Day {nextMilestone.day}</span>
                  </div>
                  <h4>{nextMilestone.title}</h4>
                  <p>{nextMilestone.description}</p>
                  <div className="imp-criteria">
                    <strong>Criteria:</strong>
                    <ul>
                      {nextMilestone.criteria.map((criterion, idx) => (
                        <li key={idx}>• {criterion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="imp-card">
              <h3>Quick Tips</h3>
              <div className="imp-tips">
                <div className="imp-tip">
                  <span>💡</span>
                  <p>Complete tasks daily for best results</p>
                </div>
                <div className="imp-tip">
                  <span>✓</span>
                  <p>Track your progress with notes</p>
                </div>
                <div className="imp-tip">
                  <span>🎯</span>
                  <p>Focus on one area at a time</p>
                </div>
                <div className="imp-tip">
                  <span>🔄</span>
                  <p>Generate new plans as you improve</p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="imp-support">
              <h3>Need Help?</h3>
              <p>Stuck on a task or need guidance? We're here to help!</p>
              <button className="imp-support-btn">Get Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
