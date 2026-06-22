import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('Validation-Middleware');
const ajv = new Ajv();
addFormats(ajv);

/**
 * Middleware to validate request body against a JSON schema
 * @param {Object} schema - JSON schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateRequestBody = (schema) => {
  // Compile the schema for reuse
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const isValid = validate(req.body);

    if (!isValid) {
      const errors = validate.errors || [];
      const errorMessages = errors.map(err => 
        `${err.instancePath || 'Request body'} ${err.message} for property "${err.params?.additionalProperty || err.params?.missingProperty || ''}"`
      ).join('; ');

      logger.info('Request body validation failed', { 
        url: req.url, 
        method: req.method, 
        userId: req.user?.id,
        errors: errors 
      });

      return res.status(400).json({
        success: false,
        message: `Invalid request: ${errorMessages}`,
        errors: validate.errors
      });
    }

    next();
  };
};

/**
 * Middleware to validate query parameters
 * @param {Object} schema - JSON schema to validate query params against
 * @returns {Function} Express middleware function
 */
export const validateQueryParams = (schema) => {
  const validate = ajv.compile({
    type: 'object',
    properties: schema,
    additionalProperties: false
  });

  return (req, res, next) => {
    const isValid = validate(req.query);

    if (!isValid) {
      const errors = validate.errors || [];
      const errorMessages = errors.map(err => 
        `Query parameter ${err.instancePath || 'params'} ${err.message}`
      ).join('; ');

      logger.info('Query parameter validation failed', { 
        url: req.url, 
        method: req.method, 
        userId: req.user?.id,
        errors: errors 
      });

      return res.status(400).json({
        success: false,
        message: `Invalid query parameters: ${errorMessages}`,
        errors: validate.errors
      });
    }

    next();
  };
};

/**
 * Middleware to validate URL parameters
 * @param {Object} schema - JSON schema to validate URL params against
 * @returns {Function} Express middleware function
 */
export const validateUrlParams = (schema) => {
  const validate = ajv.compile({
    type: 'object',
    properties: schema,
    additionalProperties: false
  });

  return (req, res, next) => {
    const isValid = validate(req.params);

    if (!isValid) {
      const errors = validate.errors || [];
      const errorMessages = errors.map(err => 
        `URL parameter ${err.instancePath || 'params'} ${err.message}`
      ).join('; ');

      logger.info('URL parameter validation failed', { 
        url: req.url, 
        method: req.method, 
        userId: req.user?.id,
        errors: errors 
      });

      return res.status(400).json({
        success: false,
        message: `Invalid URL parameters: ${errorMessages}`,
        errors: validate.errors
      });
    }

    next();
  };
};

export default {
  validateRequestBody,
  validateQueryParams,
  validateUrlParams
};