const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');

router.post('/login', authLimiter, [
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('employeeCode').optional({ nullable: true, checkFalsy: true }).trim(),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((body) => {
    if (!body.email && !body.employeeCode) throw new Error('Provide email or employeeCode');
    return true;
  }),
], validate, ctrl.login);

router.post('/logout',          authenticate, ctrl.logout);
router.post('/refresh',         [body('refreshToken').notEmpty()], validate, ctrl.refresh);
router.get('/me',               authenticate, ctrl.me);
router.put('/change-password',  authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validate, ctrl.changePassword);

// Admin: create a user account
router.post('/users', authenticate, isAdmin, [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], validate, ctrl.createUser);

module.exports = router;
