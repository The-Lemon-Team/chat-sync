import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { ChatAccountService } from './chat-account.service';
import { CreateChatAccountDto } from './dto/create-chat-account.dto';

@Controller('chat-accounts')
export class ChatAccountController {
  constructor(private readonly chatAccountService: ChatAccountService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.chatAccountService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateChatAccountDto) {
    return this.chatAccountService.create(user.id, dto);
  }
}
