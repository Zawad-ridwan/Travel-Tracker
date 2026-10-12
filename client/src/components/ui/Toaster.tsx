import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/lib/theme';

/**
 * Place once in the app. Then show messages from anywhere:
 *   import { toast } from 'sonner';
 *   toast.success('Trip saved!');
 */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            'rounded-2xl! border! border-line! bg-surface! text-ink! shadow-lift! font-sans!',
          description: 'text-muted!',
          success: '[&_[data-icon]]:text-success!',
          error: '[&_[data-icon]]:text-danger!',
        },
      }}
    />
  );
}
