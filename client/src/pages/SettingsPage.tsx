import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  changePasswordSchema,
  COUNTRIES,
  nameSchema,
  type ChangePasswordInput,
  type PublicUser,
  TRAVEL_STYLE_IDS,
} from '@tt/shared';
import { Select, Textarea } from '@/components/forms/Field';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { StylePicker } from '@/components/forms/StylePicker';
import { Button, Card, CardContent, Input, Modal } from '@/components/ui';
import { AvatarUploader } from '@/features/auth/AvatarUploader';
import { ME_KEY, useAuth, useSetUser } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { countryFlag } from '@/lib/format';
import { showServerErrors } from '@/lib/forms';

export default function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null; // RequireAuth guarantees a user

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          to="/me"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Back to profile
        </Link>
        <h1 className="text-4xl font-semibold sm:text-5xl">Settings</h1>
      </div>
      <ProfileSection user={user} />
      <PasswordSection />
      <DangerZone />
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-muted">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/* ---------------- Profile ---------------- */

// The form edits every field at once, so it uses its own full (non-partial) schema
const profileFormSchema = z.object({
  name: nameSchema,
  bio: z.string().trim().max(280, 'Keep it under 280 characters'),
  homeCountry: z.string(),
  travelStyles: z.array(z.enum(TRAVEL_STYLE_IDS)).max(5, 'Pick up to 5'),
  dreamDestination: z.string().trim().max(80, 'Use 80 characters or fewer'),
  profileVisibility: z.enum(['public', 'private']),
});
type ProfileForm = z.infer<typeof profileFormSchema>;

function ProfileSection({ user }: { user: PublicUser }) {
  const setUser = useSetUser();

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio,
      homeCountry: user.homeCountry ?? '',
      travelStyles: user.travelStyles,
      dreamDestination: user.dreamDestination,
      profileVisibility: user.profileVisibility,
    },
  });

  const save = useMutation({
    mutationFn: (values: ProfileForm) =>
      api.users.update({ ...values, homeCountry: values.homeCountry || null }),
    onSuccess: ({ user: updated }, values) => {
      setUser(updated);
      reset(values);
      toast.success('Profile saved');
    },
    onError: (error) => showServerErrors(error, setError),
  });

  const isPublic = watch('profileVisibility') === 'public';

  return (
    <Section title="Profile" description="How you appear in Travel Tracker.">
      <AvatarUploader user={user} showRemove />
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="flex flex-col gap-5" noValidate>
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Bio"
          placeholder="A line about you and how you travel"
          maxLength={280}
          error={errors.bio?.message}
          {...register('bio')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Home country" error={errors.homeCountry?.message} {...register('homeCountry')}>
            <option value="">Not set</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryFlag(c.code)} {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Dream destination"
            maxLength={80}
            error={errors.dreamDestination?.message}
            {...register('dreamDestination')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Travel style (up to 5)</span>
          <Controller
            control={control}
            name="travelStyles"
            render={({ field }) => <StylePicker value={field.value} onChange={field.onChange} />}
          />
        </div>

        <Controller
          control={control}
          name="profileVisibility"
          render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => field.onChange(isPublic ? 'private' : 'public')}
              className="flex items-center gap-4 rounded-2xl border border-line p-4 text-left hover:bg-surface-2/50"
            >
              {isPublic ? <Eye className="size-5 text-accent" /> : <EyeOff className="size-5 text-muted" />}
              <span className="flex-1">
                <span className="block font-semibold">{isPublic ? 'Public profile' : 'Private profile'}</span>
                <span className="block text-sm text-muted">
                  {isPublic
                    ? 'Other travellers can see your profile and stamps (Community, Phase 5).'
                    : 'Only you can see your profile.'}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                  isPublic ? 'bg-accent' : 'bg-line',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 size-5 rounded-full bg-white shadow transition-[left]',
                    isPublic ? 'left-6' : 'left-1',
                  )}
                />
              </span>
            </button>
          )}
        />

        <Button type="submit" className="self-start" loading={save.isPending} disabled={!isDirty}>
          <Save /> Save changes
        </Button>
      </form>
    </Section>
  );
}

/* ---------------- Password ---------------- */

function PasswordSection() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const change = useMutation({
    mutationFn: api.users.changePassword,
    onSuccess: ({ message }) => {
      reset();
      toast.success(message);
    },
    onError: (error) => showServerErrors(error, setError),
  });

  return (
    <Section title="Password" description="Changing it logs you out on your other devices.">
      <form onSubmit={handleSubmit((v) => change.mutate(v))} className="flex flex-col gap-5" noValidate>
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          strengthOf={watch('newPassword')}
          {...register('newPassword')}
        />
        <Button type="submit" variant="secondary" className="self-start" loading={change.isPending}>
          Change password
        </Button>
      </form>
    </Section>
  );
}

/* ---------------- Delete account ---------------- */

function DangerZone() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => api.users.deleteAccount({ password }),
    onSuccess: () => {
      toast('Your account has been deleted. Safe travels.');
      // Leave this page first, so the login guard does not redirect to the log in page
      navigate('/', { replace: true });
      setTimeout(() => {
        queryClient.clear();
        queryClient.setQueryData(ME_KEY, null);
      }, 0);
    },
    onError: (err) => setError(err.message),
  });

  return (
    <Section title="Delete account" description="Permanently removes your profile, photo and all your data.">
      <Button variant="danger" className="self-start" onClick={() => setOpen(true)}>
        <Trash2 /> Delete my account
      </Button>
      <Modal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setPassword('');
            setError(undefined);
          }
        }}
        title="Delete your account?"
        description="This cannot be undone. Enter your password to confirm."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={!password}
              onClick={() => remove.mutate()}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(undefined);
          }}
          error={error}
        />
      </Modal>
    </Section>
  );
}
