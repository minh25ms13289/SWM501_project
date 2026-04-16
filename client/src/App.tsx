import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LoginPage from './pages/LoginPage';
import LearnerDashboard from './pages/LearnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import BookingPage from './pages/BookingPage';
import RegistrationPage from './pages/RegistrationPage';
import TheoryTestPage from './pages/TheoryTestPage';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => (
  <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/learner/*" element={<ProtectedRoute role="learner"><LearnerDashboard /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/instructor/*" element={<ProtectedRoute role="instructor"><InstructorDashboard /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="/theory-test" element={<ProtectedRoute><TheoryTestPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </ConfigProvider>
);

export default App;
