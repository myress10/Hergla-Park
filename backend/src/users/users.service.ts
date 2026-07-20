import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogService } from '../common/audit-log.service';
import * as bcrypt from 'bcryptjs';

type AuthUser = { id: string; role: string; companyId: string | null; isRoot?: boolean };

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(createUserDto: CreateUserDto, actor: AuthUser, targetCompanyId?: string, reason?: string) {
    const { nom, email, password, role, assignedSpaceId } = createUserDto;

    const companyId = actor.isRoot ? targetCompanyId : actor.companyId;
    if (!companyId) {
      throw new BadRequestException("Une entreprise cible ('companyId') est requise pour créer un utilisateur.");
    }

    const userExists = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (userExists) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Validate that the assigned space belongs to the same company
    if (assignedSpaceId) {
      const space = await this.prisma.espace.findFirst({
        where: { id: assignedSpaceId, companyId },
      });
      if (!space) {
        throw new BadRequestException(
          "L'espace assigné spécifié n'existe pas ou n'appartient pas à cette entreprise",
        );
      }
    }

    // Resolve role name (or default to EMPLOYE) to dynamic Role ID
    const targetRoleName = role || 'EMPLOYE';
    const roleRecord = await this.prisma.role.findFirst({
      where: {
        nom: targetRoleName,
        OR: [
          { companyId: null },
          { companyId },
        ],
      },
    });
    if (!roleRecord) {
      throw new BadRequestException(`Le rôle "${targetRoleName}" n'existe pas.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.create({
      data: {
        nom,
        email: email.toLowerCase(),
        passwordHash,
        companyId,
        assignedSpaceId: assignedSpaceId || null,
        roles: {
          create: {
            roleId: roleRecord.id,
          },
        },
      },
      select: {
        id: true,
        nom: true,
        email: true,
        companyId: true,
        assignedSpaceId: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Write audit log
    await this.auditLogService.log(
      actor.id,
      companyId,
      'user.create',
      'User',
      user.id,
      { nom, email, assignedRole: targetRoleName, reason },
    );

    return {
      success: true,
      data: {
        ...user,
        role: targetRoleName, // keep return signature compatible with frontends
      },
    };
  }

  async findAll(actor: AuthUser, targetCompanyId?: string) {
    const where: any = {};
    if (!actor.isRoot) {
      where.companyId = actor.companyId;
    } else if (targetCompanyId) {
      where.companyId = targetCompanyId;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        email: true,
        companyId: true,
        assignedSpaceId: true,
        assignedSpace: {
          select: {
            id: true,
            nom: true,
            categorie: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return users.map((u) => ({
      ...u,
      role: u.roles[0]?.role.nom || 'EMPLOYE', // compatibility mapping
    }));
  }

  async findOne(id: string, actor: AuthUser) {
    const where: any = { id };
    if (!actor.isRoot) {
      where.companyId = actor.companyId;
    }

    const user = await this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        nom: true,
        email: true,
        companyId: true,
        assignedSpaceId: true,
        assignedSpace: {
          select: {
            id: true,
            nom: true,
            categorie: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    return {
      ...user,
      role: user.roles[0]?.role.nom || 'EMPLOYE',
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestor: AuthUser,
    reason?: string,
  ) {
    const where: any = { id };
    if (!requestor.isRoot) {
      where.companyId = requestor.companyId;
    }

    const user = await this.prisma.user.findFirst({
      where,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // Access control: SUPERADMIN can modify anyone in the company. Owner can modify their own details.
    if (!requestor.isRoot && requestor.role !== 'SUPERADMIN' && requestor.id !== id) {
      throw new BadRequestException('Non autorisé à modifier cet utilisateur');
    }

    const { nom, email, password, role, assignedSpaceId } = updateUserDto;
    const updateData: any = {};

    if (nom) updateData.nom = nom;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailExists) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà');
      }
      updateData.email = email.toLowerCase();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    // Only SUPERADMIN/ROOT can update role or assignedSpaceId
    if (requestor.isRoot || requestor.role === 'SUPERADMIN') {
      if (assignedSpaceId !== undefined) {
        if (assignedSpaceId) {
          const space = await this.prisma.espace.findFirst({
            where: { id: assignedSpaceId, companyId: user.companyId || undefined },
          });
          if (!space) {
            throw new BadRequestException(
              "L'espace assigné spécifié n'existe pas ou n'appartient pas à cette entreprise",
            );
          }
          updateData.assignedSpaceId = assignedSpaceId;
        } else {
          updateData.assignedSpaceId = null;
        }
      }
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update basic fields
      const res = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nom: true,
          email: true,
          companyId: true,
          assignedSpaceId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Update role mapping if provided (for compatibility)
      if (role && (requestor.isRoot || requestor.role === 'SUPERADMIN')) {
        const roleRecord = await tx.role.findFirst({
          where: {
            nom: role,
            OR: [
              { companyId: null },
              { companyId: user.companyId },
            ],
          },
        });
        if (!roleRecord) {
          throw new BadRequestException(`Le rôle "${role}" n'existe pas.`);
        }

        // Replace all current user roles with this single role
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({
          data: {
            userId: id,
            roleId: roleRecord.id,
          },
        });
      }

      return res;
    });

    // Write audit log
    await this.auditLogService.log(
      requestor.id,
      user.companyId,
      'user.update',
      'User',
      id,
      { before: user, after: updatedUser, reason },
    );

    return {
      success: true,
      data: updatedUser,
    };
  }

  async remove(id: string, requestor: AuthUser, reason?: string) {
    const where: any = { id };
    if (!requestor.isRoot) {
      where.companyId = requestor.companyId;
    }

    const user = await this.prisma.user.findFirst({
      where,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    // A SUPERADMIN/ROOT cannot delete themselves
    if (user.id === requestor.id) {
      throw new BadRequestException('Impossible de supprimer votre propre compte.');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    // Write audit log
    await this.auditLogService.log(
      requestor.id,
      user.companyId,
      'user.delete',
      'User',
      id,
      { deletedUser: user, reason },
    );

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
  }

  async updatePassword(id: string, password: string, requestor: AuthUser, reason?: string) {
    const where: any = { id };
    if (!requestor.isRoot) {
      where.companyId = requestor.companyId;
    }

    const user = await this.prisma.user.findFirst({
      where,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    if (!requestor.isRoot && requestor.role !== 'SUPERADMIN' && requestor.id !== id) {
      throw new ForbiddenException('Non autorisé à modifier le mot de passe de cet utilisateur');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Write audit log
    await this.auditLogService.log(
      requestor.id,
      user.companyId,
      'user.password-update',
      'User',
      id,
      { reason },
    );

    return {
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    };
  }
}
