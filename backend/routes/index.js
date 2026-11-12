import express from 'express';

/**
 * PrepLoop Central API Route Registry
 * Standardizes nested routers, simplifies backend initialization,
 * and maintains consistent route definitions across the platform.
 */
export async function createApiRouter({ authenticateToken, getInterviewAnalytics, getInterviewRecommendations } = {}) {
  const router = express.Router();

  // Load all route modules
  const [
    authRoutes,
    dsaRoutes,
    practiceRoutes,
    aiRoutes,
    aiFeaturesRoutes,
    userRoutes,
    resumeRoutes,
    systemDesignRoutes,
    communityRoutes,
    communityChallengesRoutes,
    coachRoutes,
    interviewModule,
    interviewEnhancedRoutes,
    interviewSuiteRoutes,
    contactRoutes,
    blogRoutes,
    activityRoutes,
    companyInterviewRoutes,
    paymentRoutes,
    voiceRoutes,
    notesRoutes,
    adminRoutes,
    jobsRoutes,
    coinsRoutes,
    chatRoutes,
    clientLogsRoutes,
    scheduleRoutes,
    hrRoutes,
    libraryRoutes,
    improvementPlanRoutes,
    studyGroupsRoutes,
    fresherInterviewRoutes,
    copilotRoutes,
    peerInterviewRoutes,
    portfolioRoutes,
    analyticsRoutes,
    careerAnalyticsRoutes,
    contestsRoutes,
    realInterviewRoutes,
    feedbackRoutes,
    monitoringEnhancedRoutes,
    errorReportRoutes,
    feedRoutes,
    gamificationRoutes,
    employerRoutes,
    spacedRepetitionRoutes,
    jobApplicationsRoutes,
  ] = await Promise.all([
    import('./auth.js').then((m) => m.default),
    import('./dsa.js').then((m) => m.default),
    import('./practice.js').then((m) => m.default),
    import('./ai.js').then((m) => m.default),
    import('./ai-features.js').then((m) => m.default),
    import('./user.js').then((m) => m.default),
    import('./resume.js').then((m) => m.default),
    import('./systemDesign.js').then((m) => m.default),
    import('./community.js').then((m) => m.default),
    import('./communityChallenges.js').then((m) => m.default),
    import('./coach.js').then((m) => m.default),
    import('./interview.js'),
    import('./interview-enhanced.js').then((m) => m.default),
    import('./interview-suite.js').then((m) => m.default),
    import('./contact.js').then((m) => m.default),
    import('./blog.js').then((m) => m.default),
    import('./activity.js').then((m) => m.default),
    import('./companyInterview.js').then((m) => m.default),
    import('./payment.js').then((m) => m.default),
    import('./voice.js').then((m) => m.default),
    import('./notes.js').then((m) => m.default),
    import('./admin.js').then((m) => m.default),
    import('./jobs.js').then((m) => m.default),
    import('./coins.js').then((m) => m.default),
    import('./chat.js').then((m) => m.default),
    import('./clientLogs.js').then((m) => m.default),
    import('./schedule.js').then((m) => m.default),
    import('./hr.js').then((m) => m.default),
    import('./library.js').then((m) => m.default),
    import('./improvement-plan.js').then((m) => m.default),
    import('./study-groups.js').then((m) => m.default),
    import('./fresher-interview.js').then((m) => m.default),
    import('./copilot.js').then((m) => m.default),
    import('./peerInterview.js').then((m) => m.default),
    import('./portfolio.js').then((m) => m.default),
    import('./analytics.js').then((m) => m.default),
    import('./career-analytics.js').then((m) => m.default),
    import('./contests.js').then((m) => m.default),
    import('./real-interview.js').then((m) => m.default),
    import('./feedback.js').then((m) => m.default),
    import('./monitoring-enhanced.js').then((m) => m.default),
    import('./errorReport.js').then((m) => m.default),
    import('./feed.js').then((m) => m.default),
    import('./gamification.js').then((m) => m.default),
    import('./employer.js').then((m) => m.default),
    import('./spaced-repetition.js').then((m) => m.default),
    import('./job-applications.js').then((m) => m.default),
  ]);

  const interviewRoutes = interviewModule.default;
  const analyticsHandler = getInterviewAnalytics || interviewModule.getInterviewAnalytics;
  const recommendationsHandler = getInterviewRecommendations || interviewModule.getInterviewRecommendations;

  // Mount nested routers
  router.use('/auth', authRoutes);
  router.use('/dsa', dsaRoutes);
  router.use('/practice', practiceRoutes);
  router.use('/ai', aiRoutes);
  router.use('/ai-features', aiFeaturesRoutes);
  router.use('/user', userRoutes);
  router.use('/resume', resumeRoutes);
  router.use('/system-design', systemDesignRoutes);
  router.use('/community/challenges', communityChallengesRoutes);
  router.use('/community', communityRoutes);
  router.use('/ai/coach', coachRoutes);
  router.use('/ai/interview', interviewRoutes);
  router.use('/interview', interviewRoutes);
  router.use('/ai/interview/v2', interviewEnhancedRoutes);

  if (authenticateToken && analyticsHandler) {
    router.get('/analytics/overview', authenticateToken, analyticsHandler);
  }
  if (authenticateToken && recommendationsHandler) {
    router.get('/recommendations', authenticateToken, recommendationsHandler);
  }

  router.use('/interview-suite', interviewSuiteRoutes);
  router.use('/contact', contactRoutes);
  router.use('/blog', blogRoutes);
  router.use('/activity', activityRoutes);
  router.use('/company-interview', companyInterviewRoutes);
  router.use('/payment', paymentRoutes);
  router.use('/voice', voiceRoutes);
  router.use('/notes', notesRoutes);
  router.use('/admin', adminRoutes);
  router.use('/jobs', jobsRoutes);
  router.use('/coins', coinsRoutes);
  router.use('/chat', chatRoutes);
  router.use('/client-logs', clientLogsRoutes);
  router.use('/schedule', scheduleRoutes);
  router.use('/hr', hrRoutes);
  router.use('/library', libraryRoutes);
  router.use('/improvement-plan', improvementPlanRoutes);
  router.use('/study-groups', studyGroupsRoutes);
  router.use('/fresher-interview', fresherInterviewRoutes);
  router.use('/copilot', copilotRoutes);
  router.use('/peer-interview', peerInterviewRoutes);
  router.use('/portfolio', portfolioRoutes);
  router.use('/analytics', analyticsRoutes);
  router.use('/career', careerAnalyticsRoutes);
  router.use('/', contestsRoutes);
  router.use('/real-interview', realInterviewRoutes);
  router.use('/feedback', feedbackRoutes);
  router.use('/monitoring', monitoringEnhancedRoutes);
  router.use('/errors', errorReportRoutes);
  router.use('/feed', feedRoutes);
  router.use('/gamification', gamificationRoutes);
  router.use('/employer', employerRoutes);
  router.use('/spaced-repetition', spacedRepetitionRoutes);
  router.use('/job-applications', jobApplicationsRoutes);

  return router;
}

export default createApiRouter;

