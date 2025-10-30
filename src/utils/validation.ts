/**
 * Validation Utilities - AutoRentar
 * 
 * Type-safe validation helpers
 */

import type { ApiError, ApiResponse } from '../types/database.types';

// ============================================================================
// RESULT TYPE
// ============================================================================

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
  };
}

export function createErrorResponse<T>(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<T> {
  return {
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
}

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is { data: T; error: null } {
  return response.error === null && response.data !== null;
}

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is { data: null; error: ApiError } {
  return response.error !== null;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validate<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

export const Validators = {
  required: <T>(message = 'Field is required'): ValidationRule<T | null | undefined> => ({
    validate: (value): boolean => value !== null && value !== undefined && value !== '',
    message,
  }),

  minLength:
    (min: number, message?: string): ValidationRule<string> =>
    ({
      validate: (value): boolean => value.length >= min,
      message: message ?? `Minimum length is ${min}`,
    }),

  maxLength:
    (max: number, message?: string): ValidationRule<string> =>
    ({
      validate: (value): boolean => value.length <= max,
      message: message ?? `Maximum length is ${max}`,
    }),

  min:
    (min: number, message?: string): ValidationRule<number> =>
    ({
      validate: (value): boolean => value >= min,
      message: message ?? `Minimum value is ${min}`,
    }),

  max:
    (max: number, message?: string): ValidationRule<number> =>
    ({
      validate: (value): boolean => value <= max,
      message: message ?? `Maximum value is ${max}`,
    }),

  pattern:
    (regex: RegExp, message = 'Invalid format'): ValidationRule<string> =>
    ({
      validate: (value): boolean => regex.test(value),
      message,
    }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value): boolean =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  uuid: (message = 'Invalid UUID'): ValidationRule<string> => ({
    validate: (value): boolean =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      ),
    message,
  }),

  phone: (message = 'Invalid phone number'): ValidationRule<string> => ({
    validate: (value): boolean => /^\+?[1-9]\d{1,14}$/.test(value),
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value): boolean => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  future: (message = 'Date must be in the future'): ValidationRule<string | Date> => ({
    validate: (value): boolean => {
      const date = value instanceof Date ? value : new Date(value);
      return date.getTime() > Date.now();
    },
    message,
  }),

  past: (message = 'Date must be in the past'): ValidationRule<string | Date> => ({
    validate: (value): boolean => {
      const date = value instanceof Date ? value : new Date(value);
      return date.getTime() < Date.now();
    },
    message,
  }),

  positive: (message = 'Value must be positive'): ValidationRule<number> => ({
    validate: (value): boolean => value > 0,
    message,
  }),

  nonNegative: (message = 'Value must be non-negative'): ValidationRule<number> => ({
    validate: (value): boolean => value >= 0,
    message,
  }),

  integer: (message = 'Value must be an integer'): ValidationRule<number> => ({
    validate: (value): boolean => Number.isInteger(value),
    message,
  }),

  oneOf:
    <T>(values: T[], message?: string): ValidationRule<T> =>
    ({
      validate: (value): boolean => values.includes(value),
      message: message ?? `Value must be one of: ${values.join(', ')}`,
    }),
};

// ============================================================================
// SANITIZATION
// ============================================================================

export const Sanitizers = {
  trim: (value: string): string => value.trim(),

  lowercase: (value: string): string => value.toLowerCase(),

  uppercase: (value: string): string => value.toUpperCase(),

  removeWhitespace: (value: string): string => value.replace(/\s+/g, ''),

  normalizeWhitespace: (value: string): string => value.replace(/\s+/g, ' ').trim(),

  removeSpecialChars: (value: string): string => value.replace(/[^\w\s]/gi, ''),

  toNumber: (value: string): number | null => {
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  toBoolean: (value: unknown): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return false;
  },
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ValidationError extends Error {
  constructor(
    public readonly errors: string[],
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function assertValid<T>(
  value: T,
  rules: ValidationRule<T>[]
): asserts value is T {
  const result = validate(value, rules);

  if (!result.isValid) {
    throw new ValidationError(result.errors);
  }
}

// ============================================================================
// TYPE-SAFE PARSERS
// ============================================================================

export function parseJSON<T>(json: string): Result<T> {
  try {
    const value = JSON.parse(json) as T;
    return Ok(value);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('JSON parse failed'));
  }
}

export function parseDate(value: string | Date): Result<Date> {
  try {
    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      return Err(new Error('Invalid date'));
    }

    return Ok(date);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error('Date parse failed'));
  }
}

export function parseInt(value: string, radix = 10): Result<number> {
  const num = Number.parseInt(value, radix);

  if (isNaN(num)) {
    return Err(new Error('Invalid integer'));
  }

  return Ok(num);
}

export function parseFloat(value: string): Result<number> {
  const num = Number.parseFloat(value);

  if (isNaN(num)) {
    return Err(new Error('Invalid float'));
  }

  return Ok(num);
}
