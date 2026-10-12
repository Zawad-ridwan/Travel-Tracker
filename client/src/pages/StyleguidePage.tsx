import { useEffect, useState, type ReactNode } from 'react';
import { Inbox, Mail, Plane, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { HealthResponse } from '@tt/shared';
import { PageHeader } from '@/components/PageHeader';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  ProgressRing,
  Skeleton,
  Stamp,
} from '@/components/ui';
import { api } from '@/lib/api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const COLORS = [
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['surface-2', 'bg-surface-2'],
  ['ink', 'bg-ink'],
  ['muted', 'bg-muted'],
  ['line', 'bg-line'],
  ['primary', 'bg-primary'],
  ['primary-soft', 'bg-primary-soft'],
  ['accent', 'bg-accent'],
  ['accent-soft', 'bg-accent-soft'],
  ['sun', 'bg-sun'],
  ['sun-soft', 'bg-sun-soft'],
] as const;

type ApiStatus = { state: 'loading' } | { state: 'ok'; data: HealthResponse } | { state: 'down' };

/** Every building block in one place. Open /styleguide while building new screens. */
export default function StyleguidePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: 'loading' });
  const [stampKey, setStampKey] = useState(0);

  useEffect(() => {
    api
      .health()
      .then((data) => setApiStatus({ state: 'ok', data }))
      .catch(() => setApiStatus({ state: 'down' }));
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Design system"
        title="Style guide"
        description="Colours, type and components for Travel Tracker. Toggle dark mode to check both themes."
      />

      <Section title="API connection">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3">
            {apiStatus.state === 'loading' && <Skeleton className="h-7 w-48" />}
            {apiStatus.state === 'ok' && (
              <>
                <Badge tone="success">Connected</Badge>
                <span className="text-muted">
                  {apiStatus.data.service} v{apiStatus.data.version}, up for{' '}
                  {apiStatus.data.uptimeSeconds}s
                </span>
              </>
            )}
            {apiStatus.state === 'down' && (
              <>
                <Badge tone="primary">Not reachable</Badge>
                <span className="text-muted">
                  Start the server with <code className="font-semibold">npm run dev</code> from the
                  project folder.
                </span>
              </>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section title="Colours">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {COLORS.map(([name, cls]) => (
            <li key={name} className="flex flex-col gap-2">
              <span className={`h-16 rounded-2xl border border-line ${cls}`} />
              <span className="text-xs font-semibold text-muted">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="font-display text-6xl font-semibold">Fraunces display</p>
            <h1 className="text-4xl font-semibold">Heading 1 — Where to next?</h1>
            <h2 className="text-2xl font-semibold">Heading 2 — Your adventures</h2>
            <p className="text-lg">
              Body text in DM Sans. Comfortable to read on small screens and in sunlight.
            </p>
            <p className="text-sm text-muted">Muted text for hints and secondary details.</p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus /> Primary
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="sun">Level 3</Badge>
          <Badge tone="success">Completed</Badge>
          <Badge tone="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Stamps">
        <div className="paper-dots flex flex-wrap items-center gap-6 rounded-3xl border border-line bg-surface p-6">
          <Stamp key={`a${stampKey}`} title="Dhaka" label="Arrival" caption="13 Oct 2026" animate />
          <Stamp key={`b${stampKey}`} title="Japan" label="Visited" tone="accent" rotate={7} animate />
          <Stamp key={`c${stampKey}`} title="Explorer" label="Badge" caption="5 countries" tone="sun" shape="rect" rotate={-4} animate />
          <Stamp title="Peru" label="Visited" locked rotate={5} />
          <Button variant="secondary" size="sm" onClick={() => setStampKey((k) => k + 1)}>
            Replay animation
          </Button>
        </div>
      </Section>

      <Section title="Inputs">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" placeholder="you@example.com" icon={<Mail />} />
            <Input label="Trip name" placeholder="Summer in Sylhet" hint="You can change it later." />
            <Input label="Budget" defaultValue="abc" error="Enter a number, like 500." />
            <Input label="Disabled" placeholder="Not editable" disabled />
          </CardContent>
        </Card>
      </Section>

      <Section title="Cards and progress">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card interactive>
            <CardHeader>
              <CardTitle>Interactive card</CardTitle>
              <CardDescription>Lifts on hover.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge tone="accent">
                <Plane /> 12 days to go
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <ProgressRing value={68} label="Budget used" tone="primary">
                <span className="font-display text-xl font-bold">68%</span>
              </ProgressRing>
              <div>
                <p className="font-semibold">Budget used</p>
                <p className="text-sm text-muted">৳34,000 of ৳50,000</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<Inbox />}
          title="No trips yet"
          description="Plan your first adventure and it will show up here."
          action={<Button>Plan a trip</Button>}
        />
      </Section>

      <Section title="Feedback">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Trip saved!')}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Could not save the trip')}>
            Error toast
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Delete this trip?"
          description="This removes the itinerary and expenses. You can undo for 10 seconds."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setModalOpen(false);
                  toast('Trip deleted', { action: { label: 'Undo', onClick: () => {} } });
                }}
              >
                Delete
              </Button>
            </>
          }
        />
      </Section>
    </div>
  );
}
