const { validationResult } = require('express-validator');

const runValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.error('Validation Errors:', errors.array()); // Optional: log the validation errors for debugging

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR', // Optional: add errorCode for clarity
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value, // Optionally include the failed value
      })),
    });
  }

  next();
};

module.exports = runValidation;
