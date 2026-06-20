import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '../pages/Home/HomePage.jsx';
import LoginPage from '../pages/Auth/LoginPage.jsx';
import RegisterPage from '../pages/Auth/RegisterPage.jsx';
import VerifyOtpPage from '../pages/Auth/VerifyOtpPage.jsx';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage.jsx';
import DashboardPage from '../pages/Dashboard/DashboardPage.jsx';
import ProfilePage from '../pages/Profile/ProfilePage.jsx';
import LearningSetupPage from '../pages/Interview/LearningSetupPage.jsx';
import PlacementSetupPage from '../pages/Interview/PlacementSetupPage.jsx';
import SessionSummaryPage from '../pages/Interview/SessionSummaryPage.jsx';
import InterviewRoomPage from '../pages/Interview/InterviewRoomPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/learning"
        element={
          <ProtectedRoute>
            <LearningSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/placement"
        element={
          <ProtectedRoute>
            <PlacementSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/summary/:sessionId"
        element={
          <ProtectedRoute>
            <SessionSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/:sessionId"
        element={
          <ProtectedRoute>
            <InterviewRoomPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
