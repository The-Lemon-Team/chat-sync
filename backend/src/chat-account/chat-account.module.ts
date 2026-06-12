import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { ChatAccountController } from './chat-account.controller';
import { ChatAccountService } from './chat-account.service';

@Module({
  imports: [TelegramModule],
  controllers: [ChatAccountController],
  providers: [ChatAccountService],
  exports: [ChatAccountService],
})
export class ChatAccountModule {}
