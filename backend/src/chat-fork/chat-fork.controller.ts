import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ChatForkService } from './chat-fork.service';
import { CreateChatForkDto } from './dto/create-chat-fork.dto';
import { SyncService } from '../sync/sync.service';

@Controller('chat-forks')
export class ChatForkController {
  constructor(
    private readonly chatForkService: ChatForkService,
    private readonly syncService: SyncService,
  ) {}

  @Get()
  findAll(@Query('accountId') accountId?: string) {
    return this.chatForkService.findAll(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatForkService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChatForkDto) {
    return this.chatForkService.create(dto);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatForkService.getMessages(
      id,
      limit ? Number(limit) : 50,
      cursor,
    );
  }

  @Post(':id/sync')
  sync(@Param('id') id: string) {
    return this.syncService.syncChatFork(id);
  }
}
