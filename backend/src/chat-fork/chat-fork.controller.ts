import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { OwnershipService } from '../common/ownership.service';
import { SyncService } from '../sync/sync.service';
import { ChatForkService } from './chat-fork.service';
import { CreateChatForkDto } from './dto/create-chat-fork.dto';

@Controller('chat-forks')
export class ChatForkController {
  constructor(
    private readonly chatForkService: ChatForkService,
    private readonly syncService: SyncService,
    private readonly ownership: OwnershipService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('accountId') accountId?: string,
  ) {
    return this.chatForkService.findAll(user.id, accountId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chatForkService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateChatForkDto) {
    return this.chatForkService.create(user.id, dto);
  }

  @Get(':id/messages')
  async getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatForkService.getMessages(
      user.id,
      id,
      limit ? Number(limit) : 50,
      cursor,
    );
  }

  @Post(':id/sync')
  async sync(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.ownership.assertForkOwnership(user.id, id);
    return this.syncService.syncChatFork(id);
  }
}
