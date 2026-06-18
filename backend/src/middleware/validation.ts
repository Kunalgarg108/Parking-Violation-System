import { AppError } from './errorHandler';

/**
 * Validates that a value is a valid integer within the specified range.
 * Returns the parsed integer on success, throws AppError on failure.
 */
export function validateInteger(
  value: unknown,
  min: number,
  max: number,
  paramName: string
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new AppError(
      400,
      'INVALID_PARAMETER',
      `Parameter '${paramName}' must be an integer`
    );
  }

  if (parsed < min || parsed > max) {
    throw new AppError(
      400,
      'INVALID_PARAMETER',
      `Parameter '${paramName}' must be between ${min} and ${max}`
    );
  }

  return parsed;
}

/**
 * Validates that a value is not null or undefined.
 * Returns the value on success, throws AppError on failure.
 */
export function validateRequired<T>(value: T | null | undefined, paramName: string): T {
  if (value === null || value === undefined) {
    throw new AppError(
      400,
      'INVALID_PARAMETER',
      `Parameter '${paramName}' is required`
    );
  }

  return value;
}

/**
 * Validates that a value is one of the allowed values.
 * Returns the value on success, throws AppError on failure.
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowed: T[],
  paramName: string
): T {
  if (!allowed.includes(value as T)) {
    throw new AppError(
      400,
      'INVALID_PARAMETER',
      `Parameter '${paramName}' must be one of: ${allowed.join(', ')}`
    );
  }

  return value as T;
}
