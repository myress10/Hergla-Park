import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const { nom, email, password, role, assignedSpaceId } = registerDto;

    // Check if email already registered
    const userExists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExists) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Validate if assignedSpaceId exists in Espace table
    if (assignedSpaceId) {
      const space = await this.prisma.espace.findUnique({
        where: { id: assignedSpaceId },
      });
      if (!space) {
        throw new BadRequestException('L\'espace assigné spécifié n\'existe pas');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user profile
    const user = await this.prisma.user.create({
      data: {
        nom,
        email: email.toLowerCase(),
        passwordHash,
        role: role || 'EMPLOYE',
        assignedSpaceId: assignedSpaceId || null,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.role);

    // Exclude passwordHash from response
    const { passwordHash: _, ...result } = user;
    return {
      success: true,
      data: result,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides (email ou mot de passe incorrect)');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants invalides (email ou mot de passe incorrect)');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.role);

    const { passwordHash: _, ...result } = user;
    return {
      success: true,
      data: result,
      token,
    };
  }

  private generateToken(userId: string, role: string): string {
    const payload = { sub: userId, role: role };
    return this.jwtService.sign(payload);
  }
}
