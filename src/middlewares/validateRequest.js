import { validate } from 'uuid';

// Lightweight request validation middleware using Zod-like schema validation
// We implement a simple schema validator to avoid heavy dependencies
export const validateRequest = (schema) => (req, res, next) => {
  try {
    const { error, value } = schema.validate(req.body);
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details,
      });
    }
    req.body = value;
    next();
  } catch (err) {
    next(err);
  }
};
