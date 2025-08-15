'use client';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import FinancialOverview from '@/components/financial/FinancialOverview';

export default function FinancialOverviewPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <FinancialOverview />
      </AppLayout>
    </AuthGuard>
  );
}
