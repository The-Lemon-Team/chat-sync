import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(private readonly syncService: SyncService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledSyncs() {
    try {
      await this.syncService.syncDueChatForks();
    } catch (error) {
      this.logger.error('Scheduled sync tick failed', error);
    }
  }
}
