import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Joi from 'joi';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('Validation-Middleware');
const ajv = new Ajv({ coerceTypes: true, allErrors: true });
addFormats(ajv);

/**
 * Universal Request Validation Middleware
 * Supports Joi schemas, Zod schemas, or raw JSON schemas for body, query, and params.
 * 
 * @example
 * router.post('/login', validateRequest({ body: loginSchema }), handler);
 */
export const validateRequest = ({ body, query, params }) => {
  return (req, res, next) => {
    const validateTarget = (targetName, schema, data) => {
      if (!schema || !data) return null;

      // 1. Joi Schema support
      if (typeof schema.validate === 'function') {
        const { error, value } = schema.validate(data, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          return {
            target: targetName,
            message: error.details.map((d) => d.message.replace(/['"]/g, '')).join('; '),
            details: error.details,
          };
        }
        // Replace target with sanitized/stripped value
        req[targetName] = value;
        return null;
      }

      // 2. Zod Schema support (parse / safeParse)
      if (typeof schema.safeParse === 'function') {
        const result = schema.safeParse(data);
        if (!result.success) {
          const issues = result.error.issues || [];
          return {
            target: targetName,
            message: issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
            details: issues,
          };
        }
        req[targetName] = result.data;
        return null;
      }

      // 3. Ajv JSON Schema support
      try {
        const compiled = ajv.compile(schema);
        const isValid = compiled(data);
        if (!isValid) {
          const errors = compiled.errors || [];
          return {
            target: targetName,
            message: errors.map((e) => `${e.instancePath || targetName} ${e.message}`).join('; '),
            details: errors,
          };
        }
      } catch (err) {
        logger.warn('Ajv compilation error in validation middleware:', err.message);
      }

      return null;
    };

    const errors = [];
    if (body) {
      const err = validateTarget('body', body, req.body);
      if (err) errors.push(err);
    }
    if (query) {
      const err = validateTarget('query', query, req.query);
      if (err) errors.push(err);
    }
    if (params) {
      const err = validateTarget('params', params, req.params);
      if (err) errors.push(err);
    }

    if (errors.length > 0) {
      const combinedMessage = errors.map((e) => e.message).join('; ');
      logger.info('Request validation failed', {
        path: req.originalUrl,
        method: req.method,
        errors,
      });

      return res.status(400).json({
        success: false,
        error: combinedMessage,
        message: combinedMessage,
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    next();
  };
};

/**
 * Middleware to validate request body against a JSON schema (Legacy Ajv compatibility)
 */
export const validateRequestBody = (schema) => {
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
        error: `Invalid request: ${errorMessages}`,
        message: `Invalid request: ${errorMessages}`,
        code: 'VALIDATION_ERROR',
        errors: validate.errors
      });
    }

    next();
  };
};

/**
 * Middleware to validate query parameters (Legacy Ajv compatibility)
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
        error: `Invalid query parameters: ${errorMessages}`,
        message: `Invalid query parameters: ${errorMessages}`,
        code: 'VALIDATION_ERROR',
        errors: validate.errors
      });
    }

    next();
  };
};

/**
 * Middleware to validate URL parameters (Legacy Ajv compatibility)
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
        error: `Invalid URL parameters: ${errorMessages}`,
        message: `Invalid URL parameters: ${errorMessages}`,
        code: 'VALIDATION_ERROR',
        errors: validate.errors
      });
    }

    next();
  };
};

export { Joi };
export default {
  validateRequest,
  validateRequestBody,
  validateQueryParams,
  validateUrlParams,
  Joi,
};
