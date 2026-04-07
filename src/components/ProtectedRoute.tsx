// AnyFix – src/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'CLIENT' | 'MASTER' | 'ADMIN';
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If no user data, try to fetch it
    if (user === undefined) {
      fetchMe();
    }
  }, [user, fetchMe]);

  useEffect(() => {
    // Wait for user data to load
    if (user === undefined) return;

    // If not authenticated, redirect to login
    if (user === null) {
      router.push(fallbackPath);
      return;
    }

    // If role is required and user doesn't have it, redirect
    if (requiredRole && user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [user, requiredRole, router, fallbackPath]);

  // Show loading while checking authentication
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F6F2'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (user === null) {
    return null;
  }

  // If role check fails, don't render anything (will redirect)
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has required role
  return <>{children}</>;
}