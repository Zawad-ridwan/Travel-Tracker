import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  ArrowRight,
  MapPin,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Stamp as StampIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Photo } from '@/components/Photo';
import { useToolkit } from '@/components/layout/toolkit';
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  ProgressRing,
  Stamp,
} from '@/components/ui';
import { FEATURED_DESTINATIONS } from '@/data/sample';
import { cn } from '@/lib/cn';

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function ExplorePage() {
  const { setOpen: openToolkit } = useToolkit();
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    toast('Destination search arrives in Phase 3', {
      description: query ? `We'll find "${query}" for you then.` : undefined,
    });
  };

  const quickActions = [
    { label: 'Plan a trip', icon: Plus, onClick: () => toast('Trip planning arrives in Phase 2') },
    { label: 'Check in', icon: MapPin, onClick: () => toast('Check-ins arrive in Phase 4') },
    { label: 'Add expense', icon: Receipt, onClick: () => toast('Budgets arrive in Phase 2') },
    { label: 'Convert money', icon: ArrowLeftRight, onClick: () => openToolkit(true) },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <motion.section
        {...fadeUp}
        className="paper-dots relative overflow-hidden rounded-[2rem] border border-line bg-surface p-6 shadow-soft sm:p-10"
      >
        <div className="relative z-10 max-w-xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
            <Sparkles className="size-4 text-sun" /> {greeting()}, traveller
          </p>
          <h1 className="text-5xl font-semibold leading-[1.05] sm:text-6xl">
            Where to <span className="font-black text-primary">next?</span>
          </h1>
          <p className="mt-4 text-lg text-muted">
            Plan trips, track every journey and fill your passport with stamps.
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-2" role="search">
            <label htmlFor="explore-search" className="sr-only">
              Search destinations
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <input
                id="explore-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a city or country"
                className="h-13 w-full rounded-full border border-line bg-bg pl-12 pr-4 text-ink shadow-soft placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>
            <Button type="submit" size="lg" className="hidden sm:inline-flex">
              Explore
            </Button>
            <Button type="submit" size="icon" className="size-13 sm:hidden" aria-label="Search">
              <ArrowRight />
            </Button>
          </form>
        </div>

        {/* Decorative stamps (desktop only) */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-80 xl:block">
          <Stamp title="Kyoto" label="Arrival" caption="12 Apr" tone="accent" rotate={-12} className="absolute right-40 top-10" animate />
          <Stamp title="Lisbon" label="Visited" caption="03 Sep" tone="primary" rotate={8} size="lg" className="absolute right-6 top-24" animate />
          <Stamp title="Sylhet" label="Entry" caption="21 Jan" shape="rect" tone="sun" rotate={-4} className="absolute bottom-10 right-32" animate />
        </div>
      </motion.section>

      {/* Quick actions */}
      <motion.section {...fadeUp} transition={{ delay: 0.05 }} aria-label="Quick actions">
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {quickActions.map(({ label, icon: Icon, onClick }) => (
            <li key={label} className="shrink-0">
              <button
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 font-semibold shadow-soft transition-[translate,scale,box-shadow] hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-[18px]" />
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Next trip + passport + level */}
      <motion.section {...fadeUp} transition={{ delay: 0.1 }} className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex h-full flex-col">
            <Badge tone="primary" className="self-start">
              Next trip
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold">No trip planned yet</h2>
            <p className="mt-1 text-muted">Your countdown appears here once you plan one.</p>
            <Link to="/trips" className={cn(buttonVariants({ variant: 'soft' }), 'mt-auto self-start')}>
              <Plus /> Plan your first trip
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-5">
            <ProgressRing value={0} label="Share of the world visited" tone="accent">
              <span className="font-display text-2xl font-bold">0%</span>
            </ProgressRing>
            <div>
              <Badge tone="accent">
                <StampIcon /> Passport
              </Badge>
              <h2 className="mt-2 text-2xl font-semibold">0 of 195</h2>
              <p className="text-sm text-muted">countries stamped</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge tone="sun">Level 1</Badge>
              <span className="text-sm font-semibold text-muted">0 / 100 XP</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Curious Explorer</h2>
            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-label="Experience points"
              aria-valuenow={0}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full w-[4%] rounded-full bg-sun" />
            </div>
            <p className="mt-3 text-sm text-muted">Plan a trip to earn your first 25 XP.</p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Featured */}
      <motion.section {...fadeUp} transition={{ delay: 0.15 }}>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl font-semibold">Get inspired</h2>
          <span className="text-sm font-semibold text-muted">Live guides in Phase 3</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_DESTINATIONS.map((d) => (
            <li key={d.id}>
              <Card interactive className="group overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Photo
                    src={d.image}
                    alt={d.name}
                    className="size-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-sm font-semibold opacity-90">{d.region}</p>
                    <h3 className="text-2xl font-semibold text-white">{d.name}</h3>
                  </div>
                </div>
                <div className="flex gap-2 p-4">
                  {d.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </motion.section>
    </div>
  );
}
