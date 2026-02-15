/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';

// Eagerly loaded pages (initial entry points)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Lazy-loaded pages for code splitting
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EquipmentPage = lazy(() => import('./pages/EquipmentPage'));
const MetricsPage = lazy(() => import('./pages/MetricsPage'));
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const AccountabilityPage = lazy(() => import('./pages/AccountabilityPage'));
const WorkoutPlanReviewPage = lazy(() => import('./pages/WorkoutPlanReviewPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const WorkoutSessionPage = lazy(() => import('./pages/WorkoutSessionPage'));
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'));
const CorrelationInsightsPage = lazy(() => import('./pages/CorrelationInsightsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Wraps protected routes with ErrorBoundary for per-route error isolation.
 * Errors in one page won't crash other pages.
 */
function ProtectedRouteWithBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRouteWithBoundary>
                  <OnboardingPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/workout-plan-review"
              element={
                <ProtectedRouteWithBoundary>
                  <WorkoutPlanReviewPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRouteWithBoundary>
                  <DashboardPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRouteWithBoundary>
                  <ProfilePage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/equipment"
              element={
                <ProtectedRouteWithBoundary>
                  <EquipmentPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/metrics"
              element={
                <ProtectedRouteWithBoundary>
                  <MetricsPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRouteWithBoundary>
                  <WorkoutsPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRouteWithBoundary>
                  <GoalsPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/accountability"
              element={
                <ProtectedRouteWithBoundary>
                  <AccountabilityPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRouteWithBoundary>
                  <SchedulePage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/medications"
              element={
                <ProtectedRouteWithBoundary>
                  <MedicationsPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRouteWithBoundary>
                  <CorrelationInsightsPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRouteWithBoundary>
                  <SettingsPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route
              path="/workout-session/:workoutId?"
              element={
                <ProtectedRouteWithBoundary>
                  <WorkoutSessionPage />
                </ProtectedRouteWithBoundary>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
