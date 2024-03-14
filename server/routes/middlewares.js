import env from 'dotenv'
import jwt from 'jsonwebtoken'
env.config('../')
const JWT_SECRET = process.env.JWT_SECRET

export const verifyJWTMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No token!' });
  }

  jwt.verify(token, JWT_SECRET, {}, (err, userData) => {
    if (err) {
      return res.status(401).json({ error: 'Error validating token!' });
    }
    
    req.verified = {};

    Object.assign(req.verified, userData);

    next(); 
  });
};