import { Body, Controller, Post } from '@nestjs/common';
import { StartAuthDto } from './dto/start-auth.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmitPasswordDto } from './dto/submit-password.dto';
import { TelegramManagerService } from './telegram-manager.service';

@Controller('telegram/auth')
export class TelegramAuthController {
  constructor(private readonly telegramManager: TelegramManagerService) {}

  /**
   * POST /telegram/auth/start
   * Отправляет код авторизации на указанный номер телефона.
   */
  @Post('start')
  startAuth(@Body() dto: StartAuthDto) {
    return this.telegramManager.startAuth(dto.phone, {
      isHub: dto.isHub,
      parentId: dto.parentId,
    });
  }

  /**
   * POST /telegram/auth/code
   * Подтверждает код из SMS/Telegram.
   * Ответ: { step: 'authorized' } или { step: 'password_required' }.
   */
  @Post('code')
  submitCode(@Body() dto: SubmitCodeDto) {
    return this.telegramManager.submitCode(dto.phone, dto.code);
  }

  /**
   * POST /telegram/auth/password
   * Подтверждает пароль двухфакторной аутентификации (2FA).
   */
  @Post('password')
  submitPassword(@Body() dto: SubmitPasswordDto) {
    return this.telegramManager.submitPassword(dto.phone, dto.password);
  }
}
