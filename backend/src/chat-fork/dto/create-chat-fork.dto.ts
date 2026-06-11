import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ChatSyncMode, ChatType } from '@prisma/client';

export class CreateChatForkDto {
  @IsString()
  accountId!: string;

  @IsString()
  title!: string;

  @IsEnum(ChatType)
  type!: ChatType;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsEnum(ChatSyncMode)
  syncMode?: ChatSyncMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  syncInterval?: number;
}
