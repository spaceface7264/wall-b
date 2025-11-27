import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import SidebarLayout from './components/SidebarLayout.jsx'
import { ToastProvider } from './providers/ToastProvider.jsx'
import { LoginModalProvider } from './providers/LoginModalProvider.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { queryClient } from '../lib/queryClient.js'

// Public routes (load immediately - small)
import LoginPage from './LoginPage.jsx'
import LandingPage from './components/LandingPage.jsx'
import ResetPasswordPage from './reset-password/page.jsx'
import TermsPage from './terms/page.jsx'

// Lazy load heavy routes for code splitting
const CommunitiesPage = lazy(() => import('./community/page.jsx'))
const CommunityPage = lazy(() => import('./community/[communityId]/page.jsx'))
const PostDetailPage = lazy(() => import('./community/[communityId]/post/[postId]/page.jsx'))
const CommunitySettingsPage = lazy(() => import('./community/[communityId]/settings/page.jsx'))
const CreateCommunityPage = lazy(() => import('./community/new/page.jsx'))
const ChatPage = lazy(() => import('./chat/page.jsx'))
const GymsPage = lazy(() => import('./gyms/page.jsx'))
const GymPage = lazy(() => import('./gyms/[gymId]/page.jsx'))
const GymRequestPage = lazy(() => import('./gyms/request/page.jsx'))
const ProfilePage = lazy(() => import('./profile/page.jsx'))
const PublicProfile = lazy(() => import('./profile/[userId]/page.jsx'))
const AdminPage = lazy(() => import('./admin/page.jsx')) // HUGE - 7,475 lines - only loads when accessed!
const OnboardingPage = lazy(() => import('./onboarding/page.jsx'))
const HomePage = lazy(() => import('./home/page.jsx'))
const SearchPage = lazy(() => import('./search/page.jsx'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <LoadingSpinner size="lg" />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <Router>
        <LoginModalProvider>
            <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
              <Route path="/onboarding" element={
                <Suspense fallback={<PageLoader />}>
                  <OnboardingPage />
                </Suspense>
              } />
              <Route path="/home" element={
                <SidebarLayout currentPage="home" pageTitle="Home">
                  <Suspense fallback={<PageLoader />}>
                    <HomePage />
                  </Suspense>
                </SidebarLayout>
              } />
              <Route path="/search" element={
                <SidebarLayout currentPage="search" pageTitle="Search">
                  <Suspense fallback={<PageLoader />}>
                    <SearchPage />
                  </Suspense>
                </SidebarLayout>
              } />
          {/* Redirect deprecated /community to /communities for consistency */}
          <Route path="/community" element={<Navigate to="/communities" replace />} />
              <Route path="/communities" element={
                <SidebarLayout currentPage="communities" pageTitle="Communities">
                  <Suspense fallback={<PageLoader />}>
                    <CommunitiesPage />
                  </Suspense>
                </SidebarLayout>
              } />
          {/* IMPORTANT: /community/new must come BEFORE /community/:communityId - React Router matches routes in order */}
              <Route path="/community/new" element={
                <Suspense fallback={<PageLoader />}>
                  <CreateCommunityPage />
                </Suspense>
              } />
          {/* CommunityPage, PostDetailPage, and GymPage wrap themselves so they can set dynamic titles */}
              <Route path="/community/:communityId" element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityPage />
                </Suspense>
              } />
              <Route path="/community/:communityId/settings" element={
                <Suspense fallback={<PageLoader />}>
                  <CommunitySettingsPage />
                </Suspense>
              } />
              <Route path="/community/:communityId/post/:postId" element={
                <Suspense fallback={<PageLoader />}>
                  <PostDetailPage />
                </Suspense>
              } />
              <Route path="/chat" element={
                <SidebarLayout currentPage="chat" pageTitle="Chat">
                  <Suspense fallback={<PageLoader />}>
                    <ChatPage />
                  </Suspense>
                </SidebarLayout>
              } />
              <Route path="/gyms" element={
                <SidebarLayout currentPage="gyms" pageTitle="Gyms">
                  <Suspense fallback={<PageLoader />}>
                    <GymsPage />
                  </Suspense>
                </SidebarLayout>
              } />
              <Route path="/gyms/request" element={
                <Suspense fallback={<PageLoader />}>
                  <GymRequestPage />
                </Suspense>
              } />
              <Route path="/gyms/:gymId" element={
                <Suspense fallback={<PageLoader />}>
                  <GymPage />
                </Suspense>
              } />
          {/* ProfilePage wraps itself so it can set dynamic titles */}
              <Route path="/profile" element={
                <Suspense fallback={<PageLoader />}>
                  <ProfilePage />
                </Suspense>
              } />
              <Route path="/profile/:userId" element={
                <Suspense fallback={<PageLoader />}>
                  <PublicProfile />
                </Suspense>
              } />
              {/* Admin page - HUGE (7,476 lines) - only loads when accessed */}
              <Route path="/admin" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminPage />
                </Suspense>
              } />
          </Routes>
          </Suspense>
        </LoginModalProvider>
      </Router>
    </ToastProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App



