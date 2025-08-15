'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/common/ComingSoon';

export default function ModerationOverviewPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <ComingSoon 
          title="Content Moderation Center"
          description="Monitor and moderate user-generated content across the platform."
          features={[
            'Automated content flagging system',
            'User report management',
            'Bulk moderation tools',
            'Content review workflows',
            'Moderation queue prioritization',
            'Appeal management system',
            'Moderation analytics and insights'
          ]}
        />
      </AppLayout>
    </AuthGuard>
  );
}
