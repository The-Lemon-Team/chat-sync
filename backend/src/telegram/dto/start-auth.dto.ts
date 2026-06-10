import { IsBoolean, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class StartAuthDto {
  @IsPhoneNumber()
  phone!: string;

  @IsOptional()
  @IsBoolean()
  isHub?: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;
}
