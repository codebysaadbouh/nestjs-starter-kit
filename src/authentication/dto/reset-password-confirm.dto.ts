import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordConfirmDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
  @IsNotEmpty()
  readonly password: string;
  @IsNotEmpty()
  readonly token: string;
}
