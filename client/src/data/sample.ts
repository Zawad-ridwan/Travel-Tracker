/**
 * Sample content for Phase 0. From Phase 3, destinations come from
 * Wikivoyage / OpenTripMap through our API instead.
 */
export interface Destination {
  id: string;
  name: string;
  region: string;
  tags: string[];
  image: string;
}

export const FEATURED_DESTINATIONS: Destination[] = [
  {
    id: 'old-towns',
    name: 'Old Town Wanders',
    region: 'Europe',
    tags: ['History', 'Food'],
    image:
      'https://images.unsplash.com/photo-1758621808223-f01ba84d8846?auto=format&fit=crop&w=900&q=75',
  },
  {
    id: 'mountains',
    name: 'Mountain Escapes',
    region: 'Himalaya & Alps',
    tags: ['Hiking', 'Views'],
    image:
      'https://images.unsplash.com/photo-1647291718042-676c0428fc25?auto=format&fit=crop&w=900&q=75',
  },
  {
    id: 'beaches',
    name: 'Tropical Beaches',
    region: 'Southeast Asia',
    tags: ['Relax', 'Islands'],
    image:
      'https://images.unsplash.com/photo-1579077926357-365f07b70b01?auto=format&fit=crop&w=900&q=75',
  },
];

/** Stamps shown as "locked" on the passport preview. */
export const PREVIEW_STAMPS = [
  { title: 'Bangladesh', tone: 'primary', rotate: -8 },
  { title: 'Japan', tone: 'accent', rotate: 6 },
  { title: 'Nepal', tone: 'sun', rotate: -4 },
  { title: 'Turkey', tone: 'primary', rotate: 9 },
  { title: 'Italy', tone: 'accent', rotate: -10 },
  { title: 'Thailand', tone: 'sun', rotate: 4 },
] as const;

export const AUTH_PHOTO =
  'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?auto=format&fit=crop&w=1200&q=75';
