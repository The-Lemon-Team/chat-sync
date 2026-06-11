import { Controller, Get, Param } from '@nestjs/common';
import { TelegramDialogService } from './telegram-dialog.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly dialogService: TelegramDialogService) {}

  /** Список подключённых Telegram-аккаунтов */
  @Get('accounts')
  listAccounts() {
    return this.dialogService.listAccounts();
  }

  /**
   * Доступные диалоги для ручного выбора (без авто-импорта).
   * Клиент показывает список — пользователь сам решает, какие чаты форкнуть.
   */
  @Get('accounts/:accountId/dialogs')
  listDialogs(@Param('accountId') accountId: string) {
    return this.dialogService.listDialogs(accountId);
  }
}
