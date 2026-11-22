import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BadgeCheck, ChevronLeft, ChevronRight, Search, Shield, UserPlus, Users } from 'lucide-react';
import type { AdminStats } from '@tt/shared';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, CardContent, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminPage() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: api.admin.stats });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Who is signing up and how the community is growing. Moderation tools arrive in Phase 6."
      />

      {/* Stat tiles */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.data ? (
          <>
            <StatTile icon={Users} label="Travellers" value={stats.data.users.total} />
            <StatTile icon={UserPlus} label="New this week" value={stats.data.users.newLast7Days} />
            <StatTile
              icon={BadgeCheck}
              label="Verified emails"
              value={stats.data.users.verified}
              note={
                stats.data.users.total
                  ? `${Math.round((stats.data.users.verified / stats.data.users.total) * 100)}% of all`
                  : undefined
              }
            />
            <StatTile icon={Shield} label="Admins" value={stats.data.users.admins} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)
        )}
      </section>

      <Card>
        <CardContent>
          <h2 className="text-2xl font-semibold">Sign-ups, last 14 days</h2>
          {stats.data ? <SignupChart data={stats.data.signupsByDay} /> : <Skeleton className="mt-6 h-48" />}
        </CardContent>
      </Card>

      <UsersTable />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className="font-display text-4xl font-bold leading-none">{value.toLocaleString()}</span>
        {note && <span className="text-xs text-muted">{note}</span>}
      </CardContent>
    </Card>
  );
}

/** One series of daily counts → simple bars with a hover value and a hidden table for screen readers. */
function SignupChart({ data }: { data: AdminStats['signupsByDay'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  // Noon UTC, so the day never shifts in a different time zone
  const label = (iso: string) => formatDate(`${iso}T12:00:00Z`, { day: 'numeric', month: 'short' });

  return (
    <figure className="mt-6">
      <div className="relative flex h-48 items-end gap-[2px] border-b border-line" aria-hidden>
        {data.map((d, i) => (
          <div
            key={d.date}
            className="group relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className="w-full rounded-t-[4px] bg-primary transition-[height,opacity] duration-500"
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count ? 4 : 0,
                opacity: hover === null || hover === i ? 1 : 0.45,
              }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lift">
                <span className="block text-muted">{label(d.date)}</span>
                <span className="font-semibold text-ink">
                  {d.count} sign-up{d.count === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted" aria-hidden>
        <span>{label(data[0]!.date)}</span>
        <span>{label(data.at(-1)!.date)}</span>
      </div>
      <table className="sr-only">
        <caption>Sign-ups per day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Sign-ups</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{label(d.date)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function UsersTable() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Wait until typing pauses before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const users = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => api.admin.users({ page, search }),
    placeholderData: keepPreviousData,
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold">Travellers</h2>
          <label className="relative sm:w-72">
            <span className="sr-only">Search by name or email</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email"
              className="h-11 w-full rounded-full border border-line bg-surface-2/60 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
          </label>
        </div>

        <div className="-mx-5 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold sm:px-3">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Joined</th>
                <th className="px-3 py-3 font-semibold">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.items.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3 font-semibold sm:px-3">{u.name}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      {u.email}
                      {u.emailVerified && <BadgeCheck className="size-4 text-success" aria-label="Verified" />}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role}</Badge>
                  </td>
                  <td className="px-3 py-3 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-3 text-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.isPending && <Skeleton className="m-3 h-40" />}
          {users.data?.items.length === 0 && (
            <p className="px-3 py-10 text-center text-muted">No travellers match “{search}”.</p>
          )}
        </div>

        {users.data && users.data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              Page {users.data.page} of {users.data.totalPages} · {users.data.total} travellers
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Next page"
                disabled={page >= users.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
