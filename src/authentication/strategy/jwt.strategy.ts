import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../enum/roles.enum';
import { ConfigService } from '@nestjs/config';

type Payload = {
  sub: number;
  email: string;
  roles: Role[];
};

/**
 * Requirements :
 * npm install --save @nestjs/passport passport
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('SECRET_KEY'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: Payload) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
