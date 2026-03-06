import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NarrativeService } from './narrative.service';

/**
 * Episode Publish Scheduler
 *
 * Runs on a 5-minute interval to automatically publish episodes
 * that have been reviewed and have a publishAt date in the past.
 * Uses setInterval for simplicity (no external cron dependency).
 */
@Injectable()
export class NarrativeSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NarrativeSchedulerService.name);

  constructor(private readonly narrativeService: NarrativeService) {}

  onModuleInit() {
    // Check every 5 minutes
    setInterval(() => this.tick(), 5 * 60 * 1000);
    this.logger.log('Episode publish scheduler started (5min interval)');
  }

  private async tick() {
    try {
      const count = await this.narrativeService.publishScheduledEpisodes();
      if (count > 0) {
        this.logger.log(`Published ${count} episodes`);
      }
    } catch (err) {
      this.logger.error('Publish tick failed', err);
    }
  }
}
