import { Controller, Param, Sse } from '@nestjs/common';
import { Observable, Subject, interval, takeUntil, map, finalize } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

interface ProgressEvent {
  type: 'progress' | 'milestone' | 'complete' | 'error';
  data: Record<string, unknown>;
}

@Controller('api/roadmap')
export class RoadmapGateway {
  private readonly subjects = new Map<string, Subject<ProgressEvent>>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Emit a progress event for a specific roadmap generation.
   * Called by RoadmapService during generateWithAi().
   */
  emitProgress(roadmapId: string, event: ProgressEvent): void {
    const subject = this.subjects.get(roadmapId);
    if (subject) {
      subject.next(event);
      if (event.type === 'complete' || event.type === 'error') {
        subject.complete();
        this.subjects.delete(roadmapId);
      }
    }
  }

  @Sse('progress/:roadmapId')
  streamProgress(
    @Param('roadmapId') roadmapId: string,
  ): Observable<MessageEvent> {
    const subject = new Subject<ProgressEvent>();
    this.subjects.set(roadmapId, subject);

    const destroy$ = new Subject<void>();

    // Timeout: auto-close after 60s if no completion
    const timeout = setTimeout(() => {
      subject.next({
        type: 'error',
        data: { message: 'Generation timeout — check roadmap status' },
      });
      subject.complete();
      this.subjects.delete(roadmapId);
      destroy$.next();
      destroy$.complete();
    }, 60_000);

    // Poll roadmap status every 3s as fallback
    interval(3000)
      .pipe(takeUntil(destroy$))
      .subscribe(async () => {
        try {
          const roadmap = await this.prisma.roadmap.findUnique({
            where: { id: roadmapId },
            select: { status: true, progress: true },
          });
          if (roadmap?.status === 'active') {
            subject.next({
              type: 'complete',
              data: { roadmapId, progress: roadmap.progress },
            });
            subject.complete();
            this.subjects.delete(roadmapId);
            destroy$.next();
            destroy$.complete();
          }
        } catch {
          // Ignore poll errors
        }
      });

    return subject.pipe(
      map((event) => ({
        data: JSON.stringify(event),
      }) as MessageEvent),
      finalize(() => {
        clearTimeout(timeout);
        destroy$.next();
        destroy$.complete();
        this.subjects.delete(roadmapId);
      }),
    );
  }
}
