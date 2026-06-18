import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  sendSuccess,
  sendError,
  globalErrorHandler,
} from '../../middleware/errorHandler';
import {
  validateInteger,
  validateRequired,
  validateEnum,
} from '../../middleware/validation';

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create an error with statusCode, code, and message', () => {
      const err = new AppError(404, 'ZONE_NOT_FOUND', 'Zone not found');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('ZONE_NOT_FOUND');
      expect(err.message).toBe('Zone not found');
      expect(err.details).toBeUndefined();
    });

    it('should create an error with optional details', () => {
      const details = { field: 'zoneId' };
      const err = new AppError(400, 'INVALID_PARAMETER', 'Bad param', details);
      expect(err.details).toEqual(details);
    });
  });

  describe('sendSuccess', () => {
    it('should produce correct success envelope with status 200', () => {
      const res = mockResponse();
      const data = { zones: [{ id: '1' }] };

      sendSuccess(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { zones: [{ id: '1' }] },
      });
    });

    it('should allow a custom status code', () => {
      const res = mockResponse();
      sendSuccess(res, { created: true }, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { created: true },
      });
    });
  });

  describe('sendError', () => {
    it('should produce correct error envelope with code and message', () => {
      const res = mockResponse();

      sendError(res, 404, 'ZONE_NOT_FOUND', 'Zone not found');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: {
          code: 'ZONE_NOT_FOUND',
          message: 'Zone not found',
        },
      });
    });

    it('should include details when provided', () => {
      const res = mockResponse();
      const details = { param: 'limit', received: -1 };

      sendError(res, 400, 'INVALID_PARAMETER', 'Invalid param', details);

      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid param',
          details: { param: 'limit', received: -1 },
        },
      });
    });
  });

  describe('globalErrorHandler', () => {
    const req = {} as Request;
    const next = vi.fn() as NextFunction;

    it('should handle AppError and produce correct response', () => {
      const res = mockResponse();
      const err = new AppError(404, 'ZONE_NOT_FOUND', 'Zone not found');

      globalErrorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: {
          code: 'ZONE_NOT_FOUND',
          message: 'Zone not found',
        },
      });
    });

    it('should handle AppError with details', () => {
      const res = mockResponse();
      const err = new AppError(400, 'INVALID_PARAMETER', 'Bad input', { field: 'x' });

      globalErrorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Bad input',
          details: { field: 'x' },
        },
      });
    });

    it('should handle unknown errors and produce INTERNAL_ERROR', () => {
      const res = mockResponse();
      const err = new Error('something unexpected');

      globalErrorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });
});

describe('validation', () => {
  describe('validateInteger', () => {
    it('should return valid integer within range', () => {
      expect(validateInteger('5', 1, 10, 'limit')).toBe(5);
      expect(validateInteger(3, 1, 10, 'limit')).toBe(3);
    });

    it('should throw AppError for non-integer values', () => {
      expect(() => validateInteger('abc', 1, 10, 'limit')).toThrow(AppError);
      expect(() => validateInteger('3.5', 1, 10, 'limit')).toThrow(AppError);
    });

    it('should throw AppError with INVALID_PARAMETER code', () => {
      try {
        validateInteger('abc', 1, 10, 'limit');
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe('INVALID_PARAMETER');
        expect((e as AppError).statusCode).toBe(400);
      }
    });

    it('should throw AppError for values outside range', () => {
      expect(() => validateInteger('0', 1, 10, 'limit')).toThrow(AppError);
      expect(() => validateInteger('11', 1, 10, 'limit')).toThrow(AppError);
    });
  });

  describe('validateRequired', () => {
    it('should return the value when it is not null or undefined', () => {
      expect(validateRequired('hello', 'name')).toBe('hello');
      expect(validateRequired(0, 'count')).toBe(0);
      expect(validateRequired('', 'field')).toBe('');
    });

    it('should throw AppError for null values', () => {
      expect(() => validateRequired(null, 'name')).toThrow(AppError);
    });

    it('should throw AppError for undefined values', () => {
      expect(() => validateRequired(undefined, 'name')).toThrow(AppError);
    });

    it('should throw with INVALID_PARAMETER code on failure', () => {
      try {
        validateRequired(null, 'zoneId');
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe('INVALID_PARAMETER');
        expect((e as AppError).statusCode).toBe(400);
      }
    });
  });

  describe('validateEnum', () => {
    const allowed = ['low', 'medium', 'high', 'critical'] as const;

    it('should return the value when it is in the allowed list', () => {
      expect(validateEnum('low', [...allowed], 'priority')).toBe('low');
      expect(validateEnum('critical', [...allowed], 'priority')).toBe('critical');
    });

    it('should throw AppError for values not in the allowed list', () => {
      expect(() => validateEnum('unknown', [...allowed], 'priority')).toThrow(AppError);
    });

    it('should throw with INVALID_PARAMETER code on failure', () => {
      try {
        validateEnum('invalid', [...allowed], 'priority');
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe('INVALID_PARAMETER');
        expect((e as AppError).statusCode).toBe(400);
        expect((e as AppError).message).toContain('priority');
      }
    });
  });
});
