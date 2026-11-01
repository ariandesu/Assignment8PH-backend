// Runs a validator function against req.body and returns 400 with all errors.
export const validate = (validatorFn) => (req, res, next) => {
  const result = validatorFn(req.body || {});
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: result.errors[0] || 'Validation failed',
      errors: result.errors,
    });
  }
  next();
};
