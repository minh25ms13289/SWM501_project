import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface Props { children: React.ReactNode; role?: string; }

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default ProtectedRoute;
