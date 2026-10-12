import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

/** An image that shows a soft placeholder instead of a broken icon if it fails to load. */
export function Photo({ className, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'grid place-items-center bg-linear-to-br from-primary-soft via-sun-soft to-accent-soft text-muted',
          className,
        )}
      >
        <ImageOff className="size-6 opacity-60" />
      </div>
    );
  }

  return (
    <img
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
      {...props}
    />
  );
}
