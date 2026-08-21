import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import * as db from './db.js';

export const SECRET = process.env.JWT_SECRET || 'ssl-billing-gst-4f8c1d9b2e7a6350bd1c8ea4297f5b6031ac';
export const EXPIRE_HOURS = parseInt(process.env.JWT_EXPIRE_HOURS || '12', 10);

export const ROLE_MODULES: Record<string, string[]> = {
  admin: ['dashboard', 'invoices', 'customers', 'payments', 'expenses', 'reports', 'settings', 'users'],
  staff: ['dashboard', 'invoices', 'customers', 'payments'],
  accountant: ['dashboard', 'invoices', 'payments', 'expenses', 'reports'],
};

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hashed: string): boolean {
  try {
    return bcrypt.compareSync(pw, hashed);
  } catch {
    return false;
  }
}

export function createToken(user: Record<string, any>): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, SECRET, { expiresIn: `${EXPIRE_HOURS}h` });
}

export function publicUser(u: Record<string, any>) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name || '',
    role: u.role,
    is_active: u.is_active ?? true,
    last_login: u.last_login,
    created_at: u.created_at,
    modules: ROLE_MODULES[u.role] || [],
  };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'You are not signed in. Please log in to continue.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string; email: string; role: string };
    const user = await db.selectOne('app_users', { id: `eq.${payload.sub}` });
    if (!user) {
      return res.status(401).json({ detail: 'This user account no longer exists.' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ detail: 'This account has been deactivated. Contact your administrator.' });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Your session has expired. Please log in again.' });
    }
    return res.status(401).json({ detail: 'Your session is invalid. Please log in again.' });
  }
}

export function requireModule(moduleName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ detail: 'You are not signed in.' });
    }
    const allowed = ROLE_MODULES[user.role] || [];
    if (!allowed.includes(moduleName)) {
      return res.status(403).json({ detail: `Your role (${user.role}) does not have access to ${moduleName}.` });
    }
    next();
  };
}

export const requireAdmin = requireModule('users');
