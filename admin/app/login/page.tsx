import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Toaster } from 'sonner';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
      <Toaster position="top-right" />
    </Suspense>
  );
}
