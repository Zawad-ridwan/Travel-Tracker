import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names and removes Tailwind conflicts: cn('px-2', isBig && 'px-4') → 'px-4' */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
