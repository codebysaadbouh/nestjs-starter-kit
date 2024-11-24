import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import { Role } from '../../enum/roles.enum';

export class RolesManagementDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  readonly userId: number;

  @IsNotEmpty()
  @IsEnum(Role, { each: true })
  readonly roles: Role[];
}
