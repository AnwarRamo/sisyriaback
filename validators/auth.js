import { body } from 'express-validator';

// Reusable error message function
const errorMessage = (field, message) => `${field} ${message}`;

const validateUserRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage(errorMessage('Username', 'is required'))
    .isLength({ min: 3, max: 31 }).withMessage(errorMessage('Username', 'should be between 3 and 31 characters')),

  body('email')
    .trim()
    .notEmpty().withMessage(errorMessage('Email', 'is required'))
    .isEmail().withMessage(errorMessage('Email', 'Invalid email address')),

  body('password')
    .trim()
    .notEmpty().withMessage(errorMessage('Password', 'is required'))
    .isLength({ min: 8 }).withMessage(errorMessage('Password', 'should be at least 8 characters long'))
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Display name should be less than 50 characters'),

  body('phone')
    .trim()
    .notEmpty().withMessage(errorMessage('Phone number', 'is required'))
    .isLength({ max: 20 }).withMessage('Phone number should be less than 20 characters'),

  body('nationalId')
    .trim()
    .notEmpty().withMessage(errorMessage('National ID', 'is required'))
    .isLength({ max: 20 }).withMessage('National ID should be less than 20 characters'),

  body('image')
    .optional()
    .isString().withMessage('User image must be a string')
    .isLength({ max: 255 }).withMessage('Image path is too long')
    .custom((value) => {
      const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp|bmp))$/i;
      const filePathRegex = /^public\/images\/users\/.*\.(?:png|jpg|jpeg|gif|svg|webp|bmp)$/i;
      if (value && !urlRegex.test(value) && !filePathRegex.test(value)) {
        throw new Error('User image must be a valid URL or file path');
      }
      return true;
    }),
];

const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage(errorMessage('Email', 'is required'))
    .isEmail().withMessage(errorMessage('Email', 'Invalid email address')),

  body('password')
    .trim()
    .notEmpty().withMessage(errorMessage('Password', 'is required'))
    .isLength({ min: 6 }).withMessage(errorMessage('Password', 'should be at least 6 characters long')),
];

const validateToken = [
  body('token')
    .trim()
    .notEmpty().withMessage('Token is required'),
];

export { validateUserRegistration, validateUserLogin, validateToken };
