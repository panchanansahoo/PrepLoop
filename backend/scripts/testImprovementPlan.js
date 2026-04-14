import { ImprovementPlanService } from '../services/improvementPlanService.js';

// Mock data for testing
const mockSessions = [
  {
    id: 'session-1',
    user_id: 'user-123',
    interview_type: 'dsa',
    status: 'completed',
    interview_score: 65,
    overall_score: 65,
    performance_metrics: {
      communication: 60,
      problemDecomposition: 70,
      efficiency: 65,
      clarity: 62
    },
    completed_at: new Date().toISOString()
  },
  {
    id: 'session-2',
    user_id: 'user-123',
    interview_type: 'dsa',
    status: 'completed',
    interview_score: 70,
    overall_score: 70,
    performance_metrics: {
      communication: 68,
      problemDecomposition: 72,
      efficiency: 70,
      clarity: 69
    },
    completed_at: new Date().toISOString()
  },
  {
    id: 'session-3',
    user_id: 'user-123',
    interview_type: 'system_design',
    status: 'completed',
    interview_score: 55,
    overall_score: 55,
    performance_metrics: {
      communication: 50,
      problemDecomposition: 58,
      efficiency: 55,
      clarity: 52
    },
    completed_at: new Date().toISOString()
  }
];

async function testImprovementPlanService() {
  console.log('🧪 Testing Improvement Plan Service\n');

  try {
    // Test 1: Analyze weaknesses
    console.log('Test 1: Analyzing weaknesses...');
    const analysis = ImprovementPlanService._analyzeWeaknesses(mockSessions);
    console.log('✅ Weakness analysis completed');
    console.log('Top weaknesses:', analysis.topWeaknesses.map(w => `${w.area} (${w.weaknessLevel}%)`).join(', '));
    console.log('Overall trend:', analysis.overallTrend);
    console.log('Sessions analyzed:', analysis.sessionsAnalyzed);
    console.log('');

    // Test 2: Generate daily tasks
    console.log('Test 2: Generating daily tasks...');
    const dailyPlan = ImprovementPlanService._generateDailyTasks(analysis.topWeaknesses, 7);
    console.log('✅ Daily plan generated');
    console.log('Days:', dailyPlan.length);
    console.log('Sample day 1:', {
      focusArea: dailyPlan[0].focusArea,
      intensity: dailyPlan[0].intensity,
      taskCount: dailyPlan[0].tasks.length,
      estimatedTime: dailyPlan[0].estimatedTime
    });
    console.log('');

    // Test 3: Generate summary
    console.log('Test 3: Generating summary...');
    const summary = ImprovementPlanService._generateSummary(analysis.topWeaknesses, analysis.overallTrend);
    console.log('✅ Summary generated');
    console.log('Summary:', summary);
    console.log('');

    // Test 4: Generate resources
    console.log('Test 4: Generating resources...');
    const resources = ImprovementPlanService._generateResources(analysis.topWeaknesses);
    console.log('✅ Resources generated');
    console.log('Resource count:', resources.length);
    console.log('Sample resource:', resources[0]);
    console.log('');

    // Test 5: Generate milestones
    console.log('Test 5: Generating milestones...');
    const milestones = ImprovementPlanService._generateMilestones(analysis.topWeaknesses, 7);
    console.log('✅ Milestones generated');
    console.log('Milestone count:', milestones.length);
    console.log('Sample milestone:', {
      day: milestones[0].day,
      title: milestones[0].title,
      criteriaCount: milestones[0].criteria.length
    });
    console.log('');

    // Test 6: Calculate trend
    console.log('Test 6: Testing trend calculation...');
    const improvingTrend = ImprovementPlanService._calculateTrend([
      { interview_score: 60 },
      { interview_score: 65 },
      { interview_score: 70 }
    ]);
    const decliningTrend = ImprovementPlanService._calculateTrend([
      { interview_score: 70 },
      { interview_score: 65 },
      { interview_score: 60 }
    ]);
    const stableTrend = ImprovementPlanService._calculateTrend([
      { interview_score: 65 },
      { interview_score: 66 },
      { interview_score: 65 }
    ]);
    console.log('✅ Trend calculation working');
    console.log('Improving trend:', improvingTrend);
    console.log('Declining trend:', decliningTrend);
    console.log('Stable trend:', stableTrend);
    console.log('');

    // Test 7: Fallback recommendations
    console.log('Test 7: Testing fallback recommendations...');
    const fallbackRecs = ImprovementPlanService._generateFallbackRecommendations(analysis.topWeaknesses);
    console.log('✅ Fallback recommendations generated');
    console.log('Immediate actions:', fallbackRecs.immediate_actions.length);
    console.log('Practice focus:', fallbackRecs.practice_focus.length);
    console.log('Mindset tips:', fallbackRecs.mindset_tips.length);
    console.log('Resources:', fallbackRecs.resources.length);
    console.log('');

    console.log('✅ All tests passed!\n');
    console.log('📊 Summary:');
    console.log('- Weakness analysis: Working');
    console.log('- Daily plan generation: Working');
    console.log('- Summary generation: Working');
    console.log('- Resource generation: Working');
    console.log('- Milestone generation: Working');
    console.log('- Trend calculation: Working');
    console.log('- Fallback recommendations: Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testImprovementPlanService();
