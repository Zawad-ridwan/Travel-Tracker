import { z } from 'zod';
import { HttpError } from '../middleware/errors';

/**
 * Checks data against a shared schema. On failure throws a 400 error
 * listing each field's problem, which the forms show under the inputs.
 */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const { fieldErrors, formErrors } = z.flattenError(result.error);
    const fields = fieldErrors as Record<string, string[]>;
    const message = formErrors[0] ?? 'Some fields need fixing';
    throw new HttpError(400, message, 'VALIDATION_ERROR', fields);
  }
  return result.data;
}
