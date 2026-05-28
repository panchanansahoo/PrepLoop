/**
 * Collaborative Filtering Service for Personalized Career Pathways
 * 
 * Recommends career pathways based on user-pathway interactions and similar user profiles.
 * Uses item-based and user-based collaborative filtering.
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Compute cosine similarity between two users based on profile signals
 */
function computeUserSimilarity(profile1, profile2) {
  if (!profile1 || !profile2) return 0;
  
  let similarity = 0;
  let factors = 0;
  
  // Skills overlap
  const skills1 = (profile1.skills || []).map(s => s.toLowerCase());
  const skills2 = (profile2.skills || []).map(s => s.toLowerCase());
  
  if (skills1.length > 0 && skills2.length > 0) {
    const intersection = skills1.filter(s => skills2.includes(s)).length;
    const union = new Set([...skills1, ...skills2]).size;
    similarity += (intersection / union) * 0.3; // 30% weight
    factors++;
  }
  
  // Location match
  if (profile1.location && profile2.location) {
    similarity += (profile1.location.toLowerCase() === profile2.location.toLowerCase() ? 0.25 : 0.05);
    factors++;
  }
  
  // Qualification match
  if (profile1.qualification && profile2.qualification) {
    similarity += (profile1.qualification.toLowerCase() === profile2.qualification.toLowerCase() ? 0.25 : 0.1);
    factors++;
  }
  
  // Role preference match
  if (profile1.preferredRole && profile2.preferredRole) {
    const role1 = profile1.preferredRole.toLowerCase();
    const role2 = profile2.preferredRole.toLowerCase();
    similarity += (role1 === role2 ? 0.2 : (role1.includes(role2.split(' ')[0]) ? 0.1 : 0));
    factors++;
  }
  
  // Experience level match
  if (profile1.experienceLevel && profile2.experienceLevel) {
    const level1 = profile1.experienceLevel.toLowerCase();
    const level2 = profile2.experienceLevel.toLowerCase();
    similarity += (level1 === level2 ? 0.15 : 0.05);
    factors++;
  }
  
  return factors > 0 ? similarity / factors : 0;
}

/**
 * Compute item similarity between pathways
 */
function computePathwaySimilarity(pathway1, pathway2) {
  if (!pathway1 || !pathway2) return 0;
  
  let similarity = 0;
  
  // Target role match
  if (pathway1.target_role && pathway2.target_role) {
    similarity += (pathway1.target_role.toLowerCase() === pathway2.target_role.toLowerCase() ? 0.3 : 0);
  }
  
  // Required skills overlap
  const skills1 = (pathway1.required_skills || []).map(s => s.toLowerCase());
  const skills2 = (pathway2.required_skills || []).map(s => s.toLowerCase());
  
  if (skills1.length > 0 && skills2.length > 0) {
    const intersection = skills1.filter(s => skills2.includes(s)).length;
    const union = new Set([...skills1, ...skills2]).size;
    similarity += (intersection / union) * 0.3;
  }
  
  // Duration similarity
  if (pathway1.estimated_duration && pathway2.estimated_duration) {
    const durationDiff = Math.abs(pathway1.estimated_duration - pathway2.estimated_duration);
    similarity += Math.max(0, 0.2 - (durationDiff / 100) * 0.2);
  }
  
  // Difficulty match
  if (pathway1.difficulty && pathway2.difficulty) {
    similarity += (pathway1.difficulty === pathway2.difficulty ? 0.2 : 0);
  }
  
  return Math.min(1, similarity);
}

/**
 * Get user-pathway interaction history
 */
async function getUserPathwayHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('career_user_pathway_interactions')
      .select('pathway_id, engagement_score, completed, job_landed, placement_time_days')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching user pathway history:', err);
    return [];
  }
}

/**
 * Get similar users based on profile
 */
export async function findSimilarUsers(userProfile, limit = 10) {
  try {
    // Get all user profiles (simplified - in production, would use indexed search)
    const { data: allUsers, error } = await supabase
      .from('profiles')
      .select('id, skills, location, qualification, designation, experience_level')
      .limit(100);
    
    if (error) throw error;
    if (!allUsers) return [];
    
    const similarities = allUsers
      .filter(u => u.id !== userProfile.id)
      .map(u => ({
        userId: u.id,
        profile: u,
        similarity: computeUserSimilarity(userProfile, {
          skills: u.skills,
          location: u.location,
          qualification: u.qualification,
          preferredRole: u.designation,
          experienceLevel: u.experience_level,
        }),
      }))
      .filter(u => u.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarities;
  } catch (err) {
    console.error('Error finding similar users:', err);
    return [];
  }
}

/**
 * Get recommended pathways using user-based collaborative filtering
 */
export async function getRecommendedPathwaysUserBased(userProfile, limit = 5) {
  try {
    // Find similar users
    const similarUsers = await findSimilarUsers(userProfile, 20);
    if (similarUsers.length === 0) {
      return { method: 'user-based', pathways: [], reason: 'No similar users found' };
    }
    
    // Get their successful pathways
    const pathwayScores = {};
    
    for (const similar of similarUsers) {
      const history = await getUserPathwayHistory(similar.userId);
      
      for (const interaction of history) {
        if (!pathwayScores[interaction.pathway_id]) {
          pathwayScores[interaction.pathway_id] = {
            totalScore: 0,
            userCount: 0,
            successCount: 0,
            avgPlacementTime: 0,
          };
        }
        
        const score = pathwayScores[interaction.pathway_id];
        score.totalScore += interaction.engagement_score * similar.similarity;
        score.userCount++;
        
        if (interaction.completed && interaction.job_landed) {
          score.successCount++;
          score.avgPlacementTime += interaction.placement_time_days || 0;
        }
      }
    }
    
    // Rank pathways by adjusted score
    const recommendations = Object.entries(pathwayScores)
      .map(([pathwayId, score]) => ({
        pathwayId: parseInt(pathwayId),
        score: score.totalScore / score.userCount,
        successRate: score.successCount / score.userCount,
        avgPlacementTime: score.successCount > 0 ? Math.round(score.avgPlacementTime / score.successCount) : null,
        similarUsersWhoSucceeded: score.successCount,
      }))
      .sort((a, b) => (b.successRate * 0.5 + b.score * 0.5) - (a.successRate * 0.5 + a.score * 0.5))
      .slice(0, limit);
    
    return {
      method: 'user-based',
      pathways: recommendations,
      reason: `Based on ${similarUsers.length} similar users' success patterns`,
    };
  } catch (err) {
    console.error('Error getting user-based recommendations:', err);
    return { method: 'user-based', pathways: [], error: err.message };
  }
}

/**
 * Get recommended pathways using item-based collaborative filtering
 */
export async function getRecommendedPathwaysItemBased(userProfile, userInteractions = [], limit = 5) {
  try {
    if (!userInteractions || userInteractions.length === 0) {
      return { method: 'item-based', pathways: [], reason: 'No user interaction history' };
    }
    
    // Get details of pathways user interacted with
    const interactedPathwayIds = userInteractions.map(i => i.pathway_id);
    
    const { data: interactedPathways, error: err1 } = await supabase
      .from('career_pathways')
      .select('*')
      .in('id', interactedPathwayIds);
    
    if (err1) throw err1;
    if (!interactedPathways || interactedPathways.length === 0) {
      return { method: 'item-based', pathways: [], reason: 'Could not load interacted pathways' };
    }
    
    // Get all pathways to compare
    const { data: allPathways, error: err2 } = await supabase
      .from('career_pathways')
      .select('*')
      .limit(50);
    
    if (err2) throw err2;
    if (!allPathways) return { method: 'item-based', pathways: [] };
    
    // Compute similarities
    const recommendations = [];
    
    for (const candidate of allPathways) {
      if (interactedPathwayIds.includes(candidate.id)) continue;
      
      let avgSimilarity = 0;
      let similarityCount = 0;
      
      for (const interacted of interactedPathways) {
        const similarity = computePathwaySimilarity(interacted, candidate);
        avgSimilarity += similarity;
        similarityCount++;
      }
      
      if (similarityCount > 0) {
        recommendations.push({
          pathwayId: candidate.id,
          targetRole: candidate.target_role,
          similarity: avgSimilarity / similarityCount,
          requiredSkills: candidate.required_skills,
          estimatedDuration: candidate.estimated_duration,
        });
      }
    }
    
    return {
      method: 'item-based',
      pathways: recommendations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit),
      reason: `Recommended based on ${interactedPathways.length} pathways you viewed`,
    };
  } catch (err) {
    console.error('Error getting item-based recommendations:', err);
    return { method: 'item-based', pathways: [], error: err.message };
  }
}

/**
 * Get hybrid recommendations combining both methods
 */
export async function getHybridPathwayRecommendations(userProfile, userInteractions = [], limit = 5) {
  try {
    const [userBased, itemBased] = await Promise.all([
      getRecommendedPathwaysUserBased(userProfile, limit * 2),
      getRecommendedPathwaysItemBased(userProfile, userInteractions, limit * 2),
    ]);
    
    // Merge and deduplicate
    const pathwayMap = new Map();
    
    for (const pathway of userBased.pathways || []) {
      pathwayMap.set(pathway.pathwayId, {
        ...pathway,
        userBasedScore: pathway.score * 0.5 + (pathway.successRate || 0) * 0.5,
        itemBasedScore: 0,
      });
    }
    
    for (const pathway of itemBased.pathways || []) {
      if (pathwayMap.has(pathway.pathwayId)) {
        const existing = pathwayMap.get(pathway.pathwayId);
        existing.itemBasedScore = pathway.similarity;
      } else {
        pathwayMap.set(pathway.pathwayId, {
          ...pathway,
          userBasedScore: 0,
          itemBasedScore: pathway.similarity,
        });
      }
    }
    
    // Compute hybrid scores
    const hybrid = Array.from(pathwayMap.values())
      .map(p => ({
        ...p,
        hybridScore: p.userBasedScore * 0.6 + p.itemBasedScore * 0.4,
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);
    
    return {
      method: 'hybrid',
      pathways: hybrid,
      sources: {
        userBased: userBased.reason,
        itemBased: itemBased.reason,
      },
    };
  } catch (err) {
    console.error('Error getting hybrid recommendations:', err);
    return { method: 'hybrid', pathways: [], error: err.message };
  }
}

/**
 * Record user-pathway interaction
 */
export async function recordPathwayInteraction(userId, pathwayId, engagementSignal) {
  try {
    const { data, error } = await supabase
      .from('career_user_pathway_interactions')
      .upsert({
        user_id: userId,
        pathway_id: pathwayId,
        engagement_score: engagementSignal.score || 0,
        completed: engagementSignal.completed || false,
        job_landed: engagementSignal.jobLanded || false,
        placement_time_days: engagementSignal.placementTimeDays || null,
        interaction_timestamp: new Date().toISOString(),
      });
    
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error recording interaction:', err);
    return { success: false, error: err.message };
  }
}

export default {
  findSimilarUsers,
  getRecommendedPathwaysUserBased,
  getRecommendedPathwaysItemBased,
  getHybridPathwayRecommendations,
  recordPathwayInteraction,
};
