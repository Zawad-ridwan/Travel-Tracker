import type { TripCover } from '@tt/shared';

/** Each cover is a warm gradient, like the ink colours on a passport page. */
export const COVER_STYLES: Record<TripCover, { label: string; className: string }> = {
  sunset: { label: 'Sunset', className: 'bg-linear-to-br from-[#c8492f] via-[#e0763f] to-[#f2b45a]' },
  ocean: { label: 'Ocean', className: 'bg-linear-to-br from-[#155e63] via-[#1f7a73] to-[#5fb3a8]' },
  mustard: { label: 'Mustard', className: 'bg-linear-to-br from-[#8a5a0f] via-[#b9831f] to-[#e8c25a]' },
  forest: { label: 'Forest', className: 'bg-linear-to-br from-[#1f4d2f] via-[#2f7d4f] to-[#8bbf6a]' },
  dusk: { label: 'Dusk', className: 'bg-linear-to-br from-[#2b2f5a] via-[#5b3f78] to-[#c46a8a]' },
};
