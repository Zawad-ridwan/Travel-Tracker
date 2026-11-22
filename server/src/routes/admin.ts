import { Router } from 'express';
import {
  adminUsersQuerySchema,
  type AdminStats,
  type AdminUserRow,
  type Paginated,
} from '@tt/shared';
import { toAdminUserRow } from '../lib/serialize';
import { parse } from '../lib/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/User';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

const DAY_MS = 24 * 60 * 60 * 1000;

/** GET /api/admin/stats — numbers for the dashboard. */
adminRouter.get('/stats', async (_req, res) => {
  const now = Date.now();
  const since14 = new Date(now - 13 * DAY_MS);
  since14.setUTCHours(0, 0, 0, 0);

  const [total, verified, admins, newLast7Days, perDay] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: new Date(now - 7 * DAY_MS) } }),
    User.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since14 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Fill in days with no sign-ups so the chart has all 14 days
  const counts = new Map(perDay.map((d) => [d._id, d.count]));
  const signupsByDay = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(since14.getTime() + i * DAY_MS).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });

  const body: AdminStats = { users: { total, verified, admins, newLast7Days }, signupsByDay };
  res.json(body);
});

/** Makes user input safe to use inside a regular expression. */
function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** GET /api/admin/users?page=1&limit=20&search=ali */
adminRouter.get('/users', async (req, res) => {
  const { page, limit, search } = parse(adminUsersQuerySchema, req.query);

  const pattern = search ? new RegExp(escapeRegex(search), 'i') : null;
  const filter = pattern ? { $or: [{ name: pattern }, { email: pattern }] } : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const body: Paginated<AdminUserRow> = {
    items: users.map(toAdminUserRow),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
  res.json(body);
});
