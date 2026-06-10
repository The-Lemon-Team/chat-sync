import { Module } from '@nestjs/common';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramManagerService } from './telegram-manager.service';

@Module({
  controllers: [TelegramAuthController],
  providers: [TelegramManagerService],
  exports: [TelegramManagerService],
})
export class TelegramModule {}
