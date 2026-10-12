import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * A panel that slides in: from the bottom on phones (easy to reach with a thumb),
 * from the right on larger screens.
 */
export function Drawer({ open, onOpenChange, title, description, children, className }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex flex-col bg-surface shadow-lift',
            // Phone: bottom sheet
            'inset-x-0 bottom-0 max-h-[85dvh] animate-slide-in-up rounded-t-[2rem] border-t border-line',
            // Tablet and up: right panel
            'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:animate-slide-in-right sm:rounded-none sm:rounded-l-[2rem] sm:border-l sm:border-t-0',
            className,
          )}
        >
          {/* Grab handle on phones */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 sm:pt-6">
            <div>
              <Dialog.Title className="font-display text-2xl font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
