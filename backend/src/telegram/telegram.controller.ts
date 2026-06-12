import { Controller, Get, Param } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { mapAccountToPayload } from '../common/mappers/account.mapper';
import { OwnershipService } from '../common/ownership.service';
import { TelegramDialogService } from './telegram-dialog.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly dialogService: TelegramDialogService,
    private readonly ownership: OwnershipService,
  ) {}

  /** Hub Telegram Account текущего пользователя */
  @Get('hub')
  async getHub(@CurrentUser() user: AuthUser) {
    const hub = await this.ownership.getHubAccount(user.id);
    if (!hub) return null;
    return mapAccountToPayload(hub, hub.isActive);
  }

  /** @deprecated Используйте GET /telegram/hub и GET /chat-accounts */
  @Get('accounts')
  listAccounts(@CurrentUser() user: AuthUser) {
    return this.dialogService.listAllAccounts(user.id);
  }

  /** Диалоги Hub — для просмотра, подписки и добавления чатов */
  @Get('hub/dialogs')
  async listHubDialogs(@CurrentUser() user: AuthUser) {
    const hub = await this.ownership.getHubAccount(user.id);
    if (!hub) {
      return [];
    }
    return this.dialogService.listDialogs(hub.id);
  }

  @Get('accounts/:accountId/dialogs')
  async listDialogs(
    @CurrentUser() user: AuthUser,
    @Param('accountId') accountId: string,
  ) {
    await this.ownership.assertHubOwnership(user.id, accountId);
    return this.dialogService.listDialogs(accountId);
  }
}
