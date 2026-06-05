const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/superAdminController');
const { authenticate } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');

// All routes require authentication + SUPER_ADMIN role
router.use(authenticate, isSuperAdmin);

router.get('/stats',                             ctrl.systemStats);
router.get('/notifications',                     ctrl.getNotifications);
router.get('/organizations',                     ctrl.listOrgs);
router.post('/organizations', [
  body('name').notEmpty().withMessage('Organization name is required'),
  body('admin.email').isEmail().normalizeEmail().withMessage('Valid admin email required'),
  body('admin.password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, ctrl.createOrg);
router.put('/organizations/:id',                 ctrl.updateOrg);
router.delete('/organizations/:id',              ctrl.deleteOrg);
router.get('/organizations/:id/users',           ctrl.orgUsers);
router.post('/organizations/:orgId/departments', [
  body('name').notEmpty().withMessage('Department name is required'),
], validate, ctrl.addDepartment);
router.get('/offices/:officeId/security',        ctrl.officeSecurityDetail);
router.put('/offices/:officeId/settings',        ctrl.updateOfficeSecurity);
router.get('/reports',                           ctrl.systemReport);
router.get('/employees/:userId/records',         ctrl.employeeFullRecord);
router.put('/employees/:userId/reemploy',        ctrl.reemployEmployee);

// User management: suspend/activate ADMINS only; reassign EMPLOYEES only
router.put('/profile',                           ctrl.updateProfile);
router.post('/reset',                            ctrl.resetSystem);
router.put('/users/:userId/suspend',             ctrl.suspendAdmin);
router.put('/users/:userId/activate',            ctrl.activateAdmin);
router.put('/users/:userId/reassign',            ctrl.reassignEmployee);

module.exports = router;
