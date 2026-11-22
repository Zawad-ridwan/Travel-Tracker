import { useState } from 'react';
import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-28 text-4xl',
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase();
}

/** Profile photo, or the person's initials on a warm background when there is none. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-display font-bold text-primary ring-2 ring-surface',
        sizes[size],
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={name}>{initials(name)}</span>
      )}
    </span>
  );
}
