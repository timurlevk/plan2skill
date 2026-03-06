import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { provider: 'apple' | 'google'; idToken: string }) {
    return this.authService.socialLogin(body.provider, body.idToken);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: { user: { sub: string } }) {
    return this.authService.logout(req.user.sub);
  }

  // ─── Dev-only endpoints (NODE_ENV=development) ────────────────

  @Get('dev/users')
  async devUsers() {
    return this.authService.devListUsers();
  }

  @Post('dev/login')
  @HttpCode(200)
  async devLogin(@Body() body: { userId: string }) {
    return this.authService.devLoginAs(body.userId);
  }

  @Post('dev/create')
  @HttpCode(201)
  async devCreate(@Body() body: { displayName?: string }) {
    return this.authService.devCreateUser(body.displayName);
  }

  @Delete('dev/users/:id')
  async devDelete(@Param('id') userId: string) {
    return this.authService.devDeleteUser(userId);
  }
}
