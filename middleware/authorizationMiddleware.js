// middleware/authorizationMiddleware.js - Role-Based Authorization Middleware

/**
 * Middleware to check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access forbidden. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Check if user is admin (sparta or reception)
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'NOT_AUTHENTICATED',
    });
  }

  const adminRoles = ['sparta', 'reception'];

  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Admin access required.',
      code: 'ADMIN_ONLY',
    });
  }

  next();
};

/**
 * Check if user is sparta (highest permission level)
 */
const isSpartaOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
      code: 'NOT_AUTHENTICATED',
    });
  }

  if (req.user.role !== 'sparta') {
    return res.status(403).json({
      error: 'Sparta-level access required.',
      code: 'SPARTA_ONLY',
    });
  }

  next();
};

/**
 * Check if user can access resource (owns it or is admin)
 * @param {string} userIdParam - Name of the route parameter containing userId
 */
const canAccessUserResource = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'NOT_AUTHENTICATED',
      });
    }

    const targetUserId = req.params[userIdParam];
    const adminRoles = ['sparta', 'reception'];

    // Allow if admin or accessing own resource
    if (adminRoles.includes(req.user.role) || req.user.userId === targetUserId) {
      return next();
    }

    return res.status(403).json({
      error: 'Access forbidden. Can only access own resources.',
      code: 'ACCESS_DENIED',
    });
  };
};

module.exports = {
  authorize,
  isAdmin,
  isSpartaOnly,
  canAccessUserResource,
};
