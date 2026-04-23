/**
 * Secrets Detection & Prevention Module
 * Identifies and prevents accidental secret leaks in code and logs
 *
 * OWASP Top 10 - Mitigates:
 * A02: Cryptographic Failures - Secret exposure prevention
 * A05: Security Misconfiguration - Credential detection
 */

const SECRET_PATTERNS = {
  // API Keys and tokens
  awsKey: /AKIA[0-9A-Z]{16}/,
  awsSecret: /aws_secret_access_key\s*=\s*[^\s]+/i,
  googleKey: /AIza[0-9A-Za-z\-_]{35}/,
  githubToken: /ghp_[0-9a-zA-Z]{36}/,
  slackToken: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/,
  
  // Database URLs and connections
  mongoUrl: /mongodb\+srv:\/\/[^\s:]+:[^\s@]+@[^\s/]+/,
  postgresUrl: /postgres(ql)?:\/\/[^\s:]+:[^\s@]+@[^\s/]+/,
  mysqlUrl: /mysql:\/\/[^\s:]+:[^\s@]+@[^\s/]+/,
  
  // Private keys
  rsaPrivateKey: /-----BEGIN RSA PRIVATE KEY-----/,
  opensshPrivateKey: /-----BEGIN OPENSSH PRIVATE KEY-----/,
  pgpPrivateKey: /-----BEGIN PGP PRIVATE KEY BLOCK-----/,
  
  // Authentication tokens
  jwtToken: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  basicAuth: /Basic\s+[A-Za-z0-9+/=]{20,}/,
  bearerToken: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  
  // Cryptographic material
  cryptoKey: /-----BEGIN (ENCRYPTED )?PRIVATE KEY-----/,
  certificateKey: /-----BEGIN CERTIFICATE-----/,
  
  // Generic password patterns
  password: /password\s*[:=]\s*['"]((?:[^'"]|\\['"\\])*)['"]/gi,
  apiKey: /api[_-]?key\s*[:=]\s*['"]((?:[^'"]|\\['"\\])*)['"]/gi,
  secret: /secret\s*[:=]\s*['"]((?:[^'"]|\\['"\\])*)['"]/gi,
  token: /token\s*[:=]\s*['"]((?:[^'"]|\\['"\\])*)['"]/gi,
};

/**
 * Detect if a string contains secrets
 * @param {string} text - Text to scan
 * @param {Object} options - Scan options
 * @returns {Object} Detection results
 */
export const detectSecrets = (text, options = {}) => {
  const { maxMatches = 10, patterns = Object.keys(SECRET_PATTERNS) } = options;

  if (!text || typeof text !== 'string') {
    return { hasSecrets: false, matches: [] };
  }

  const matches = [];

  for (const patternName of patterns) {
    const pattern = SECRET_PATTERNS[patternName];
    if (!pattern) continue;

    const regex = new RegExp(pattern, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null && matches.length < maxMatches) {
      matches.push({
        type: patternName,
        value: match[0],
        index: match.index,
        severity: calculateSecuritySeverity(patternName),
      });
    }
  }

  return {
    hasSecrets: matches.length > 0,
    matches,
    summary: generateSummary(matches),
  };
};

/**
 * Calculate severity of detected secret
 */
function calculateSecuritySeverity(patternName) {
  const severityMap = {
    // Critical - immediate action required
    awsKey: 'CRITICAL',
    awsSecret: 'CRITICAL',
    googleKey: 'CRITICAL',
    githubToken: 'CRITICAL',
    rsaPrivateKey: 'CRITICAL',
    opensshPrivateKey: 'CRITICAL',
    pgpPrivateKey: 'CRITICAL',
    cryptoKey: 'CRITICAL',
    mongoUrl: 'CRITICAL',
    postgresUrl: 'CRITICAL',
    mysqlUrl: 'CRITICAL',

    // High - should be rotated
    slackToken: 'HIGH',
    jwtToken: 'HIGH',
    basicAuth: 'HIGH',
    bearerToken: 'HIGH',
    certificateKey: 'HIGH',

    // Medium - generic patterns
    password: 'MEDIUM',
    apiKey: 'MEDIUM',
    secret: 'MEDIUM',
    token: 'MEDIUM',
  };

  return severityMap[patternName] || 'MEDIUM';
}

/**
 * Generate human-readable summary
 */
function generateSummary(matches) {
  const summary = {};
  for (const match of matches) {
    summary[match.type] = (summary[match.type] || 0) + 1;
  }
  return summary;
}

/**
 * Sanitize potentially sensitive values in logs
 */
export const sanitizeForLogging = (obj, depth = 0) => {
  if (depth > 10) return '[Depth exceeded]'; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'jwt',
    'authorization',
    'auth',
    'credential',
    'credentials',
    'apiSecret',
    'api_secret',
    'privateKey',
    'private_key',
    'publicKey',
    'public_key',
    'dbPassword',
    'dbUrl',
    'connectionString',
    'connectString',
    'supabaseKey',
    'supabaseUrl',
    'jwtSecret',
    'jwt_secret',
  ];

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const isKeywordMatch = sensitiveKeys.some((keyword) =>
      key.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isKeywordMatch) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else if (typeof value === 'string' && detectSecrets(value).hasSecrets) {
      sanitized[key] = '[REDACTED - SECRET DETECTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Create safe logger wrapper
 * Automatically sanitizes sensitive data
 */
export const createSafeLogger = (logger) => {
  return {
    log: (message, data) => {
      logger.log(message, sanitizeForLogging(data));
    },
    info: (message, data) => {
      logger.info(message, sanitizeForLogging(data));
    },
    warn: (message, data) => {
      logger.warn(message, sanitizeForLogging(data));
    },
    error: (message, data) => {
      logger.error(message, sanitizeForLogging(data));
    },
    debug: (message, data) => {
      logger.debug(message, sanitizeForLogging(data));
    },
  };
};

/**
 * Scan process environment for exposed secrets
 * Should be called on startup to alert to configuration issues
 */
export const scanEnvironmentForSecrets = () => {
  const issues = [];
  const allowedSecretKeys = [
    'JWT_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_PASS',
    'RAZORPAY_KEY_SECRET',
  ];

  for (const [key, value] of Object.entries(process.env)) {
    // Check if this is a legitimate secret key
    if (!allowedSecretKeys.includes(key)) {
      const detection = detectSecrets(value);
      if (detection.hasSecrets) {
        issues.push({
          severity: 'WARNING',
          message: `Potential secret in environment variable: ${key}`,
          details: detection.summary,
        });
      }
    }
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
};

export default {
  detectSecrets,
  sanitizeForLogging,
  createSafeLogger,
  scanEnvironmentForSecrets,
};
