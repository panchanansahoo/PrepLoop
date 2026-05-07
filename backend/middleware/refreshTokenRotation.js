/**
 * Refresh Token Rotation Middleware
 * Implements secure token rotation with reuse detection
 */

import crypto from 'crypto';
import cacheManager from '../utils/cacheManager.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('token-rotation');

/**
 * Generate a new refresh token with rotation
 */
export async function rotateRefreshToken(userId, oldToken = null) {
  try {
    // Check for token reuse (critical security feature)
    if (oldToken) {
      const reused = await cacheManager.get(`token_reuse:${oldToken}`);
      if (reused) {
        // SECURITY ALERT: Token reuse detected - revoke all user tokens
        logger.error('SECURITY VIOLATION: Token reuse detected', { userId });
        await revokeAllUserTokens(userId);
        throw new Error('Security violation: Token reuse detected. All sessions terminated.');
      }
      
      // Mark old token as used (for future reuse detection)
      await cacheManager.set(`token_reuse:${oldToken}`, 'used', 86400); // 24h window
    }
    
    // Generate cryptographically secure token
    const newToken = crypto.randomBytes(64).toString('hex');
    const createdAt = Date.now();
    const expiresAt = createdAt + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Store token metadata in Redis
    await cacheManager.set(
      `refresh:${newToken}`,
      JSON.stringify({
        userId,
        createdAt,
        expiresAt,
        ipAddress: null, // Will be set by caller
        userAgent: null, // Will be set by caller
      }),
      7 * 24 * 60 * 60 // 7 days TTL
    );
    
    logger.info('Refresh token rotated', { userId, tokenId: newToken.substring(0, 8) });
    
    return {
      token: newToken,
      expiresAt,
    };
  } catch (error) {
    logger.error('Token rotation failed', { userId, error: error.message });
    throw error;
  }
}

/**
 * Revoke all tokens for a user (security measure)
 */
export async function revokeAllUserTokens(userId) {
  try {
    // Mark user as revoked (blocks all token validations)
    await cacheManager.set(`user_revoked:${userId}`, 'true', 86400);
    
    // Note: In production, you'd want to:
    // 1. Query all active tokens for this user
    // 2. Delete them from Redis
    // 3. Log the security event
    // 4. Notify the user
    
    logger.warn('All user tokens revoked', { userId });
  } catch (error) {
    logger.error('Failed to revoke user tokens', { userId, error: error.message });
  }
}

/**
 * Validate refresh token
 */
export async function validateRefreshToken(token) {
  try {
    const data = await cacheManager.get(`refresh:${token}`);
    
    if (!data) {
      return { 
        valid: false, 
        reason: 'Token not found or expired',
        code: 'TOKEN_NOT_FOUND',
      };
    }
    
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Check if user's tokens have been revoked
    const revoked = await cacheManager.get(`user_revoked:${parsed.userId}`);
    if (revoked) {
      return { 
        valid: false, 
        reason: 'All tokens have been revoked',
        code: 'TOKENS_REVOKED',
      };
    }
    
    // Check expiration
    if (Date.now() > parsed.expiresAt) {
      await cacheManager.delete(`refresh:${token}`);
      return { 
        valid: false, 
        reason: 'Token expired',
        code: 'TOKEN_EXPIRED',
      };
    }
    
    return {
      valid: true,
      userId: parsed.userId,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
    };
  } catch (error) {
    logger.error('Token validation failed', { error: error.message });
    return {
      valid: false,
      reason: 'Token validation error',
      code: 'VALIDATION_ERROR',
    };
  }
}

/**
 * Invalidate a specific refresh token
 */
export async function invalidateToken(token) {
  try {
    await cacheManager.delete(`refresh:${token}`);
    logger.info('Token invalidated', { tokenId: token.substring(0, 8) });
  } catch (error) {
    logger.error('Failed to invalidate token', { error: error.message });
  }
}

/**
 * Get active token count for a user
 */
export async function getUserTokenCount(userId) {
  // This is a simplified version - in production you'd use Redis SCAN
  // to find all tokens for a user
  return 0; // Placeholder
}
