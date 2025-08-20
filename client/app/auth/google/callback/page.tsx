'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { oauthService } from '@/services/oauthService';
import { useAuth } from '@/stores/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // This contains the role
        const error = searchParams.get('error');

        if (error) {
          setError('Authorization was denied or cancelled');
          setIsProcessing(false);
          return;
        }

        if (!code || !state) {
          setError('Missing authorization code or role information');
          setIsProcessing(false);
          return;
        }

        const result = await oauthService.handleGoogleCallback(code, state);
        
        // Update auth store with user data
        login(result.user, result.token);
        
        // Show welcome message if new user
        if (result.isNewUser) {
          // You could show a toast or modal here
          console.log('Welcome to Frevix! Your account has been created.');
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Google OAuth callback error:', error);
        setError(error.message || 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router, login]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-xl p-4">
          <CardHeader>
            <h2 className="text-2xl font-semibold text-center text-destructive">
              Authentication Failed
            </h2>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="text-primary hover:underline"
            >
              Return to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-xl p-4">
        <CardContent className="text-center space-y-4 pt-6">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium">Completing Google Sign-In...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we set up your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
