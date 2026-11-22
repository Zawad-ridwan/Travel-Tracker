import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { GuestOnly, RequireAuth, RequireRole } from '@/features/auth/guards';
import AdminPage from '@/pages/AdminPage';
import CommunityPage from '@/pages/CommunityPage';
import ExplorePage from '@/pages/ExplorePage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import LoginPage from '@/pages/LoginPage';
import MapPage from '@/pages/MapPage';
import MePage from '@/pages/MePage';
import NotFoundPage from '@/pages/NotFoundPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SettingsPage from '@/pages/SettingsPage';
import SignupPage from '@/pages/SignupPage';
import StyleguidePage from '@/pages/StyleguidePage';
import TripsPage from '@/pages/TripsPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';

/** All pages and their addresses. Add new pages here. */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <ExplorePage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'community', element: <CommunityPage /> },
      { path: 'me', element: <MePage /> },
      { path: 'styleguide', element: <StyleguidePage /> },
      // Logged-in users only
      {
        element: <RequireAuth />,
        children: [{ path: 'me/settings', element: <SettingsPage /> }],
      },
      // Admins only
      {
        element: <RequireRole role="admin" />,
        children: [{ path: 'admin', element: <AdminPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      // Logged-in users are sent onwards from these
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      // These work whether or not you are logged in (links from emails)
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{ path: 'onboarding', element: <OnboardingPage /> }],
  },
];

export const router = createBrowserRouter(routes);
