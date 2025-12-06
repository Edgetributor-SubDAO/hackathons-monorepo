/**
 * Global error handler middleware
 */
import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import { AppError } from '../lib/errors';
import { logger } from '../utils/logger';
import { isDevelopment } from '../config/env';

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If response already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(isDevelopment() && { stack: err.stack }),
      },
    });
  }

  // Handle unknown errors
  const statusCode = 500;
  return res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment()
        ? err.message
        : 'An internal error occurred',
      ...(isDevelopment() && { stack: err.stack }),
    },
  });
}

/**
 * Format GraphQL error for response
 */
export function formatGraphQLError(error: GraphQLError): GraphQLError {
  const originalError = error.originalError;

  // Handle known app errors
  if (originalError instanceof AppError) {
    return new GraphQLError(originalError.message, {
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
        ...(isDevelopment() && {
          stack: originalError.stack,
        }),
      },
      originalError,
    });
  }

  // Log unexpected errors
  if (!(originalError instanceof AppError)) {
    logger.error('Unexpected GraphQL error', {
      error: error.message,
      stack: error.stack,
      originalError: originalError?.message,
      originalStack: originalError?.stack,
    });
  }

  // Format unknown errors
  return new GraphQLError(
    isDevelopment() ? error.message : 'An internal error occurred',
    {
      extensions: {
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        ...(isDevelopment() && {
          stack: error.stack,
          originalError: originalError?.message,
        }),
      },
      originalError,
    }
  );
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

