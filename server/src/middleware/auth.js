/**
 * JWT Authentication Middleware
 * Validates Bearer tokens and attaches user to request
 */

import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { query } from '../config/db.js';
import { logger } from '../config/logger.js';

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    
    /** @type {Object} */
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
    
    // Optionally verify user still exists in database
    const result = await query(
      'SELECT id, username, email, role FROM users WHERE id = $1 AND active = true',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    req.user = result.rows[0];
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const result = await query(
        'SELECT id, username, email, role FROM users WHERE id = $1 AND active = true',
        [decoded.userId]
      );
      
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        req.userId = decoded.userId;
      }
    } catch {
      // Token invalid or expired - continue without auth
      logger.debug('Optional auth: invalid token');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, username, email, role
 * @param {number} expiresIn - Token expiration in seconds
 * @returns {string} JWT token
 */
export function generateToken(user, expiresIn = 604800) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    },
    jwtSecret,
    { expiresIn }
  );
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} True if match
 */
export async function comparePassword(password, hash) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
