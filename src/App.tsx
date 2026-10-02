/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Join from './pages/Join';
import Login from './pages/Login';
import PublicOfficers from './pages/PublicOfficers';
import AboutUs from './pages/AboutUs';
import PublicMembers from './pages/PublicMembers';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import AdminApplications from './pages/dashboard/AdminApplications';
import AdminMembers from './pages/dashboard/AdminMembers';
import AdminPolicies from './pages/dashboard/AdminPolicies';
import MemberProfile from './pages/dashboard/MemberProfile';
import AdminSettings from './pages/dashboard/AdminSettings';
import AdminDonations from './pages/dashboard/AdminDonations';
import AdminMessages from './pages/dashboard/AdminMessages';

import AdminActivities from './pages/dashboard/AdminActivities';
import AdminActivityForm from './pages/dashboard/AdminActivityForm';
import AdminIdManagement from './pages/dashboard/AdminIdManagement';
import AdminTasks from './pages/dashboard/AdminTasks';
import OfficerTasks from './pages/dashboard/OfficerTasks';
import OfficerMembers from './pages/dashboard/OfficerMembers';
import PublicActivities from './pages/PublicActivities';
import PublicActivityDetail from './pages/PublicActivityDetail';
import PublicContentView from './pages/PublicContentView';
import PublicPolicies from './pages/PublicPolicies';
import PageUnderConstruction from './pages/PageUnderConstruction';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import LegalPolicy from './pages/LegalPolicy';
import IdentityCardVerification from './pages/IdentityCardVerification';
import MyIdentityCard from './pages/dashboard/MyIdentityCard';
import AdminAppointmentLetters from './pages/dashboard/AdminAppointmentLetters';
import OfficerAppointmentLetter from './pages/dashboard/OfficerAppointmentLetter';
import AppointmentLetterVerification from './pages/AppointmentLetterVerification';
import PublicMemorandum from './pages/PublicMemorandum';
import AdminMemorandum from './pages/dashboard/AdminMemorandum';
import GlobalBackground from './components/GlobalBackground';
import Chatbot from './components/Chatbot';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'admin' | 'officer' | 'member' }) => {
  const { user, userData, loading, isAdmin, isOfficer, isMember } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || !userData) return <Navigate to="/" replace />;
  
  if (requiredRole === 'admin' && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (requiredRole === 'officer' && !isOfficer && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (requiredRole === 'member' && !isMember && !isOfficer && !isAdmin) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalBackground />
        <Chatbot />
        <ScrollToTop />
        <Routes>
          {/* Dedicated Admin Login */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/verify/:id" element={<IdentityCardVerification />} />

          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="join" element={<Join />} />
            <Route path="login" element={<Login />} />
            <Route path="officers" element={<PublicOfficers />} />
            <Route path="members" element={<PublicMembers />} />
            <Route path="activities" element={<PublicActivities />} />
            <Route path="activities/:id" element={<PublicActivityDetail />} />
            
            {/* New Public Pages & Placeholders */}
            <Route path="donate" element={<Donate />} />
            <Route path="contact" element={<Contact />} />
            <Route path="projects" element={<PublicContentView type="project" title="Our Projects" subtitle="Discover the long-term projects we are working on to bring sustainable change." />} />
            <Route path="campaigns" element={<PublicContentView type="campaign" title="Active Campaigns" subtitle="Join our current campaigns and help us make an immediate impact." />} />
            <Route path="events" element={<PublicContentView type="event" title="Upcoming Events" subtitle="Participate in our events to connect, learn, and contribute to society." />} />
            <Route path="news" element={<PublicContentView type="news" title="News & Announcements" subtitle="Stay updated with the latest news and announcements from the organization." />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="gallery" element={<PublicContentView type="gallery" title="Photo Gallery" subtitle="A visual journey of our work and community engagement." />} />
            <Route path="volunteer" element={<PublicContentView type="volunteer" title="Volunteer Program" subtitle="Become a volunteer and dedicate your time for the greater good." />} />
            <Route path="partner" element={<PublicContentView type="partner" title="Partner With Us" subtitle="Collaborate with us to amplify our impact." />} />
            <Route path="policies" element={<PublicPolicies />} />
            <Route path="memorandum" element={<PublicMemorandum />} />
            <Route path="moa" element={<PublicMemorandum />} />
            <Route path="constitution" element={<PublicMemorandum />} />
            
            {/* Legal / Policy Routes */}
            <Route path="policy/:policyId" element={<LegalPolicy />} />
            
            {/* Public Appointment Verification */}
            <Route path="verify-appointment/:letterId" element={<AppointmentLetterVerification />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardOverview />} />
            <Route path="profile" element={<MemberProfile />} />
            <Route path="identity-card" element={<ProtectedRoute requiredRole="member"><MyIdentityCard /></ProtectedRoute>} />
            <Route path="appointment-letter" element={<ProtectedRoute requiredRole="officer"><OfficerAppointmentLetter /></ProtectedRoute>} />
            
            {/* Officer & Member Area */}
            <Route path="tasks" element={<ProtectedRoute requiredRole="officer"><OfficerTasks /></ProtectedRoute>} />
            <Route path="assigned-members" element={<ProtectedRoute requiredRole="officer"><OfficerMembers /></ProtectedRoute>} />
            
            {/* Admin Only */}
            <Route path="applications" element={<ProtectedRoute requiredRole="admin"><AdminApplications /></ProtectedRoute>} />
            <Route path="members" element={<ProtectedRoute requiredRole="admin"><AdminMembers /></ProtectedRoute>} />
            <Route path="appointment-letters" element={<ProtectedRoute requiredRole="admin"><AdminAppointmentLetters /></ProtectedRoute>} />
            <Route path="id-management" element={<ProtectedRoute requiredRole="admin"><AdminIdManagement /></ProtectedRoute>} />
            <Route path="admin-tasks" element={<ProtectedRoute requiredRole="admin"><AdminTasks /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute requiredRole="admin"><AdminMessages /></ProtectedRoute>} />
            <Route path="policies" element={<ProtectedRoute requiredRole="admin"><AdminPolicies /></ProtectedRoute>} />
            <Route path="activities" element={<ProtectedRoute requiredRole="admin"><AdminActivities /></ProtectedRoute>} />
            <Route path="activities/new" element={<ProtectedRoute requiredRole="admin"><AdminActivityForm /></ProtectedRoute>} />
            <Route path="activities/edit/:id" element={<ProtectedRoute requiredRole="admin"><AdminActivityForm /></ProtectedRoute>} />
            <Route path="memorandum" element={<ProtectedRoute requiredRole="admin"><AdminMemorandum /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

