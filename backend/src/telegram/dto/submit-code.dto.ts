import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class SubmitCodeDto {
  @IsPhoneNumber()
  phone!: string;

  @IsString()
  @Length(5, 6)
  code!: string;
}
