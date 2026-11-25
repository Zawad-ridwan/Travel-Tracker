import type { Types } from 'mongoose';
import {
  XP_PER_LEVEL,
  type AdminUserRow,
  type PublicUser,
  type Trip,
  type TripCover,
  type TripSummary,
} from '@tt/shared';
import type { TripDocument } from '../models/Trip';
import type { UserDocument } from '../models/User';

export function levelForXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** The only shape in which a user ever leaves the server. Never includes the password hash. */
export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? '',
    homeCountry: user.homeCountry ?? null,
    travelStyles: [...(user.travelStyles ?? [])],
    dreamDestination: user.dreamDestination ?? '',
    profileVisibility: user.profileVisibility,
    onboardingCompleted: user.onboardingCompleted,
    xp: user.xp,
    level: levelForXp(user.xp),
    createdAt: user.createdAt.toISOString(),
  };
}

export function toAdminUserRow(user: UserDocument): AdminUserRow {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

/** A whole trip, with the itinerary in day order. */
export function toTrip(trip: TripDocument): Trip {
  return {
    id: trip.id as string,
    title: trip.title,
    destination: trip.destination,
    countryCode: trip.countryCode ?? null,
    startDate: trip.startDate,
    endDate: trip.endDate,
    currency: trip.currency,
    budget: trip.budget,
    travelers: trip.travelers,
    cover: trip.cover,
    notes: trip.notes,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    items: trip.items
      .map((item) => ({
        id: item._id.toString(),
        date: item.date ?? null,
        order: item.order,
        kind: item.kind,
        title: item.title,
        time: item.time ?? null,
        endTime: item.endTime ?? null,
        location: item.location ?? '',
        notes: item.notes ?? '',
        cost: item.cost ?? null,
      }))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.order - b.order),
    expenses: trip.expenses
      .map((e) => ({
        id: e._id.toString(),
        title: e.title,
        category: e.category,
        amount: e.amount,
        currency: e.currency,
        convertedAmount: e.convertedAmount,
        rate: e.rate,
        date: e.date,
        // Set when the trip is saved; the fallback only guards against odd old data
        createdAt: (e.createdAt ?? new Date(0)).toISOString(),
      }))
      // Newest first
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    packing: trip.packing.map((p) => ({
      id: p._id.toString(),
      label: p.label,
      category: p.category,
      packed: p.packed,
    })),
  };
}

/** One row from the trip-list query in routes/trips.ts. */
export interface TripSummaryRow {
  _id: Types.ObjectId;
  title: string;
  destination: string;
  countryCode: string | null;
  startDate: string;
  endDate: string;
  currency: string;
  budget: number;
  travelers: number;
  cover: TripCover;
  createdAt: Date;
  updatedAt: Date;
  spent: number;
  plannedCost: number;
  itemCount: number;
  packingTotal: number;
  packingPacked: number;
}

export function toTripSummary(row: TripSummaryRow): TripSummary {
  return {
    id: row._id.toString(),
    title: row.title,
    destination: row.destination ?? '',
    countryCode: row.countryCode ?? null,
    startDate: row.startDate,
    endDate: row.endDate,
    currency: row.currency,
    budget: row.budget ?? 0,
    travelers: row.travelers ?? 1,
    cover: row.cover ?? 'sunset',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    spent: Math.round((row.spent ?? 0) * 100) / 100,
    plannedCost: Math.round((row.plannedCost ?? 0) * 100) / 100,
    itemCount: row.itemCount ?? 0,
    packing: { total: row.packingTotal ?? 0, packed: row.packingPacked ?? 0 },
  };
}
