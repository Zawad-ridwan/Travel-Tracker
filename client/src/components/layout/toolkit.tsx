import { createContext, useContext, useState, type ReactNode } from 'react';

interface ToolkitContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ToolkitContext = createContext<ToolkitContextValue | null>(null);

/** Lets any component open the Toolkit drawer: const { setOpen } = useToolkit(); */
export function ToolkitProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <ToolkitContext.Provider value={{ open, setOpen }}>{children}</ToolkitContext.Provider>;
}

export function useToolkit() {
  const ctx = useContext(ToolkitContext);
  if (!ctx) throw new Error('useToolkit must be used inside <ToolkitProvider>');
  return ctx;
}
