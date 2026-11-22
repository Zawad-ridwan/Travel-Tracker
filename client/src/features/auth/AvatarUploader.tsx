import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicUser } from '@tt/shared';
import { Avatar, Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useSetUser } from './useAuth';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

/** Profile photo with a camera button to change it. */
export function AvatarUploader({ user, showRemove = false }: { user: PublicUser; showRemove?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setUser = useSetUser();

  const upload = useMutation({
    mutationFn: api.users.uploadAvatar,
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      toast.success('Looking good! Photo updated.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Upload failed'),
  });

  const remove = useMutation({
    mutationFn: api.users.removeAvatar,
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      toast('Photo removed');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not remove it'),
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return toast.error('Use a JPEG, PNG or WebP photo');
    if (file.size > MAX_BYTES) return toast.error('The photo must be 2 MB or smaller');
    upload.mutate(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={user.name} src={user.avatarUrl} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 grid size-10 place-items-center rounded-full border-2 border-surface bg-primary text-primary-fg shadow-soft transition-[scale] hover:scale-105 active:scale-95"
        >
          {upload.isPending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Camera className="size-5" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            e.target.value = ''; // allow picking the same file again
          }}
        />
      </div>
      {showRemove && user.avatarUrl && (
        <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
          <Trash2 /> Remove photo
        </Button>
      )}
    </div>
  );
}
