/**
 * Express middleware for validating request payloads against shared @preploop/contracts Zod schemas.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues?.[0];
      return res.status(400).json({
        error: firstIssue?.message || 'Invalid request payload',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    return next();
  };
}
