'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import EnhancedUserManagement from '@/components/users/EnhancedUserManagement';

export default function UsersListPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <EnhancedUserManagement />
      </AppLayout>
    </AuthGuard>
  );
}
