import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error class with HTTP status code and error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: object;

  constructor(statusCode: number, code: string, message: string, details?: object) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Success response envelope.
 */
export interface SuccessEnvelope<T> {
  status: 'success';
  data: T;
}

/**
 * Error response envelope.
 */
export interface ErrorEnvelope {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: object;
  };
}

/**
 * Send a success response with the standard envelope structure.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const envelope: SuccessEnvelope<T> = {
    status: 'success',
    data,
  };
  res.status(statusCode).json(envelope);
}

/**
 * Send an error response with the standard envelope structure.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: object
): void {
  const envelope: ErrorEnvelope = {
    status: 'error',
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  res.status(statusCode).json(envelope);
}

/**
 * Global Express error handling middleware.
 * Catches errors thrown in route handlers and returns a consistent error envelope.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
  } else {
    sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }
}
