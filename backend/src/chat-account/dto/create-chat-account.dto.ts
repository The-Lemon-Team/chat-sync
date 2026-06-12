import { ChatAccountSource } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateChatAccountDto {
  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsEnum(ChatAccountSource)
  source!: ChatAccountSource;

  /** ID чатов Hub для массового экспорта (обязательно при HUB_CLONE) */
  @ValidateIf((o) => o.source === ChatAccountSource.HUB_CLONE)
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  telegramChatIds?: string[];
}
