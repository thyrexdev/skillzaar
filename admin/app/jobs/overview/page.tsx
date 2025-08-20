'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/common/ComingSoon';

export default function JobsOverviewPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <ComingSoon 
          title="Job Management Overview"
          description="Monitor and manage all job postings, proposals, and project lifecycles."
          features={[
            'Job posting statistics and trends',
            'Proposal conversion rates',
            'Job category performance',
            'Client and freelancer success metrics',
            'Dispute resolution tracking',
            'Project completion analytics',
            'Quality assurance monitoring'
          ]}
        />
      </AppLayout>
    </AuthGuard>
  );
}
