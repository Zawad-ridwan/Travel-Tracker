import { Link } from 'react-router';
import { Award, TrendingUp, Footprints, History, LogIn, MapPin, UserPlus } from 'lucide-react';
import { ComingSoon } from '@/components/ComingSoon';
import { PageHeader } from '@/components/PageHeader';
import { buttonVariants, Card, Stamp } from '@/components/ui';
import { PREVIEW_STAMPS } from '@/data/sample';
import { cn } from '@/lib/cn';

export default function MePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Me"
        title="Your travel passport"
        description="Every country you visit earns a stamp. How many can you collect?"
        actions={
          <>
            <Link to="/login" className={buttonVariants({ variant: 'secondary' })}>
              <LogIn /> Log in
            </Link>
            <Link to="/signup" className={buttonVariants()}>
              <UserPlus /> Sign up
            </Link>
          </>
        }
      />

      {/* Passport preview */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between gap-6 bg-primary p-6 text-primary-fg sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Passport</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary-fg">Traveller</h2>
            </div>
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                ['0', 'Countries'],
                ['0', 'Trips'],
                ['1', 'Level'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/15 p-3">
                  <dt className="text-xs opacity-80">{label}</dt>
                  <dd className="font-display text-2xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="paper-dots grid grid-cols-3 place-items-center gap-4 p-6 sm:grid-cols-3 sm:p-8">
            {PREVIEW_STAMPS.map((s) => (
              <Stamp
                key={s.title}
                title={s.title}
                label="Visited"
                tone={s.tone}
                rotate={s.rotate}
                size="sm"
                locked
              />
            ))}
          </div>
        </div>
      </Card>

      <ComingSoon
        phase={4}
        features={[
          {
            icon: MapPin,
            title: 'One-tap check-ins',
            description: 'Stamp a place the moment you arrive.',
          },
          {
            icon: Footprints,
            title: 'My Journeys',
            description: 'Your route on a map and a timeline of every trip.',
          },
          {
            icon: Award,
            title: 'Badges and XP',
            description: 'Level up as you plan, travel and share.',
          },
          {
            icon: TrendingUp,
            title: 'Travel stats',
            description: 'Countries, km travelled, days abroad.',
          },
          {
            icon: History,
            title: 'Trip recaps',
            description: 'A shareable card for every finished trip.',
          },
        ]}
      />

      <p className="text-center text-sm text-muted">
        Building the design?{' '}
        <Link to="/styleguide" className={cn('font-semibold text-primary underline-offset-4 hover:underline')}>
          Open the style guide
        </Link>
      </p>
    </div>
  );
}
