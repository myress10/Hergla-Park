import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
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
        ...(companyId ? { userCompanies: { create: { companyId } } } : {}),
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
      activeCompanyId: user.companyId,
      availableCompanies: companyId ? [{ id: companyId, nom: '', slug: '' }] : [],
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
        userCompanies: {
          include: {
            company: true,
          },
        },
        company: true,
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

    let availableCompanies: { id: string; nom: string; slug: string }[] = [];

    if (user.userCompanies && user.userCompanies.length > 0) {
      availableCompanies = user.userCompanies.map((uc) => ({
        id: uc.company.id,
        nom: uc.company.nom,
        slug: uc.company.slug,
      }));
    } else if (user.company) {
      availableCompanies = [
        {
          id: user.company.id,
          nom: user.company.nom,
          slug: user.company.slug,
        },
      ];
    }

    const { passwordHash: _, roles, userCompanies: __, company: ___, ...result } = user;
    return {
      success: true,
      data: {
        ...result,
        role: rolesList[0] || 'EMPLOYE',
      },
      token,
      activeCompanyId: user.companyId,
      availableCompanies,
    };
  }

  async switchCompany(userId: string, targetCompanyId: string, isRoot: boolean) {
    const targetCompany = await this.prisma.company.findUnique({
      where: { id: targetCompanyId },
    });

    if (!targetCompany) {
      throw new BadRequestException("L'entreprise cible spécifiée n'existe pas.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        userCompanies: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    if (!isRoot) {
      const isSuperAdmin = user.roles.some((ur) => ur.role.nom === 'SUPERADMIN');
      const isAttached = user.userCompanies.some((uc) => uc.companyId === targetCompanyId);

      if (!isSuperAdmin || !isAttached) {
        throw new ForbiddenException("Accès refusé. Vous n'êtes pas autorisé à basculer vers cette entreprise.");
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: targetCompanyId },
    });

    const rolesList = user.roles.map((ur) => ur.role.nom);
    const newToken = this.generateToken(userId, rolesList, targetCompanyId);

    return {
      success: true,
      token: newToken,
      activeCompanyId: targetCompanyId,
      company: {
        id: targetCompany.id,
        nom: targetCompany.nom,
        slug: targetCompany.slug,
      },
    };
  }

  private generateToken(userId: string, roles: string[], companyId: string | null): string {
    const payload = { sub: userId, roles, companyId };
    return this.jwtService.sign(payload);
  }
}
