import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GraphQLContext } from '../types/context';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface AuthPayload {
  userId?: string;
  address?: string;
  isAdmin?: boolean;
}

/**
 * Extract authentication from request
 */
export function extractAuth(req: Request): AuthPayload {
  // Check for API key in header
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey && apiKey === process.env.API_KEY_SECRET) {
    return { isAdmin: true };
  }

  // Check for JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      return decoded;
    } catch (error) {
      // Invalid token, continue without auth
    }
  }

  // Check for wallet signature (for wallet-based auth)
  const walletAddress = req.headers['x-wallet-address'] as string;
  const walletSignature = req.headers['x-wallet-signature'] as string;
  if (walletAddress && walletSignature) {
    // In production, verify the signature
    // For now, just return the address
    return { address: walletAddress };
  }

  return {};
}

/**
 * Authentication middleware for Express
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = extractAuth(req);
  (req as any).auth = auth;
  next();
}

/**
 * Require authentication for GraphQL context
 */
export function requireAuth(context: GraphQLContext): void {
  if (!context.userId && !context.isAdmin) {
    throw new Error('Authentication required');
  }
}

/**
 * Require admin for GraphQL context
 */
export function requireAdmin(context: GraphQLContext): void {
  if (!context.isAdmin) {
    throw new Error('Admin access required');
  }
}

