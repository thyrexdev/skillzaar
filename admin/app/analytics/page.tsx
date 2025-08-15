'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import ComingSoon from '@/components/common/ComingSoon';

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <ComingSoon 
          title="Analytics Dashboard"
          description="Comprehensive analytics and reporting tools for platform insights."
          features={[
            'User engagement metrics and trends',
            'Job completion rates and success analytics',
            'Revenue analysis and financial reporting',
            'Platform performance indicators',
            'Custom report generation and export',
            'Real-time dashboard with key metrics',
            'Comparative analysis tools'
          ]}
        />
      </AppLayout>
    </AuthGuard>
  );
}
