/**
 * Express middleware for validating request payloads against shared @preploop/contracts Zod schemas.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const requestId = req.requestId || res.locals?.requestId || 'unknown';
      const firstIssue = result.error.issues?.[0];
      const message = firstIssue?.message || 'Invalid request payload';
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message,
        code: 'VALIDATION_ERROR',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
        requestId,
      });
    }
    req.body = result.data;
    return next();
  };
}
