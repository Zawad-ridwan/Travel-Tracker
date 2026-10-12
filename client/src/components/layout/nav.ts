import { Compass, Map as MapIcon, Plane, User, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** The 5 main tabs. Shown as a sidebar on desktop and a bottom bar on phones. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Explore', icon: Compass },
  { to: '/trips', label: 'Trips', icon: Plane },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/me', label: 'Me', icon: User },
];
