import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError } from './api';

/**
 * Shows a server error on the form: field problems under their inputs,
 * anything else as a toast. Returns nothing; call it from a mutation's onError.
 */
export function showServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  if (error instanceof ApiError) {
    const fields = error.fields ?? {};
    const names = Object.keys(fields);
    for (const name of names) {
      const message = fields[name]?.[0];
      if (message) setError(name as Path<T>, { type: 'server', message });
    }
    if (names.length === 0) {
      toast.error(error.message);
    }
    return;
  }
  toast.error('Something went wrong. Please try again.');
}
