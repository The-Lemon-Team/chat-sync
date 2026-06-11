import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { TelegramModule } from '../telegram/telegram.module';
import { SyncScheduler } from './sync.scheduler';
import { SyncService } from './sync.service';

@Module({
  imports: [TelegramModule, ChatModule],
  providers: [SyncService, SyncScheduler],
  exports: [SyncService],
})
export class SyncModule {}
