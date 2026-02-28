import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface TrpcContext {
  req: Request;
  userId: string | null;
}

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<TrpcContext>().create();

  router = this.trpc.router;
  procedure = this.trpc.procedure;
  mergeRouters = this.trpc.mergeRouters;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Create context from request — extracts userId from JWT */
  async createContext(req: Request): Promise<TrpcContext> {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = this.jwt.verify(token, {
          secret: this.config.get<string>('JWT_SECRET'),
        }) as { sub: string };
        userId = payload.sub;
      } catch {
        // Invalid token — userId stays null
      }
    }

    return { req, userId };
  }

  /** Protected procedure — requires auth */
  get protectedProcedure() {
    return this.procedure.use(({ ctx, next }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }
      return next({ ctx: { ...ctx, userId: ctx.userId } });
    });
  }
}
