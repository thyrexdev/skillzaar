'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/common/ComingSoon';

export default function UserVerificationPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <ComingSoon 
          title="User Verification Queue"
          description="Review and manage user identity verification requests."
          features={[
            'ID document verification workflows',
            'Bulk verification actions',
            'Verification status management',
            'Document image preview and analysis',
            'Verification history tracking',
            'Automated verification checks',
            'Rejection reason templates'
          ]}
        />
      </AppLayout>
    </AuthGuard>
  );
}
