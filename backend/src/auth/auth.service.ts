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
    const { nom, email, password, role, assignedSpaceId, companyId } = registerDto;

    // Check if email already registered
    const userExists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExists) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Validate company exists (if provided)
    if (companyId) {
      const company = await this.prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        throw new BadRequestException("L'entreprise spécifiée n'existe pas");
      }
    }

    // Validate if assignedSpaceId exists and belongs to the same company
    if (assignedSpaceId) {
      const space = await this.prisma.espace.findFirst({
        where: {
          id: assignedSpaceId,
          ...(companyId ? { companyId } : {}),
        },
      });
      if (!space) {
        throw new BadRequestException("L'espace assigné spécifié n'existe pas ou n'appartient pas à cette entreprise");
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Resolve target role to assign (default EMPLOYE)
    const targetRoleName = role || 'EMPLOYE';
    const roleRecord = await this.prisma.role.findFirst({
      where: {
        nom: targetRoleName,
        OR: [
          { companyId: null },
          { companyId: companyId || undefined },
        ],
      },
    });
    if (!roleRecord) {
      throw new BadRequestException(`Le rôle "${targetRoleName}" n'existe pas.`);
    }

    // Save user profile
    const user = await this.prisma.user.create({
      data: {
        nom,
        email: email.toLowerCase(),
        passwordHash,
        companyId: companyId || null,
        assignedSpaceId: assignedSpaceId || null,
        roles: {
          create: {
            roleId: roleRecord.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const rolesList = user.roles.map((ur) => ur.role.nom);
    const token = this.generateToken(user.id, rolesList, user.companyId);

    // Exclude passwordHash from response
    const { passwordHash: _, roles, ...result } = user;
    return {
      success: true,
      data: {
        ...result,
        role: targetRoleName,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides (email ou mot de passe incorrect)');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants invalides (email ou mot de passe incorrect)');
    }

    const rolesList = user.roles.map((ur) => ur.role.nom);
    const token = this.generateToken(user.id, rolesList, user.companyId);

    const { passwordHash: _, roles, ...result } = user;
    return {
      success: true,
      data: {
        ...result,
        role: rolesList[0] || 'EMPLOYE',
      },
      token,
    };
  }

  private generateToken(userId: string, roles: string[], companyId: string | null): string {
    const payload = { sub: userId, roles, companyId };
    return this.jwtService.sign(payload);
  }
}
