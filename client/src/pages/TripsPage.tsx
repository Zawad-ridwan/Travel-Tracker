import { Backpack, CalendarDays, GripVertical, PiggyBank, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ComingSoon } from '@/components/ComingSoon';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';

export default function TripsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trips"
        title="Your adventures"
        description="Plan day by day, keep your budget on track and invite friends along."
        actions={
          <Button onClick={() => toast('Trip planning arrives in Phase 2')}>
            <Plus /> New trip
          </Button>
        }
      />
      <ComingSoon
        phase={2}
        features={[
          {
            icon: CalendarDays,
            title: 'Trip hub',
            description: 'Every trip with a countdown, cover photo and progress.',
          },
          {
            icon: GripVertical,
            title: 'Drag-and-drop itinerary',
            description: 'Arrange places day by day, with times and notes.',
          },
          {
            icon: PiggyBank,
            title: 'Budget ring',
            description: 'Planned vs spent, in any currency, at a glance.',
          },
          {
            icon: Backpack,
            title: 'Packing checklist',
            description: 'Templates for beach, city and hiking trips.',
          },
          {
            icon: Users,
            title: 'Group trips',
            description: 'Plan together and split costs (Phase 5).',
          },
        ]}
      />
    </>
  );
}
