import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthProvider } from '@plan2skill/types';

interface TokenPayload {
  sub: string;
  displayName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async socialLogin(provider: AuthProvider, idToken: string) {
    // Verify the token with the provider and extract subject ID
    const providerSubId = await this.verifyProviderToken(provider, idToken);

    // Find or create user (Zero-PII: only store provider sub ID)
    let user = await this.prisma.user.findUnique({
      where: { providerSubId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          displayName: `Adventurer_${Math.random().toString(36).slice(2, 8)}`,
          authProvider: provider,
          providerSubId,
          progression: {
            create: {
              totalXp: 0,
              level: 1,
              coins: 0,
              energyCrystals: 3,
              maxEnergyCrystals: 3,
            },
          },
          streak: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
              maxFreezes: 1,
            },
          },
        },
      });
    }

    return this.generateTokens(user.id, user.displayName);
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.displayName);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(userId: string, displayName: string) {
    const payload: TokenPayload = { sub: userId, displayName };

    const accessToken = this.jwt.sign({ ...payload } as Record<string, unknown>);

    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + parseInt(refreshExpiry, 10) || 7);

    const refreshToken = this.jwt.sign({ ...payload } as Record<string, unknown>, { expiresIn: refreshExpiry as any });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      userId,
      displayName,
    };
  }

  private async verifyProviderToken(provider: AuthProvider, idToken: string): Promise<string> {
    // In production: verify with Apple/Google APIs
    // For dev: accept the token as-is and use it as the sub ID
    if (process.env.NODE_ENV === 'development') {
      return `${provider}_${idToken}`;
    }

    if (provider === 'apple') {
      return this.verifyAppleToken(idToken);
    }
    if (provider === 'google') {
      return this.verifyGoogleToken(idToken);
    }
    throw new UnauthorizedException(`Unknown provider: ${provider}`);
  }

  private async verifyAppleToken(idToken: string): Promise<string> {
    // TODO: Implement Apple Sign-In verification
    // https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user
    throw new UnauthorizedException('Apple Sign-In not configured');
  }

  private async verifyGoogleToken(idToken: string): Promise<string> {
    // TODO: Implement Google Sign-In verification
    // https://developers.google.com/identity/sign-in/web/backend-auth
    throw new UnauthorizedException('Google Sign-In not configured');
  }
}
