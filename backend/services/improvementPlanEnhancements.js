// Improvement Plan Enhancements
// This file contains adaptive difficulty and gamification features for improvement plan

// Difficulty levels for adaptive tasks
const DIFFICULTY_LEVELS = {
  beginner: {
    multiplier: 0.7,
    taskCount: 2,
    estimatedTime: 30
  },
  intermediate: {
    multiplier: 1.0,
    taskCount: 3,
    estimatedTime: 45
  },
  advanced: {
    multiplier: 1.3,
    taskCount: 4,
    estimatedTime: 60
  }
};

// Gamification elements
const ACHIEVEMENTS = {
  first_plan: {
    id: 'first_plan',
    title: 'First Steps',
    description: 'Generated your first improvement plan',
    icon: '🎯',
    points: 50
  },
  task_master: {
    id: 'task_master',
    title: 'Task Master',
    description: 'Completed 10 tasks in a row',
    icon: '⭐',
    points: 100
  },
  week_warrior: {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Completed all tasks for 7 days in a row',
    icon: '🔥',
    points: 200
  },
  milestone_reacher: {
    id: 'milestone_reacher',
    title: 'Milestone Reacher',
    description: 'Reached a plan milestone',
    icon: '🏆',
    points: 150
  },
  plan_completer: {
    id: 'plan_completer',
    title: 'Plan Completer',
    description: 'Completed an entire improvement plan',
    icon: '✅',
    points: 300
  }
};

/**
 * Calculate appropriate difficulty level based on user progress
 * @param {Object} userProgress - User's progress data
 * @returns {string} Difficulty level (beginner, intermediate, or advanced)
 */
function calculateDifficulty(userProgress) {
  if (!userProgress || userProgress.completedTasks === 0) {
    return 'beginner';
  }

  const completionRate = userProgress.completedTasks / userProgress.totalTasks;
  const streakLength = userProgress.streakLength || 0;

  // Consider both completion rate and streak for difficulty
  if (completionRate > 0.8 && streakLength >= 5) {
    return 'advanced';
  } else if (completionRate > 0.5 || streakLength >= 3) {
    return 'intermediate';
  }

  return 'beginner';
}

/**
 * Adjust difficulty based on day in plan
 * @param {string} baseDifficulty - Base difficulty level
 * @param {number} day - Current day in the plan
 * @param {number} totalDays - Total days in the plan
 * @returns {string} Adjusted difficulty level
 */
function adjustDayDifficulty(baseDifficulty, day, totalDays) {
  // Gradually increase difficulty as plan progresses
  const progress = day / totalDays;

  if (progress < 0.33) {
    return baseDifficulty;
  } else if (progress < 0.66) {
    return baseDifficulty === 'beginner' ? 'intermediate' : baseDifficulty;
  } else {
    return baseDifficulty === 'advanced' ? 'advanced' : 
           baseDifficulty === 'intermediate' ? 'advanced' : 'intermediate';
  }
}

/**
 * Calculate points for a task based on difficulty and intensity
 * @param {string} difficulty - Difficulty level
 * @param {string} intensity - Intensity level (high, medium, low)
 * @returns {number} Points for the task
 */
function calculateTaskPoints(difficulty, intensity) {
  const basePoints = {
    beginner: 10,
    intermediate: 15,
    advanced: 20
  };

  const intensityMultiplier = {
    high: 1.5,
    medium: 1.0,
    low: 0.75
  };

  return Math.round(basePoints[difficulty] * intensityMultiplier[intensity]);
}

/**
 * Get potential achievements for a plan
 * @param {number} timeframe - Plan duration in days
 * @returns {Array} List of achievable achievements
 */
function getPotentialAchievements(timeframe) {
  const achievements = [];

  if (timeframe >= 7) {
    achievements.push(ACHIEVEMENTS.week_warrior);
  }

  achievements.push(
    ACHIEVEMENTS.first_plan,
    ACHIEVEMENTS.task_master,
    ACHIEVEMENTS.milestone_reacher,
    ACHIEVEMENTS.plan_completer
  );

  return achievements;
}

/**
 * Calculate streak of consecutive days with completed tasks
 * @param {Array} completedTasks - Array of completed task objects
 * @returns {number} Current streak length
 */
function calculateStreak(completedTasks) {
  if (!completedTasks || completedTasks.length === 0) {
    return 0;
  }

  // Sort tasks by completion date
  const sortedTasks = [...completedTasks].sort(
    (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
  );

  let streak = 0;
  let currentDay = null;
  let maxStreak = 0;

  sortedTasks.forEach(task => {
    const taskDate = new Date(task.completedAt).toDateString();

    if (currentDay === null) {
      currentDay = taskDate;
      streak = 1;
    } else if (taskDate === currentDay) {
      // Same day, don't increment streak
    } else {
      const prevDate = new Date(currentDay);
      const currDate = new Date(taskDate);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentDay = taskDate;
      } else {
        maxStreak = Math.max(maxStreak, streak);
        streak = 1;
        currentDay = taskDate;
      }
    }
  });

  return Math.max(maxStreak, streak);
}

export {
  DIFFICULTY_LEVELS,
  ACHIEVEMENTS,
  calculateDifficulty,
  adjustDayDifficulty,
  calculateTaskPoints,
  getPotentialAchievements,
  calculateStreak
};
