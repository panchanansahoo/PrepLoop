import { getSecurityStats } from './securityEnhanced.js';
import { csrfProtection } from './csrf.js';

const advancedSecurity = {
  createAdaptiveRateLimiter: (_options = {}) => (req, res, next) => next(),
  bruteForceProtection: (_options = {}) => (req, res, next) => next(),
  sqlInjectionProtection: (_options = {}) => (req, res, next) => next(),
  xssProtection: (_options = {}) => (req, res, next) => next(),
  csrfProtection,
  ipBlocker: (_options = {}) => (req, res, next) => next(),
  securityHeaders: (_options = {}) => (req, res, next) => next(),
  getSecurityStats: () => {
    const base = typeof getSecurityStats === 'function' ? getSecurityStats() : {};
    return {
      totalEvents: base.blockedRequests || 0,
      blockedIPs: base.blockedIPsCount || 0,
      ...base,
    };
  },
};

export default advancedSecurity;
