import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import CommunitiesPage from './community/page.jsx'
import CommunityPage from './community/[communityId]/page.jsx'
import PostDetailPage from './community/[communityId]/post/[postId]/page.jsx'
import CreateCommunityPage from './community/new/page.jsx'
import ChatPage from './chat/page.jsx'
import GymsPage from './gyms/page.jsx'
import GymPage from './gyms/[gymId]/page.jsx'
import ProfilePage from './profile/page.jsx'
import AdminPage from './admin/page.jsx'
import SidebarLayout from './components/SidebarLayout.jsx'
import { ToastProvider } from './providers/ToastProvider.jsx'

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* /community route for Home button - shows CommunitiesPage */}
          <Route path="/community" element={<SidebarLayout currentPage="home" pageTitle="Communities"><CommunitiesPage /></SidebarLayout>} />
          <Route path="/communities" element={<SidebarLayout currentPage="communities" pageTitle="Communities"><CommunitiesPage /></SidebarLayout>} />
          {/* IMPORTANT: /community/new must come BEFORE /community/:communityId - React Router matches routes in order */}
          <Route path="/community/new" element={<CreateCommunityPage />} />
          {/* CommunityPage, PostDetailPage, and GymPage wrap themselves so they can set dynamic titles */}
          <Route path="/community/:communityId" element={<CommunityPage />} />
          <Route path="/community/:communityId/post/:postId" element={<PostDetailPage />} />
          <Route path="/chat" element={<SidebarLayout currentPage="chat" pageTitle="Chat"><ChatPage /></SidebarLayout>} />
          <Route path="/gyms" element={<SidebarLayout currentPage="gyms" pageTitle="Gyms"><GymsPage /></SidebarLayout>} />
          <Route path="/gyms/:gymId" element={<GymPage />} />
          {/* ProfilePage wraps itself so it can set dynamic titles */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/admin" element={<SidebarLayout currentPage="admin" pageTitle="Admin"><AdminPage /></SidebarLayout>} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App



