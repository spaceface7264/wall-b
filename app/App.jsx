import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import CommunitiesPage from './community/page.jsx'
import CommunityPage from './community/[communityId]/page.jsx'
import PostDetailPage from './community/[communityId]/post/[postId]/page.jsx'
import CommunitySettingsPage from './community/[communityId]/settings/page.jsx'
import CreateCommunityPage from './community/new/page.jsx'
import ChatPage from './chat/page.jsx'
import GymsPage from './gyms/page.jsx'
import GymPage from './gyms/[gymId]/page.jsx'
import GymRequestPage from './gyms/request/page.jsx'
import ProfilePage from './profile/page.jsx'
import PublicProfile from './profile/[userId]/page.jsx'
import AdminPage from './admin/page.jsx'
import ResetPasswordPage from './reset-password/page.jsx'
import TermsPage from './terms/page.jsx'
import OnboardingPage from './onboarding/page.jsx'
import HomePage from './home/page.jsx'
import SearchPage from './search/page.jsx'
import SidebarLayout from './components/SidebarLayout.jsx'
import { ToastProvider } from './providers/ToastProvider.jsx'

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/home" element={<SidebarLayout currentPage="home" pageTitle="Home"><HomePage /></SidebarLayout>} />
          <Route path="/search" element={<SidebarLayout currentPage="search" pageTitle="Search"><SearchPage /></SidebarLayout>} />
          {/* Redirect deprecated /community to /communities for consistency */}
          <Route path="/community" element={<Navigate to="/communities" replace />} />
          <Route path="/communities" element={<SidebarLayout currentPage="communities" pageTitle="Communities"><CommunitiesPage /></SidebarLayout>} />
          {/* IMPORTANT: /community/new must come BEFORE /community/:communityId - React Router matches routes in order */}
          <Route path="/community/new" element={<CreateCommunityPage />} />
          {/* CommunityPage, PostDetailPage, and GymPage wrap themselves so they can set dynamic titles */}
          <Route path="/community/:communityId" element={<CommunityPage />} />
          <Route path="/community/:communityId/settings" element={<CommunitySettingsPage />} />
          <Route path="/community/:communityId/post/:postId" element={<PostDetailPage />} />
          <Route path="/chat" element={<SidebarLayout currentPage="chat" pageTitle="Chat"><ChatPage /></SidebarLayout>} />
          <Route path="/gyms" element={<SidebarLayout currentPage="gyms" pageTitle="Gyms"><GymsPage /></SidebarLayout>} />
          <Route path="/gyms/request" element={<GymRequestPage />} />
          <Route path="/gyms/:gymId" element={<GymPage />} />
          {/* ProfilePage wraps itself so it can set dynamic titles */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App



