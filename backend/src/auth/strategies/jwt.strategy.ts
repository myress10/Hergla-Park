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
    // Standard Passport validate hook. Payload contains { sub, roles, companyId }
    if (!payload.sub || !payload.roles) {
      throw new UnauthorizedException('Payload de token invalide');
    }
    // companyId is null for ROOT-level users (no company affiliation)
    return {
      id: payload.sub,
      roles: payload.roles,
      role: payload.roles[0] || 'EMPLOYE', // keep string role for backward compatibility
      companyId: payload.companyId ?? null,
    };
  }
}
