import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { AuditLogService } from '../common/audit-log.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Find all roles available to a company (both system global roles and company custom roles).
   */
  async findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: {
        OR: [
          { companyId: null }, // System global roles
          { companyId },       // Custom company roles
        ],
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Create a custom role inside a company.
   */
  async create(dto: CreateRoleDto, companyId: string, actorId: string, reason?: string) {
    const { nom, permissionKeys } = dto;

    // Avoid duplicate role name within same company
    const existing = await this.prisma.role.findFirst({
      where: { nom, companyId },
    });
    if (existing) {
      throw new BadRequestException(`Un rôle nommé "${nom}" existe déjà dans cette entreprise.`);
    }

    // Verify all specified permission keys exist in database
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });
    if (permissions.length !== permissionKeys.length) {
      throw new BadRequestException("Une ou plusieurs clés de permissions spécifiées n'existent pas.");
    }

    const role = await this.prisma.role.create({
      data: {
        nom,
        niveau: 20, // Forced server-side: all custom roles are fixed at level 20 (EMPLOYE equivalent)
        companyId,
        isSystem: false,
        permissions: {
          create: permissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Write audit log
    await this.auditLogService.log(
      actorId,
      companyId,
      'role.create',
      'Role',
      role.id,
      { nom, permissionKeys, reason },
    );

    return { success: true, data: role };
  }

  /**
   * Update a custom role. Cannot update system roles.
   */
  async update(id: string, dto: UpdateRoleDto, companyId: string, actorId: string, reason?: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} introuvable dans cette entreprise.`);
    }

    if (role.isSystem) {
      throw new ForbiddenException("Sécurité : Impossible de renommer ou modifier un rôle système.");
    }

    const { nom, permissionKeys } = dto;
    const updateData: any = {};

    if (nom) {
      const existing = await this.prisma.role.findFirst({
        where: { nom, companyId, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Un rôle nommé "${nom}" existe déjà.`);
      }
      updateData.nom = nom;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (permissionKeys) {
        // Verify keys exist
        const permissions = await tx.permission.findMany({
          where: { key: { in: permissionKeys } },
        });
        if (permissions.length !== permissionKeys.length) {
          throw new BadRequestException("Une ou plusieurs clés de permissions spécifiées n'existent pas.");
        }

        // Drop current permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Insert new permissions
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: id,
            permissionId: p.id,
          })),
        });
      }

      return tx.role.update({
        where: { id },
        data: updateData,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    // Audit log
    await this.auditLogService.log(
      actorId,
      companyId,
      'role.update',
      'Role',
      id,
      { before: role, after: result, reason },
    );

    return { success: true, data: result };
  }

  /**
   * Delete a custom role. System roles are strictly protected.
   */
  async remove(id: string, companyId: string | null, actorId: string, isRoot: boolean, reason?: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} introuvable.`);
    }

    if (role.isSystem) {
      throw new ForbiddenException("Sécurité : Les rôles système ne peuvent jamais être supprimés.");
    }

    // Security: non-ROOT must belong to the same company
    if (!isRoot && role.companyId !== companyId) {
      throw new ForbiddenException("Non autorisé à supprimer un rôle d'une autre entreprise.");
    }

    await this.prisma.role.delete({
      where: { id },
    });

    // Audit log
    await this.auditLogService.log(
      actorId,
      role.companyId,
      'role.delete',
      'Role',
      id,
      { deletedRole: role, reason },
    );

    return {
      success: true,
      message: `Rôle personnalisé "${role.nom}" supprimé avec succès.`,
    };
  }

  /**
   * Assign multiple roles to a user.
   */
  async assignRoles(
    targetUserId: string,
    dto: AssignRolesDto,
    companyId: string | null,
    actorId: string,
    isRoot: boolean,
    reason?: string,
  ) {
    const { roleIds } = dto;
    const mode = dto.mode || 'add';

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${targetUserId} introuvable.`);
    }

    // Security check: non-ROOT must be targeting a user in their own company
    if (!isRoot && user.companyId !== companyId) {
      throw new ForbiddenException("Non autorisé à modifier les rôles d'un utilisateur tiers.");
    }

    // Verify all specified roles exist and are accessible (either system global or within companyId)
    const targetCompanyId = isRoot ? user.companyId : companyId;
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
        OR: [
          { companyId: null },
          { companyId: targetCompanyId },
        ],
      },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException("Un ou plusieurs rôles spécifiés n'existent pas ou sont inaccessibles.");
    }

    const beforeRoles = await this.prisma.userRole.findMany({
      where: { userId: targetUserId },
      include: { role: true },
    });

    // Role Hierarchy Validation for mode: "add"
    if (mode === 'add') {
      const currentLevels = beforeRoles.map((ur) => ur.role.niveau);
      const niveauMaxActuel = currentLevels.length > 0 ? Math.max(...currentLevels) : 0;

      for (const newRole of roles) {
        if (newRole.niveau > niveauMaxActuel) {
          throw new BadRequestException(
            "Ce rôle est supérieur au niveau actuel de l'utilisateur. Utilisez le mode 'replace' pour une promotion explicite."
          );
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (mode === 'replace') {
        await tx.userRole.deleteMany({
          where: { userId: targetUserId },
        });
      }

      for (const r of roles) {
        // Upsert style: ignore if already assigned (mode add case)
        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: targetUserId,
              roleId: r.id,
            },
          },
          update: {},
          create: {
            userId: targetUserId,
            roleId: r.id,
          },
        });
      }
    });

    const afterRoles = await this.prisma.userRole.findMany({
      where: { userId: targetUserId },
      include: { role: true },
    });

    // Audit log
    await this.auditLogService.log(
      actorId,
      targetCompanyId,
      'role.assign',
      'User',
      targetUserId,
      {
        userId: targetUserId,
        before: beforeRoles.map((ur) => ur.role.nom),
        after: afterRoles.map((ur) => ur.role.nom),
        reason,
      },
    );

    return {
      success: true,
      message: 'Rôles mis à jour avec succès.',
      data: afterRoles.map((ur) => ur.role),
    };
  }
}
