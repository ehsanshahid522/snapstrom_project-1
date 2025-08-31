import { body, validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
export const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Post creation validation
export const validatePost = [
  body('caption')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Caption must be less than 1000 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  validate
];

// Comment validation
export const validateComment = [
  body('text')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
    .trim(),
  validate
];
