import { model, Schema, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  EXPENSE_CATEGORY_IDS,
  ITEM_KIND_IDS,
  PACKING_CATEGORY_IDS,
  TRIP_COVERS,
  type ExpenseCategory,
  type ItemKind,
  type PackingCategory,
  type TripCover,
} from '@tt/shared';

/**
 * A trip and everything in it. The itinerary, expenses and packing list live inside
 * the trip document (a trip is always loaded as a whole, and stays far below MongoDB's 16 MB limit).
 */

export interface ITripItem {
  _id: Types.ObjectId;
  date: string | null;
  order: number;
  kind: ItemKind;
  title: string;
  time: string | null;
  endTime: string | null;
  location: string;
  notes: string;
  cost: number | null;
}

export interface IExpense {
  _id: Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  convertedAmount: number;
  rate: number;
  date: string;
  createdAt: Date;
}

export interface IPackingItem {
  _id: Types.ObjectId;
  label: string;
  category: PackingCategory;
  packed: boolean;
}

export interface ITrip {
  ownerId: Types.ObjectId;
  title: string;
  destination: string;
  countryCode: string | null;
  startDate: string;
  endDate: string;
  currency: string;
  budget: number;
  travelers: number;
  notes: string;
  cover: TripCover;
  items: ITripItem[];
  expenses: IExpense[];
  packing: IPackingItem[];
  /** XP given for planning this trip; taken back if it is deleted. */
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Lets TypeScript know the arrays are Mongoose document arrays (with .id(), .push() and so on). */
type TripDocumentProps = {
  items: Types.DocumentArray<ITripItem>;
  expenses: Types.DocumentArray<IExpense>;
  packing: Types.DocumentArray<IPackingItem>;
};
type TripModel = Model<ITrip, object, TripDocumentProps>;
export type TripDocument = HydratedDocument<ITrip, TripDocumentProps>;

const itemSchema = new Schema<ITripItem>({
  date: { type: String, default: null },
  order: { type: Number, default: 0 },
  kind: { type: String, enum: ITEM_KIND_IDS, default: 'place' },
  title: { type: String, required: true, maxlength: 120 },
  time: { type: String, default: null },
  endTime: { type: String, default: null },
  location: { type: String, default: '', maxlength: 160 },
  notes: { type: String, default: '', maxlength: 1000 },
  cost: { type: Number, default: null, min: 0 },
});

const expenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, maxlength: 120 },
    category: { type: String, enum: EXPENSE_CATEGORY_IDS, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    convertedAmount: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const packingSchema = new Schema<IPackingItem>({
  label: { type: String, required: true, maxlength: 80 },
  category: { type: String, enum: PACKING_CATEGORY_IDS, default: 'other' },
  packed: { type: Boolean, default: false },
});

const tripSchema = new Schema<ITrip, TripModel>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    destination: { type: String, default: '', maxlength: 80 },
    countryCode: { type: String, default: null },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    currency: { type: String, required: true },
    budget: { type: Number, default: 0, min: 0 },
    travelers: { type: Number, default: 1, min: 1 },
    notes: { type: String, default: '', maxlength: 2000 },
    cover: { type: String, enum: TRIP_COVERS, default: 'sunset' },
    items: { type: [itemSchema], default: [] },
    expenses: { type: [expenseSchema], default: [] },
    packing: { type: [packingSchema], default: [] },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// "My trips, soonest first"
tripSchema.index({ ownerId: 1, startDate: 1 });

export const Trip = model<ITrip, TripModel>('Trip', tripSchema);
