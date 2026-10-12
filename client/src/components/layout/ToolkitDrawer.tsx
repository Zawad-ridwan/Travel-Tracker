import {
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
import { Badge, Drawer } from '@/components/ui';
import { useToolkit } from './toolkit';

interface Tool {
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  phase: number;
}

const TOOLS: Tool[] = [
  {
    name: 'Currency',
    description: 'Convert 40+ currencies',
    icon: ArrowLeftRight,
    tone: 'bg-accent-soft text-accent',
    phase: 2,
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
    phase: 2,
  },
];

/** Quick travel tools, one tap away from every screen. */
export function ToolkitDrawer() {
  const { open, setOpen } = useToolkit();

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="Toolkit"
      description="Handy tools for the road. They go live in the coming phases."
    >
      <ul className="grid grid-cols-2 gap-3">
        {TOOLS.map(({ name, description, icon: Icon, tone, phase }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => toast(`${name} arrives in Phase ${phase}`)}
              className="flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{name}</span>
                <span className="block text-sm text-muted">{description}</span>
              </span>
              <Badge tone="outline" className="mt-auto">
                Phase {phase}
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
