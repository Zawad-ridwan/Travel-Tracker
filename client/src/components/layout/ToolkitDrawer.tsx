import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowLeftRight,
  Backpack,
  Clock,
  CloudSun,
  HandCoins,
  Languages,
  Plug,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Drawer } from '@/components/ui';
import { CurrencyConverter } from '@/features/currency/CurrencyConverter';
import { pickNextTrip } from '@/features/trips/display';
import { useTripList } from '@/features/trips/useTrips';
import { useToolkit } from './toolkit';

/** Tools that open inside the drawer. */
type ToolView = 'currency';

interface Tool {
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  /** The phase it arrives in; tools that already work have none. */
  phase?: number;
  view?: ToolView;
}

const TOOLS: Tool[] = [
  {
    name: 'Currency',
    description: 'Convert 40+ currencies',
    icon: ArrowLeftRight,
    tone: 'bg-accent-soft text-accent',
    view: 'currency',
  },
  {
    name: 'Phrasebook',
    description: 'Key phrases, read aloud',
    icon: Languages,
    tone: 'bg-primary-soft text-primary',
    phase: 3,
  },
  {
    name: 'Weather',
    description: '7-day forecast',
    icon: CloudSun,
    tone: 'bg-sun-soft text-sun',
    phase: 3,
  },
  {
    name: 'Time zones',
    description: 'Local time anywhere',
    icon: Clock,
    tone: 'bg-accent-soft text-accent',
    phase: 3,
  },
  {
    name: 'Plug types',
    description: 'Adapters and voltage',
    icon: Plug,
    tone: 'bg-sun-soft text-sun',
    phase: 3,
  },
  {
    name: 'Emergency',
    description: 'Police, ambulance, fire',
    icon: Siren,
    tone: 'bg-primary-soft text-primary',
    phase: 3,
  },
  {
    name: 'Tipping guide',
    description: 'What is normal where',
    icon: HandCoins,
    tone: 'bg-accent-soft text-accent',
    phase: 3,
  },
  {
    name: 'Packing list',
    description: 'Never forget a charger',
    icon: Backpack,
    tone: 'bg-sun-soft text-sun',
  },
];

/** Quick travel tools, one tap away from every screen. */
export function ToolkitDrawer() {
  const { open, setOpen } = useToolkit();
  const [view, setView] = useState<ToolView | null>(null);
  const navigate = useNavigate();
  const { data: trips } = useTripList();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setView(null);
  };

  const openTool = (tool: Tool) => {
    if (tool.view) return setView(tool.view);
    if (tool.name === 'Packing list') {
      // Straight to the packing list of the next trip, if there is one
      const next = trips ? pickNextTrip(trips) : undefined;
      onOpenChange(false);
      navigate(next ? `/trips/${next.id}?tab=packing` : '/trips');
      return;
    }
    toast(`${tool.name} arrives in Phase ${tool.phase}`);
  };

  if (view === 'currency') {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} title="Currency" description="Live rates for 70+ currencies.">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 self-start" onClick={() => setView(null)}>
          <ArrowLeft /> All tools
        </Button>
        <CurrencyConverter />
      </Drawer>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Toolkit"
      description="Handy tools for the road. More go live in the coming phases."
    >
      <ul className="grid grid-cols-2 gap-3">
        {TOOLS.map((tool) => {
          const { name, description, icon: Icon, tone, phase } = tool;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => openTool(tool)}
                className="flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{name}</span>
                  <span className="block text-sm text-muted">{description}</span>
                </span>
                {phase ? (
                  <Badge tone="outline" className="mt-auto">
                    Phase {phase}
                  </Badge>
                ) : (
                  <Badge tone="success" className="mt-auto">
                    Ready
                  </Badge>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Drawer>
  );
}
