import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stats_o_locked_jwt_super_secret_key_2026';

export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Authentication required. Please log in as Admin.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired session token.' });
  }
}
