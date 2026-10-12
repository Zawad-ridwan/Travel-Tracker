import { RouterProvider } from 'react-router';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/lib/theme';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider>
      {/* "user" = follow the system's reduce-motion setting */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  );
}
