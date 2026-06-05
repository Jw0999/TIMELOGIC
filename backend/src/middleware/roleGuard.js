function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

const isEmployee   = requireRole('EMPLOYEE', 'ADMIN', 'SUPER_ADMIN');
const isAdmin      = requireRole('ADMIN', 'SUPER_ADMIN');
const isSuperAdmin = requireRole('SUPER_ADMIN');

module.exports = { requireRole, isEmployee, isAdmin, isSuperAdmin };
