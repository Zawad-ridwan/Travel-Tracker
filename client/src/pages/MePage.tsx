import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Award,
  BadgeCheck,
  Footprints,
  History,
  LogIn,
  LogOut,
  MapPin,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { countryName, TRAVEL_STYLES, type PublicUser } from '@tt/shared';
import { ComingSoon } from '@/components/ComingSoon';
import { PageHeader } from '@/components/PageHeader';
import { Badge, buttonVariants, Button, Card, CardContent, Skeleton, Stamp } from '@/components/ui';
import { AvatarUploader } from '@/features/auth/AvatarUploader';
import { useAuth, useLogout } from '@/features/auth/useAuth';
import { PREVIEW_STAMPS } from '@/data/sample';
import { cn } from '@/lib/cn';
import { countryFlag, formatDate, levelProgress, levelTitle } from '@/lib/format';

const UPCOMING = [
  { icon: MapPin, title: 'One-tap check-ins', description: 'Stamp a place the moment you arrive.' },
  { icon: Footprints, title: 'My Journeys', description: 'Your route on a map and a timeline of every trip.' },
  { icon: Award, title: 'Badges', description: 'Earn badges as you plan, travel and share.' },
  { icon: TrendingUp, title: 'Travel stats', description: 'Countries, km travelled, days abroad.' },
  { icon: History, title: 'Trip recaps', description: 'A shareable card for every finished trip.' },
];

export default function MePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return user ? <Profile user={user} /> : <GuestPassport />;
}

/* ------------------------------------------------------------------ */

function Profile({ user }: { user: PublicUser }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const styles = TRAVEL_STYLES.filter((s) => user.travelStyles.includes(s.id));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <Card className="paper-dots overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
          <AvatarUploader user={user} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-4xl font-semibold">{user.name}</h1>
              {user.role === 'admin' && (
                <Badge tone="accent">
                  <Shield /> Admin
                </Badge>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center justify-center gap-2 text-muted sm:justify-start">
              {user.email}
              {user.emailVerified ? (
                <Badge tone="success">
                  <BadgeCheck /> Verified
                </Badge>
              ) : (
                <Badge tone="sun">Not verified yet</Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-muted">Member since {formatDate(user.createdAt)}</p>

            {/* Level */}
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-1.5 text-sun">
                  <Sparkles className="size-4" /> Level {user.level} · {levelTitle(user.level)}
                </span>
                <span className="text-muted">{user.xp} XP</span>
              </div>
              <div
                className="mt-2 h-3 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-label="Progress to next level"
                aria-valuenow={Math.round(levelProgress(user.xp))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-sun transition-[width] duration-700"
                  style={{ width: `${Math.max(4, levelProgress(user.xp))}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Link to="/me/settings" className={buttonVariants({ variant: 'secondary' })}>
              <Settings /> Edit profile
            </Link>
            <Button
              variant="ghost"
              loading={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => {
                    toast('Logged out. Safe travels!');
                    navigate('/');
                  },
                })
              }
            >
              <LogOut /> Log out
            </Button>
          </div>
        </CardContent>
      </Card>

      {!user.onboardingCompleted && (
        <Card className="border-primary/30 bg-primary-soft/40">
          <CardContent className="flex flex-wrap items-center gap-4">
            <Sparkles className="size-6 text-primary" />
            <p className="flex-1 font-semibold">Answer 3 quick questions to personalise your app and earn 25 XP.</p>
            <Link to="/onboarding" className={buttonVariants()}>
              Let&apos;s go
            </Link>
          </CardContent>
        </Card>
      )}

      {/* About */}
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Home">
          {user.homeCountry ? (
            <span className="text-2xl">
              {countryFlag(user.homeCountry)} {countryName(user.homeCountry)}
            </span>
          ) : (
            <span className="text-muted">Not set</span>
          )}
        </InfoCard>
        <InfoCard label="Dream destination">
          {user.dreamDestination ? (
            <span className="font-display text-2xl font-semibold">{user.dreamDestination}</span>
          ) : (
            <span className="text-muted">Not set</span>
          )}
        </InfoCard>
        <InfoCard label="Travel style">
          {styles.length > 0 ? (
            <span className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <Badge key={s.id} tone="primary">
                  {s.label}
                </Badge>
              ))}
            </span>
          ) : (
            <span className="text-muted">Not set</span>
          )}
        </InfoCard>
      </div>

      {user.bio && (
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">About me</p>
            <p className="mt-2 text-lg">{user.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Passport */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between gap-6 bg-primary p-6 text-primary-fg sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Passport</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary-fg">{user.name}</h2>
            </div>
            <p className="text-sm opacity-90">
              Stamps arrive with check-ins in Phase 4. Your home country is the first.
            </p>
          </div>
          <div className="paper-dots grid grid-cols-3 place-items-center gap-4 p-6 sm:p-8">
            {user.homeCountry && (
              <Stamp
                title={countryName(user.homeCountry) ?? user.homeCountry}
                label="Home"
                caption={formatDate(user.createdAt, { month: 'short', year: 'numeric' })}
                tone="accent"
                size="sm"
                rotate={-6}
                animate
              />
            )}
            {PREVIEW_STAMPS.slice(0, user.homeCountry ? 5 : 6).map((s) => (
              <Stamp key={s.title} title="?" label="Next" tone={s.tone} rotate={s.rotate} size="sm" locked />
            ))}
          </div>
        </div>
      </Card>

      {user.role === 'admin' && (
        <Link
          to="/admin"
          className={cn(buttonVariants({ variant: 'accent', size: 'lg' }), 'self-start')}
        >
          <Shield /> Open the admin dashboard
        </Link>
      )}

      <ComingSoon phase={4} features={UPCOMING} />
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
        {children}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function GuestPassport() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Me"
        title="Your travel passport"
        description="Every country you visit earns a stamp. How many can you collect?"
        actions={
          <>
            <Link to="/login?next=/me" className={buttonVariants({ variant: 'secondary' })}>
              <LogIn /> Log in
            </Link>
            <Link to="/signup" className={buttonVariants()}>
              <UserPlus /> Sign up
            </Link>
          </>
        }
      />
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between gap-6 bg-primary p-6 text-primary-fg sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-80">Passport</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary-fg">Traveller</h2>
            </div>
            <p className="text-sm opacity-90">Sign up to start collecting stamps.</p>
          </div>
          <div className="paper-dots grid grid-cols-3 place-items-center gap-4 p-6 sm:p-8">
            {PREVIEW_STAMPS.map((s) => (
              <Stamp key={s.title} title={s.title} label="Visited" tone={s.tone} rotate={s.rotate} size="sm" locked />
            ))}
          </div>
        </div>
      </Card>
      <ComingSoon phase={4} features={UPCOMING} />
    </div>
  );
}
