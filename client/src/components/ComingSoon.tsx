import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, Stamp } from '@/components/ui';

export interface UpcomingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ComingSoonProps {
  phase: number;
  features: UpcomingFeature[];
}

/** Shows what a tab will hold and in which phase it arrives. */
export function ComingSoon({ phase, features }: ComingSoonProps) {
  return (
    <Card className="paper-dots relative overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex shrink-0 justify-center lg:w-48">
          <Stamp
            label="Arriving in"
            title={`Phase ${phase}`}
            caption="Under construction"
            size="lg"
            rotate={-10}
            animate
          />
        </div>

        <ul className="grid flex-1 gap-3 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="flex gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-muted">{description}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
