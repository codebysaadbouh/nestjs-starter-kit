import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordConfirmDto } from './dto/reset-password-confirm.dto';
import { Request } from 'express';
import { RolesManagementDto } from './dto/roles-management.dto';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Roles } from './decorator/roles/roles.decorator';
import { Role } from 'src/enum/roles.enum';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  /**
   * @param registerDto
   */
  @Post('register')
  signup(@Body() registerDto: RegisterDto) {
    return this.authenticationService.register(registerDto);
  }

  /**
   * @param loginDto
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto);
  }

  /**
   * @param roleManagementDto
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('update-roles')
  updateRoles(@Body() roleManagementDto: RolesManagementDto){
    return this.authenticationService.updateUserRoles(roleManagementDto);
  }

  /**
   *
   * @param roleManagementDto
   */
  @Roles(Role.ADMIN)
  @Post('delete-roles')
  deleteRoles(@Body() roleManagementDto: RolesManagementDto){
    return this.authenticationService.deleteUserRoles(roleManagementDto);
  }
  /**
   * @param resetPasswordDto
   */
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authenticationService.resetPassword(resetPasswordDto);
  }

  /**
   * @param resetPasswordConfirmDto
   */
  @Post('reset-password-confirm')
  resetPasswordConfirm(
    @Body() resetPasswordConfirmDto: ResetPasswordConfirmDto,
  ) {
    return this.authenticationService.resetPasswordConfirm(
      resetPasswordConfirmDto,
    );
  }
  /**
   * @param request
   * @param deleteAccountDto
   */
  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  deleteAccount(
    @Req() request: Request,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    const idUser = request.user['id'];
    return this.authenticationService.deleteAccount(idUser, deleteAccountDto);
  }
}
