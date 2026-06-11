import { Module } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { ChatForkController } from './chat-fork.controller';
import { ChatForkService } from './chat-fork.service';

@Module({
  imports: [SyncModule],
  controllers: [ChatForkController],
  providers: [ChatForkService],
})
export class ChatForkModule {}
