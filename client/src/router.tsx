import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import CommunityPage from '@/pages/CommunityPage';
import ExplorePage from '@/pages/ExplorePage';
import LoginPage from '@/pages/LoginPage';
import MapPage from '@/pages/MapPage';
import MePage from '@/pages/MePage';
import NotFoundPage from '@/pages/NotFoundPage';
import SignupPage from '@/pages/SignupPage';
import StyleguidePage from '@/pages/StyleguidePage';
import TripsPage from '@/pages/TripsPage';

/** All pages and their addresses. Add new pages here. */
export const routes = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <ExplorePage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'community', element: <CommunityPage /> },
      { path: 'me', element: <MePage /> },
      { path: 'styleguide', element: <StyleguidePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
