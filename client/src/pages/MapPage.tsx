import { Bus, Globe, Landmark, LocateFixed, Route } from 'lucide-react';
import { ComingSoon } from '@/components/ComingSoon';
import { PageHeader } from '@/components/PageHeader';

export default function MapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Map"
        title="Your world, mapped"
        description="See your trips, saved places and every country you have stamped."
      />
      <ComingSoon
        phase={3}
        features={[
          {
            icon: Globe,
            title: 'Scratch map',
            description: 'Countries fill with colour as you visit them.',
          },
          {
            icon: Landmark,
            title: 'Destination guides',
            description: 'Sights, food and tips from Wikivoyage and OpenTripMap.',
          },
          {
            icon: LocateFixed,
            title: 'Nearby essentials',
            description: 'ATMs, pharmacies and cafés around you.',
          },
          {
            icon: Route,
            title: 'Directions',
            description: 'Walking, cycling and driving routes between places.',
          },
          {
            icon: Bus,
            title: 'Public transport',
            description: 'Transit routes for selected cities.',
          },
        ]}
      />
    </>
  );
}
