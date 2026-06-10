import { IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class SubmitPasswordDto {
  @IsPhoneNumber()
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
