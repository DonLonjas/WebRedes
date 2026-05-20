// middleware/checkRole.js

function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Sin permiso' });
    }
    next();
  };
}

module.exports = checkRole;
