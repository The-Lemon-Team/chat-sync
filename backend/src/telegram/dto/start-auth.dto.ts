import { IsPhoneNumber } from 'class-validator';

export class StartAuthDto {
  @IsPhoneNumber()
  phone!: string;
}
