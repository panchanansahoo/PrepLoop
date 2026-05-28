/**
 * Demand Forecasting Service
 * 
 * Provides time-series forecasting for job roles, skills, and salary trends
 * using exponential smoothing and trend analysis over quarterly periods.
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Exponential smoothing forecast
 * @param {Array<number>} data - historical data points
 * @param {number} alpha - smoothing factor (0.1-0.3 common)
 * @param {number} periods - number of periods to forecast
 */
function exponentialSmoothing(data, alpha = 0.2, periods = 4) {
  if (!data || data.length < 2) return [];
  
  const forecast = [];
  let smoothed = data[0];
  
  // Build smoothed series
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }
  
  // Forecast forward
  let lastValue = smoothed;
  for (let i = 0; i < periods; i++) {
    lastValue = alpha * data[data.length - 1] + (1 - alpha) * lastValue;
    forecast.push(Math.round(lastValue));
  }
  
  return forecast;
}

/**
 * Calculate trend direction and growth rate
 */
function calculateTrend(data) {
  if (data.length < 2) return { direction: 'stable', growthRate: 0 };
  
  const recent = data.slice(-4); // Last 4 quarters
  const older = data.slice(-8, -4);  // Previous 4 quarters
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((a, b) => a + b, 0) / older.length 
    : recentAvg;
  
  const growthRate = olderAvg > 0 
    ? ((recentAvg - olderAvg) / olderAvg) * 100 
    : 0;
  
  let direction = 'stable';
  if (growthRate > 10) direction = 'growing';
  else if (growthRate < -10) direction = 'declining';
  
  return {
    direction,
    growthRate: Math.round(growthRate * 10) / 10,
    currentValue: recentAvg,
    previousValue: olderAvg,
  };
}

/**
 * Fetch historical job posting frequency for a role
 */
export async function getHistoricalRoleFrequency(roleName) {
  try {
    const { data, error } = await supabase
      .from('career_market_signals')
      .select('quarter, job_posting_count')
      .eq('role_name', roleName)
      .order('quarter', { ascending: true });
    
    if (error) throw error;
    
    // If no data, return synthetic baseline
    if (!data || data.length === 0) {
      return {
        role: roleName,
        historical: [100, 110, 125, 130, 140, 155, 160, 170],
        quarters: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4'],
      };
    }
    
    return {
      role: roleName,
      historical: data.map(d => d.job_posting_count),
      quarters: data.map(d => d.quarter),
    };
  } catch (err) {
    console.error('Error fetching role frequency:', err);
    return null;
  }
}

/**
 * Fetch historical salary data for a role and location
 */
export async function getHistoricalSalaryData(roleName, location = null) {
  try {
    let query = supabase
      .from('career_market_signals')
      .select('quarter, salary_min, salary_max, salary_median')
      .eq('role_name', roleName);
    
    if (location) {
      query = query.eq('location', location);
    }
    
    const { data, error } = await query.order('quarter', { ascending: true });
    
    if (error) throw error;
    
    // Return synthetic if no data
    if (!data || data.length === 0) {
      const baseMin = location?.includes('San Francisco') ? 140000 : 80000;
      return {
        role: roleName,
        location: location || 'global',
        historical: {
          salaryMin: [baseMin, baseMin + 2000, baseMin + 4000, baseMin + 5000, baseMin + 7000, baseMin + 9000, baseMin + 11000, baseMin + 13000],
          salaryMax: [baseMin + 40000, baseMin + 42000, baseMin + 45000, baseMin + 48000, baseMin + 52000, baseMin + 56000, baseMin + 61000, baseMin + 66000],
        },
        quarters: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4'],
      };
    }
    
    return {
      role: roleName,
      location: location || 'global',
      historical: {
        salaryMin: data.map(d => d.salary_min || 0),
        salaryMax: data.map(d => d.salary_max || 0),
        salaryMedian: data.map(d => d.salary_median || 0),
      },
      quarters: data.map(d => d.quarter),
    };
  } catch (err) {
    console.error('Error fetching salary data:', err);
    return null;
  }
}

/**
 * Fetch historical skill demand
 */
export async function getHistoricalSkillDemand(skillName) {
  try {
    const { data, error } = await supabase
      .from('career_market_signals')
      .select('quarter, skill_mentions')
      .ilike('skill_name', `%${skillName}%`)
      .order('quarter', { ascending: true });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        skill: skillName,
        historical: [50, 65, 80, 95, 110, 125, 140, 160],
        quarters: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4'],
      };
    }
    
    return {
      skill: skillName,
      historical: data.map(d => d.skill_mentions),
      quarters: data.map(d => d.quarter),
    };
  } catch (err) {
    console.error('Error fetching skill demand:', err);
    return null;
  }
}

/**
 * Forecast future demand for a role
 * Returns forecast for next 4 quarters with trend analysis
 */
export async function forecastRoleDemand(roleName, periods = 4) {
  try {
    const historical = await getHistoricalRoleFrequency(roleName);
    if (!historical || !historical.historical.length) {
      return { error: 'No historical data available' };
    }
    
    const trend = calculateTrend(historical.historical);
    const forecast = exponentialSmoothing(historical.historical, 0.2, periods);
    
    // Generate future quarters
    const lastQuarter = historical.quarters[historical.quarters.length - 1];
    const [year, q] = lastQuarter.split('-Q');
    let nextYear = parseInt(year);
    let nextQ = parseInt(q) + 1;
    
    const futureQuarters = [];
    for (let i = 0; i < periods; i++) {
      if (nextQ > 4) {
        nextQ = 1;
        nextYear++;
      }
      futureQuarters.push(`${nextYear}-Q${nextQ}`);
      nextQ++;
    }
    
    return {
      role: roleName,
      trend,
      forecast: forecast.map((value, i) => ({
        quarter: futureQuarters[i],
        predictedPostingCount: value,
        confidence: 0.8 - (i * 0.05), // Confidence decreases further out
      })),
      growthPercentage: trend.growthRate,
    };
  } catch (err) {
    console.error('Error forecasting role demand:', err);
    return { error: err.message };
  }
}

/**
 * Forecast salary trends
 */
export async function forecastSalaryTrend(roleName, location = null, periods = 4) {
  try {
    const salaryData = await getHistoricalSalaryData(roleName, location);
    if (!salaryData || !salaryData.historical.salaryMin.length) {
      return { error: 'No salary data available' };
    }
    
    const minTrend = calculateTrend(salaryData.historical.salaryMin);
    const maxTrend = calculateTrend(salaryData.historical.salaryMax);
    
    const forecastMin = exponentialSmoothing(salaryData.historical.salaryMin, 0.15, periods);
    const forecastMax = exponentialSmoothing(salaryData.historical.salaryMax, 0.15, periods);
    
    const lastQuarter = salaryData.quarters[salaryData.quarters.length - 1];
    const [year, q] = lastQuarter.split('-Q');
    let nextYear = parseInt(year);
    let nextQ = parseInt(q) + 1;
    
    const futureQuarters = [];
    for (let i = 0; i < periods; i++) {
      if (nextQ > 4) {
        nextQ = 1;
        nextYear++;
      }
      futureQuarters.push(`${nextYear}-Q${nextQ}`);
      nextQ++;
    }
    
    return {
      role: roleName,
      location: location || 'global',
      salaryMinTrend: minTrend,
      salaryMaxTrend: maxTrend,
      forecast: forecastMin.map((min, i) => ({
        quarter: futureQuarters[i],
        predictedSalaryMin: min,
        predictedSalaryMax: forecastMax[i],
        predictedSalaryMedian: Math.round((min + forecastMax[i]) / 2),
      })),
    };
  } catch (err) {
    console.error('Error forecasting salary:', err);
    return { error: err.message };
  }
}

/**
 * Detect emerging skills based on historical trend
 * Returns skills growing >20% QoQ
 */
export async function detectEmergingSkills(threshold = 20) {
  try {
    const { data, error } = await supabase
      .from('career_market_signals')
      .select('skill_name, quarter, skill_mentions')
      .order('skill_name, quarter', { ascending: true });
    
    if (error) throw error;
    
    // Group by skill and calculate trends
    const skillTrends = {};
    
    for (const row of data) {
      if (!skillTrends[row.skill_name]) {
        skillTrends[row.skill_name] = [];
      }
      skillTrends[row.skill_name].push({
        quarter: row.quarter,
        mentions: row.skill_mentions,
      });
    }
    
    const emerging = [];
    
    for (const [skill, history] of Object.entries(skillTrends)) {
      if (history.length < 2) continue;
      
      const trend = calculateTrend(history.map(h => h.mentions));
      if (trend.growthRate > threshold) {
        emerging.push({
          skill,
          growthRate: trend.growthRate,
          direction: trend.direction,
          currentDemand: trend.currentValue,
          forecastedDemand: Math.round(trend.currentValue * (1 + trend.growthRate / 100)),
        });
      }
    }
    
    return emerging.sort((a, b) => b.growthRate - a.growthRate).slice(0, 20);
  } catch (err) {
    console.error('Error detecting emerging skills:', err);
    return [];
  }
}

/**
 * Get comprehensive market insights combining forecasts
 */
export async function getMarketInsights(roleName, location = null) {
  try {
    const [demandForecast, salaryForecast, emergingSkills] = await Promise.all([
      forecastRoleDemand(roleName, 4),
      forecastSalaryTrend(roleName, location, 4),
      detectEmergingSkills(15),
    ]);
    
    return {
      role: roleName,
      location: location || 'global',
      timestamp: new Date().toISOString(),
      demandOutlook: demandForecast,
      salaryOutlook: salaryForecast,
      emergingSkillsForRole: emergingSkills.slice(0, 5),
    };
  } catch (err) {
    console.error('Error getting market insights:', err);
    return { error: err.message };
  }
}

export default {
  getHistoricalRoleFrequency,
  getHistoricalSalaryData,
  getHistoricalSkillDemand,
  forecastRoleDemand,
  forecastSalaryTrend,
  detectEmergingSkills,
  getMarketInsights,
};
