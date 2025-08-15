'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import UserOverview from '@/components/users/UserOverview';

export default function UsersOverviewPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <UserOverview />
      </AppLayout>
    </AuthGuard>
  );
}
