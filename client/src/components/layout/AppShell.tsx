import { useState } from 'react';
import { ScrollRestoration, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { BottomTabBar } from './BottomTabBar';
import { Sidebar } from './Sidebar';
import { ToolkitDrawer } from './ToolkitDrawer';
import { ToolkitProvider } from './toolkit';
import { TopBar } from './TopBar';

/**
 * Keeps showing the page it first rendered. Without this, the page that is
 * animating out would switch to the new page's content halfway through.
 */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

/** The frame around every page: navigation, Toolkit and animated page changes. */
export function AppShell() {
  const location = useLocation();

  return (
    <ToolkitProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Sidebar />
      <div className="min-h-dvh md:pl-72">
        <TopBar />
        <main
          id="main"
          className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6 md:px-10 md:pb-16 md:pt-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <FrozenOutlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomTabBar />
      <ToolkitDrawer />
      <ScrollRestoration />
    </ToolkitProvider>
  );
}
