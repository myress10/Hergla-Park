import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'hergla_park_nest_secret_key_12345',
    });
  }

  async validate(payload: any) {
    // Standard Passport validate hook. Payload contains { sub: user.id, role: user.role }
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Payload de token invalide');
    }
    return { id: payload.sub, role: payload.role };
  }
}
