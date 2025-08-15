'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, user, initializeAuth, isLoading } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated but not admin, redirect to login
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading spinner while checking authentication
  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Only render children if authenticated and is admin
  if (isAuthenticated && user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

export default AuthGuard;
