'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import VerificationQueue from '@/components/users/VerificationQueue';

export default function UserVerificationPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <VerificationQueue />
      </AppLayout>
    </AuthGuard>
  );
}
