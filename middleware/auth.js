const jwt = require('jsonwebtoken');

function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ message: 'No token provided' });
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
      req.user = payload;
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

function optionalAuth() {
  return (req, _res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        req.user = payload;
      }
    } catch (err) {
      // ignore invalid token for optional auth
    }
    next();
  };
}

module.exports = { auth, optionalAuth };
