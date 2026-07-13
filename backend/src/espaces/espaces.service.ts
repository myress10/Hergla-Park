import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEspaceDto } from './dto/create-espace.dto';
import { UpdateEspaceDto } from './dto/update-espace.dto';

@Injectable()
export class EspacesService {
  constructor(private prisma: PrismaService) {}

  async create(createEspaceDto: CreateEspaceDto) {
    const { nom, categorie, statut, donneesSpecifiques } = createEspaceDto;

    const espace = await this.prisma.espace.create({
      data: {
        nom,
        categorie,
        statut: statut || 'FERME',
        donneesSpecifiques: donneesSpecifiques || {},
      },
    });

    return {
      success: true,
      data: espace,
    };
  }

  async findAll() {
    return this.prisma.espace.findMany({
      include: {
        employes: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const espace = await this.prisma.espace.findUnique({
      where: { id },
      include: {
        employes: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    return espace;
  }

  async update(id: string, updateEspaceDto: UpdateEspaceDto, user: { id: string; role: string }) {
    const espace = await this.prisma.espace.findUnique({
      where: { id },
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    // Authorization checks
    if (user.role !== 'SUPERADMIN') {
      // Must retrieve requestor user from DB to verify assignedSpaceId
      const userProfile = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userProfile || userProfile.assignedSpaceId !== id) {
        throw new ForbiddenException(
          'Accès refusé. Vous n\'êtes pas assigné à la gestion de cet espace.'
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

    return {
      success: true,
      data: updatedEspace,
    };
  }

  async remove(id: string) {
    const espace = await this.prisma.espace.findUnique({
      where: { id },
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    // Set assignedSpaceId to null for all users assigned to this space before deleting it
    await this.prisma.user.updateMany({
      where: { assignedSpaceId: id },
      data: { assignedSpaceId: null },
    });

    await this.prisma.espace.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Espace supprimé avec succès',
    };
  }

  private async checkSpaceAuthorization(id: string, user: { id: string; role: string }) {
    const espace = await this.prisma.espace.findUnique({
      where: { id },
    });

    if (!espace) {
      throw new NotFoundException(`Espace avec l'ID ${id} introuvable`);
    }

    if (user.role !== 'SUPERADMIN') {
      const userProfile = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userProfile || userProfile.assignedSpaceId !== id) {
        throw new ForbiddenException(
          'Accès refusé. Vous n\'êtes pas assigné à la gestion de cet espace.'
        );
      }
    }
    return espace;
  }

  async getScene(id: string, user: { id: string; role: string }) {
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

  async updateScene(id: string, placements: any[], user: { id: string; role: string }) {
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

    return {
      success: true,
      data: {
        placements: result,
      },
    };
  }

  async resetScene(id: string, user: { id: string; role: string }) {
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

    return {
      success: true,
      data: {
        placements: result,
      },
    };
  }

  async setAsOriginal(id: string, user: { id: string; role: string }) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Seul un SUPERADMIN peut définir la disposition comme originale.');
    }
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

    return {
      success: true,
      data: updated,
    };
  }
}
