import type { AuthProvider } from './enums';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  userId: string;
  displayName: string;
  authProvider: AuthProvider;
  tokens: AuthTokens;
}

export interface SocialLoginInput {
  provider: AuthProvider;
  idToken: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}
