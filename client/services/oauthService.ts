import api from '@/lib/axios';

export interface OAuthConfig {
  google: {
    clientId: string;
    enabled: boolean;
  };
  redirectUri: {
    google: string;
  };
}

export interface OAuthResult {
  user: any;
  token: string;
  isNewUser: boolean;
}

class OAuthService {
  private config: OAuthConfig | null = null;

  async getConfig(): Promise<OAuthConfig> {
    if (this.config) return this.config;
    
    try {
      const response = await api.get('/oauth/config');
      this.config = response.data;
      return this.config;
    } catch (error) {
      console.error('Failed to fetch OAuth config:', error);
      throw new Error('Failed to load OAuth configuration');
    }
  }

  generateGoogleAuthUrl(role: 'CLIENT' | 'FREELANCER'): string {
    if (!this.config?.google.enabled) {
      throw new Error('Google OAuth is not enabled');
    }

    const params = new URLSearchParams({
      client_id: this.config.google.clientId,
      redirect_uri: this.config.redirectUri.google,
      response_type: 'code',
      scope: 'openid email profile',
      state: role, // Pass role as state
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }


  async handleGoogleCallback(code: string, role: string): Promise<OAuthResult> {
    try {
      const response = await api.post('/oauth/google', { code, role });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Google authentication failed');
    }
  }

  async unlinkGoogleProvider(): Promise<void> {
    try {
      await api.delete('/oauth/unlink/google');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unlink Google account');
    }
  }

  // Initialize config on service creation
  async init(): Promise<void> {
    await this.getConfig();
  }
}

export const oauthService = new OAuthService();
