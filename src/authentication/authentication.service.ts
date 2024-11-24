import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DrizzleProvider } from '../drizzle/drizzle.provider';
import * as speakeasy from 'speakeasy';
import { eq, sql } from 'drizzle-orm';
import { users } from '../db';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from 'src/mailer/mailer.service';
import { Role } from 'src/enum/roles.enum';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordConfirmDto } from './dto/reset-password-confirm.dto';
import { RolesManagementDto } from './dto/roles-management.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class AuthenticationService {
  private db = this.drizzleProvider.getDatabase();

  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  protected async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  protected validateRoles(roles: string[]): boolean {
    // Validate that each role is authorized
    return roles.every((role) => Object.values(Role).includes(role as Role));
  }

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, password } = registerDto;

    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (userProbablyExists.length > 0) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    // hash password
    const hashedPassword = await this.hashPassword(password);

    // insert the new user
    const newUser = await this.db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const theNewUser = newUser[0];
    delete theNewUser.password;
    // Send Email
    await this.mailerService.sendMail(email, 'Welcome', 'welcomeSignup', {
      fullName: `${firstName} ${lastName}`,
    });

    return {
      message: 'User Successfully created 🚀',
      user: theNewUser,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`User with email ${email} not exists`);
    }

    const theUser = userProbablyExists[0];
    // verify if user is active
    if (!theUser.isActive) {
      throw new ForbiddenException(
        'User is deleted or deactivated by Administrator',
      );
    }

    // Compare password
    const match = await bcrypt.compare(password, theUser.password);
    if (!match) {
      throw new UnauthorizedException("Password doesn't match");
    }

    const payload = {
      sub: theUser.id,
      email: theUser.email,
      roles: theUser.roles,
    };
    const token = this.jwtService.sign(payload);

    delete theUser.password;
    return {
      token,
      user: theUser,
    };
  }

  async resetPassword(resetPassword: ResetPasswordDto) {
    const { email } = resetPassword;

    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`User with email ${email} not exists`);
    }

    const theUser = userProbablyExists[0];
    const token = speakeasy.totp({
      secret: this.configService.get('SECRET_OTPAUTH'),
      digits: 6,
      step: 120,
      encoding: 'base32',
    });

    const url = 'http://localhost:3000/auth/reset-password-confirm';
    // Send Email
    await this.mailerService.sendMail(email, 'Welcome', 'forgetPassword', {
      token: token,
      url: url,
      fullName: `${theUser.firstName} ${theUser.lastName}`,
    });

    return {
      message: 'Reset password mail has been sent',
    };
  }

  async resetPasswordConfirm(resetPasswordConfirm: ResetPasswordConfirmDto) {
    const { token, email, password } = resetPasswordConfirm;

    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`User with email ${email} not exists`);
    }

    const isValidToken = speakeasy.totp.verify({
      token: token,
      secret: this.configService.get('SECRET_OTPAUTH'),
      digits: 6,
      step: 120,
      encoding: 'base32',
    });

    if (!isValidToken) {
      throw new UnauthorizedException('Invalid/Expired token');
    }
    const theUser = userProbablyExists[0];

    // hash password
    const hashedPassword = await this.hashPassword(password);

    const updateUserPassword = await this.db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, theUser.id))
      .returning({
        id: users.password,
        email: users.email,
      });

    console.log(updateUserPassword[0]);
    const theUserWithPasswordUpdated = updateUserPassword[0];

    return {
      message: 'Password Successfully updated 🚀',
      user: theUserWithPasswordUpdated,
    };
  }

  async deleteAccount(idUser: number, deleteAccountDto: DeleteAccountDto){
    const { password } = deleteAccountDto;

    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, idUser))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`User not exists`);
    }

    const theUser = userProbablyExists[0];
    // Verify password matching
    const match = await bcrypt.compare(password, theUser.password);

    if (!match) {
      throw new UnauthorizedException("Password doesn't match");
    }

    const deleteUsersById = await this.db
      .update(users)
      .set({
        isActive: false,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, theUser.id))
      .returning();
    const theUserDeleted = deleteUsersById[0];

    delete theUserDeleted.password;
    return {
      message: 'The user is no longer active',
      user: theUserDeleted,
    };
  }

  async updateUserRoles(rolesManagementDto: RolesManagementDto) {
    const { userId, roles } = rolesManagementDto;

    if (!this.validateRoles(roles)) {
      throw new NotAcceptableException('Invalid roles.guard provided');
    }

    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`User not exists`);
    }

    const theUser = userProbablyExists[0];
    // Ensure 'USER' role is included
    const updatedRoles = Array.from(
      new Set([
        ...(Array.isArray(theUser.roles) ? theUser.roles : []),
        ...(Array.isArray(roles) ? roles : []),
        Role.USER,
      ]),
    );

    const usersRoleUpdated = await this.db
      .update(users)
      .set({
        roles: updatedRoles,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId))
      .returning();
    const theUserUpdated = usersRoleUpdated[0];
    delete theUserUpdated.password;
    return {
      message: "User's roles updated 🚀",
      user: theUserUpdated,
    };
  }

  async deleteUserRoles(rolesManagementDto: RolesManagementDto) {
    const { userId, roles } = rolesManagementDto;

    if (!this.validateRoles(roles)) {
      throw new NotAcceptableException('Invalid roles.guard provided');
    }
    // verify if user exit
    const userProbablyExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1); // Limit results to 1 for reasons of efficiency

    if (!userProbablyExists.length) {
      throw new NotFoundException(`User not exists`);
    }

    const theUser = userProbablyExists[0];

    // Ensure user.roles.guard is an array
    const rolesArray = Array.isArray(theUser.roles) ? theUser.roles : [];

    // Filter out the roles.guard to be deleted
    const updatedRoles = rolesArray
      .filter((role): role is Role => typeof role === 'string')
      .filter((role) => !roles.includes(role));

    // Ensure 'USER' role is included
    if (!updatedRoles.includes(Role.USER)) {
      updatedRoles.push(Role.USER);
    }

    const usersRoleUpdated = await this.db
      .update(users)
      .set({
        roles: updatedRoles,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userId))
      .returning();
    const theUserUpdated = usersRoleUpdated[0];
    delete theUserUpdated.password;
    return {
      message: "User's roles updated 🚀",
      user: theUserUpdated,
    };
  }
}
