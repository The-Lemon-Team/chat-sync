import { Module } from '@nestjs/common';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramController } from './telegram.controller';
import { TelegramDialogService } from './telegram-dialog.service';
import { TelegramManagerService } from './telegram-manager.service';

@Module({
  controllers: [TelegramAuthController, TelegramController],
  providers: [TelegramManagerService, TelegramDialogService],
  exports: [TelegramManagerService],
})
export class TelegramModule {}
