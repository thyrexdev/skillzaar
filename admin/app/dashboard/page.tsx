import AuthGuard from '@/components/auth/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/components/dashboard/Dashboard';
import { Toaster } from 'sonner';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <Dashboard />
      </AppLayout>
      <Toaster position="top-right" />
    </AuthGuard>
  );
}
