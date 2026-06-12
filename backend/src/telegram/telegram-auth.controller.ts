import { Body, Controller, Post } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { StartAuthDto } from './dto/start-auth.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmitPasswordDto } from './dto/submit-password.dto';
import { TelegramManagerService } from './telegram-manager.service';

@Controller('telegram/auth')
export class TelegramAuthController {
  constructor(private readonly telegramManager: TelegramManagerService) {}

  /** Привязка Hub Telegram Account (один на пользователя) */
  @Post('start')
  startAuth(@CurrentUser() user: AuthUser, @Body() dto: StartAuthDto) {
    return this.telegramManager.startHubAuth(dto.phone, user.id);
  }

  @Post('code')
  submitCode(@CurrentUser() user: AuthUser, @Body() dto: SubmitCodeDto) {
    return this.telegramManager.submitCode(dto.phone, dto.code, user.id);
  }

  @Post('password')
  submitPassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitPasswordDto,
  ) {
    return this.telegramManager.submitPassword(
      dto.phone,
      dto.password,
      user.id,
    );
  }
}
