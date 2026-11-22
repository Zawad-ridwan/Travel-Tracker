import { useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES, countryName, onboardingSchema, type TravelStyle } from '@tt/shared';
import { Select } from '@/components/forms/Field';
import { StylePicker } from '@/components/forms/StylePicker';
import { Logo } from '@/components/brand/Logo';
import { Button, Input, Stamp } from '@/components/ui';
import { useAuth, useSetUser } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { countryFlag, firstName } from '@/lib/format';
import { showServerErrors } from '@/lib/forms';

const STEPS = ['Travel style', 'Home', 'Dream trip'] as const;

/** The 3-question welcome quiz after sign-up. Personalises Explore and earns 25 XP. */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setUser = useSetUser();

  const [step, setStep] = useState(0);
  const [travelStyles, setTravelStyles] = useState<TravelStyle[]>(user?.travelStyles ?? []);
  const [homeCountry, setHomeCountry] = useState(user?.homeCountry ?? '');
  const [dreamDestination, setDreamDestination] = useState(user?.dreamDestination ?? '');
  const [done, setDone] = useState(false);

  const save = useMutation({
    mutationFn: api.users.onboarding,
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      setDone(true);
    },
    onError: (error) => showServerErrors(error, () => undefined),
  });

  const canContinue = step === 0 ? travelStyles.length > 0 : step === 1 ? Boolean(homeCountry) : true;

  const next = () => {
    if (step < STEPS.length - 1) return setStep(step + 1);
    const parsed = onboardingSchema.safeParse({ travelStyles, homeCountry, dreamDestination });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check your answers');
      return;
    }
    save.mutate(parsed.data);
  };

  if (done) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center">
          <div className="relative h-44 w-64">
            <Stamp
              title="Issued"
              label="Passport"
              caption={user ? firstName(user.name) : undefined}
              size="lg"
              rotate={-12}
              className="absolute left-0 top-2"
              animate
            />
            <Stamp
              title={homeCountry ? (countryName(homeCountry) ?? 'Home') : 'Home'}
              label="Home"
              tone="accent"
              rotate={9}
              className="absolute right-0 top-10"
              animate
            />
          </div>
          <h1 className="mt-6 text-4xl font-semibold">Your passport is ready</h1>
          <p className="mt-3 flex items-center gap-2 font-semibold text-sun">
            <Sparkles className="size-5" /> +25 XP for completing your profile
          </p>
          <p className="mt-3 max-w-sm text-muted">
            Explore is now tuned to you. Confirm your email for another 25 XP.
          </p>
          <Button size="lg" className="mt-8" onClick={() => navigate('/', { replace: true })}>
            Start exploring <ArrowRight />
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-2'}`} />
            <p className={`mt-2 text-xs font-semibold ${i === step ? 'text-ink' : 'text-muted'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">What kind of traveller are you?</h1>
              <p className="mb-6 mt-2 text-muted">Pick up to 5. We&apos;ll suggest trips to match.</p>
              <StylePicker value={travelStyles} onChange={setTravelStyles} />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">Where is home?</h1>
              <p className="mb-6 mt-2 text-muted">
                It becomes the first stamp in your passport and sets your home currency later.
              </p>
              <Select
                label="Home country"
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
              >
                <option value="">Choose a country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {countryFlag(c.code)} {c.name}
                  </option>
                ))}
              </Select>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">Where do you dream of going?</h1>
              <p className="mb-6 mt-2 text-muted">A city, a country, anywhere. You can skip this.</p>
              <Input
                label="Dream destination"
                placeholder="e.g. Kyoto, Patagonia, the Northern Lights"
                value={dreamDestination}
                maxLength={80}
                onChange={(e) => setDreamDestination(e.target.value)}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            <ArrowLeft /> Back
          </Button>
        ) : (
          <Link to="/" className="px-2 text-sm font-semibold text-muted hover:text-ink">
            Skip for now
          </Link>
        )}
        <Button size="lg" onClick={next} disabled={!canContinue} loading={save.isPending}>
          {step === STEPS.length - 1 ? 'Finish' : 'Continue'} <ArrowRight />
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="paper-dots min-h-dvh px-5 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Logo className="mb-10" />
        <div className="rounded-[2rem] border border-line bg-surface p-6 shadow-soft sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
