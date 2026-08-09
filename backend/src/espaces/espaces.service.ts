import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEspaceDto } from './dto/create-espace.dto';
import { UpdateEspaceDto } from './dto/update-espace.dto';
import { AuditLogService } from '../common/audit-log.service';

type AuthUser = { id: string; role: string; companyId: string | null; isRoot?: boolean };

@Injectable()
export class EspacesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Helper to build companyId query filters.
   * If caller is ROOT, they can view cross-company (no filter) or filter by a specific target company.
   * If caller is standard, they are strictly limited to their own companyId.
   */
  private buildCompanyFilter(user: AuthUser, targetCompanyId?: string) {
    if (user.isRoot) {
      return targetCompanyId ? { companyId: targetCompanyId } : {};
    }
    return { companyId: user.companyId };
  }

  async create(createEspaceDto: CreateEspaceDto, user: AuthUser, targetCompanyId?: string, reason?: string) {
    const { nom, categorie, statut, donneesSpecifiques } = createEspaceDto;

    // Determine target company: ROOT can target any company, standard is locked to their own
    const companyId = user.isRoot ? targetCompanyId : user.companyId;
    if (!companyId) {
      throw new BadRequestException("Une entreprise cible ('companyId') est requise pour créer un espace.");
    }

    const espace = await this.prisma.espace.create({
      data: {
        nom,
        categorie,
        statut: statut || 'FERME',
        donneesSpecifiques: donneesSpecifiques || {},
        companyId,
      },
    });

    // Write audit log (will enforce 'reason' for ROOT)
    await this.auditLogService.log(
      user.id,
      companyId,
      'espace.create',
      'Espace',
      espace.id,
      { nom, category: categorie, reason },
    );

    return {
      success: true,
      data: espace,
    };
  }

  async findAll(user: AuthUser, targetCompanyId?: string) {
    const where = this.buildCompanyFilter(user, targetCompanyId);
    return this.prisma.espace.findMany({
      where,
      include: {
        employes: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string, user: AuthUser) {
    // Look up workspace within authorization scope
    const where: any = { id };
    if (!user.isRoot) {
      where.companyId = user.companyId;
    }

    const espace = await this.prisma.espace.findFirst({
      where,
      include: {
        employes: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
      },
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    return espace;
  }

  async update(id: string, updateEspaceDto: UpdateEspaceDto, user: AuthUser, reason?: string) {
    const where: any = { id };
    if (!user.isRoot) {
      where.companyId = user.companyId;
    }

    const espace = await this.prisma.espace.findFirst({
      where,
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    // Standard user auth rules
    if (!user.isRoot && user.role !== 'SUPERADMIN') {
      const userProfile = await this.prisma.user.findFirst({
        where: { id: user.id, companyId: user.companyId },
      });

      if (!userProfile || userProfile.assignedSpaceId !== id) {
        throw new ForbiddenException(
          "Accès refusé. Vous n'êtes pas assigné à la gestion de cet espace.",
        );
      }
    }

    const { nom, categorie, statut, donneesSpecifiques } = updateEspaceDto;
    const updateData: any = {};

    if (nom) updateData.nom = nom;
    if (categorie) updateData.categorie = categorie;
    if (statut) updateData.statut = statut;
    if (donneesSpecifiques) updateData.donneesSpecifiques = donneesSpecifiques;

    const updatedEspace = await this.prisma.espace.update({
      where: { id },
      data: updateData,
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      espace.companyId,
      'espace.update',
      'Espace',
      id,
      { before: espace, after: updatedEspace, reason },
    );

    return {
      success: true,
      data: updatedEspace,
    };
  }

  async remove(id: string, user: AuthUser, reason?: string) {
    const where: any = { id };
    if (!user.isRoot) {
      where.companyId = user.companyId;
    }

    const espace = await this.prisma.espace.findFirst({
      where,
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    const targetCompanyId = espace.companyId;

    // Set assignedSpaceId to null for all users assigned to this space before deleting it
    await this.prisma.user.updateMany({
      where: { assignedSpaceId: id, companyId: targetCompanyId },
      data: { assignedSpaceId: null },
    });

    await this.prisma.espace.delete({
      where: { id },
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      targetCompanyId,
      'espace.delete',
      'Espace',
      id,
      { deletedEspace: espace, reason },
    );

    return {
      success: true,
      message: 'Espace supprimé avec succès',
    };
  }

  // ───────────────────────── Scene management ─────────────────────────

  private async checkSpaceAuthorization(id: string, user: AuthUser) {
    const where: any = { id };
    if (!user.isRoot) {
      where.companyId = user.companyId;
    }

    const espace = await this.prisma.espace.findFirst({
      where,
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    if (!user.isRoot && user.role !== 'SUPERADMIN') {
      const userProfile = await this.prisma.user.findFirst({
        where: { id: user.id, companyId: user.companyId },
      });

      if (!userProfile || userProfile.assignedSpaceId !== id) {
        throw new ForbiddenException(
          "Accès refusé. Vous n'êtes pas assigné à la gestion de cet espace.",
        );
      }
    }
    return espace;
  }

  async getScene(id: string, user: AuthUser) {
    const espace = await this.checkSpaceAuthorization(id, user);
    const placements = await this.prisma.scenePlacement.findMany({
      where: { espaceId: id },
      include: { object3D: true },
    });
    return {
      success: true,
      data: {
        id: espace.id,
        nom: espace.nom,
        baseSceneUrl: espace.baseSceneUrl || '/uploads/models/default_scene.glb',
        placements,
        originalSceneData: espace.originalSceneData,
      },
    };
  }

  async updateScene(id: string, placements: any[], user: AuthUser, reason?: string) {
    const espace = await this.checkSpaceAuthorization(id, user);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.scenePlacement.deleteMany({
        where: { espaceId: id },
      });

      const createdPlacements = [];
      for (const p of placements) {
        const created = await tx.scenePlacement.create({
          data: {
            espaceId: id,
            object3DId: p.object3DId || p.object3dId,
            positionX: parseFloat(p.positionX !== undefined ? p.positionX : (p.position?.[0] ?? 0)),
            positionY: parseFloat(p.positionY !== undefined ? p.positionY : (p.position?.[1] ?? 0)),
            positionZ: parseFloat(p.positionZ !== undefined ? p.positionZ : (p.position?.[2] ?? 0)),
            rotationX: parseFloat(p.rotationX !== undefined ? p.rotationX : (p.rotation?.[0] ?? 0)),
            rotationY: parseFloat(p.rotationY !== undefined ? p.rotationY : (p.rotation?.[1] ?? 0)),
            rotationZ: parseFloat(p.rotationZ !== undefined ? p.rotationZ : (p.rotation?.[2] ?? 0)),
            scaleX: parseFloat(p.scaleX !== undefined ? p.scaleX : (p.scale?.[0] ?? 1)),
            scaleY: parseFloat(p.scaleY !== undefined ? p.scaleY : (p.scale?.[1] ?? 1)),
            scaleZ: parseFloat(p.scaleZ !== undefined ? p.scaleZ : (p.scale?.[2] ?? 1)),
          },
          include: { object3D: true },
        });
        createdPlacements.push(created);
      }
      return createdPlacements;
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      espace.companyId,
      'scene.update',
      'Espace',
      id,
      { placementsCount: result.length, reason },
    );

    return {
      success: true,
      data: {
        placements: result,
      },
    };
  }

  async resetScene(id: string, user: AuthUser, reason?: string) {
    const espace = await this.checkSpaceAuthorization(id, user);
    const originalPlacements = (espace.originalSceneData as any[]) || [];

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.scenePlacement.deleteMany({
        where: { espaceId: id },
      });

      const recreatedPlacements = [];
      for (const p of originalPlacements) {
        const created = await tx.scenePlacement.create({
          data: {
            espaceId: id,
            object3DId: p.object3DId || p.object3dId,
            positionX: parseFloat(p.positionX !== undefined ? p.positionX : (p.position?.[0] ?? 0)),
            positionY: parseFloat(p.positionY !== undefined ? p.positionY : (p.position?.[1] ?? 0)),
            positionZ: parseFloat(p.positionZ !== undefined ? p.positionZ : (p.position?.[2] ?? 0)),
            rotationX: parseFloat(p.rotationX !== undefined ? p.rotationX : (p.rotation?.[0] ?? 0)),
            rotationY: parseFloat(p.rotationY !== undefined ? p.rotationY : (p.rotation?.[1] ?? 0)),
            rotationZ: parseFloat(p.rotationZ !== undefined ? p.rotationZ : (p.rotation?.[2] ?? 0)),
            scaleX: parseFloat(p.scaleX !== undefined ? p.scaleX : (p.scale?.[0] ?? 1)),
            scaleY: parseFloat(p.scaleY !== undefined ? p.scaleY : (p.scale?.[1] ?? 1)),
            scaleZ: parseFloat(p.scaleZ !== undefined ? p.scaleZ : (p.scale?.[2] ?? 1)),
          },
          include: { object3D: true },
        });
        recreatedPlacements.push(created);
      }
      return recreatedPlacements;
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      espace.companyId,
      'scene.reset',
      'Espace',
      id,
      { reason },
    );

    return {
      success: true,
      data: {
        placements: result,
      },
    };
  }

  async setAsOriginal(id: string, user: AuthUser, reason?: string) {
    const espace = await this.checkSpaceAuthorization(id, user);

    const currentPlacements = await this.prisma.scenePlacement.findMany({
      where: { espaceId: id },
    });

    const snapshot = currentPlacements.map((p) => ({
      object3DId: p.object3DId,
      positionX: p.positionX,
      positionY: p.positionY,
      positionZ: p.positionZ,
      rotationX: p.rotationX,
      rotationY: p.rotationY,
      rotationZ: p.rotationZ,
      scaleX: p.scaleX,
      scaleY: p.scaleY,
      scaleZ: p.scaleZ,
    }));

    const updated = await this.prisma.espace.update({
      where: { id },
      data: {
        originalSceneData: snapshot,
      },
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      espace.companyId,
      'scene.set-as-original',
      'Espace',
      id,
      { reason },
    );

    return {
      success: true,
      data: updated,
    };
  }
}
