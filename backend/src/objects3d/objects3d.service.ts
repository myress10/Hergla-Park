import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { CreateObject3dDto } from './dto/create-object3d.dto';

@Injectable()
export class Objects3dService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async findAll(categorie?: string) {
    const where: any = {};
    if (categorie) {
      where.categorie = {
        equals: categorie,
        mode: 'insensitive',
      };
    }
    const items = await this.prisma.object3D.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: items,
    };
  }

  async createBase(dto: CreateObject3dDto) {
    const object3d = await this.prisma.object3D.create({
      data: {
        nom: dto.nom,
        categorie: dto.categorie,
        modelUrl: dto.modelUrl,
        thumbnailUrl: dto.thumbnailUrl || null,
        isCustom: false,
      },
    });

    return {
      success: true,
      data: object3d,
    };
  }

  async uploadCustom(nom: string, categorie: string, glbFile: any, thumbFile: any, user: { id: string; role: string }) {
    if (!nom || !categorie) {
      throw new BadRequestException('Nom et catégorie sont requis.');
    }
    if (!glbFile) {
      throw new BadRequestException('Fichier de modèle (.glb) manquant.');
    }

    // Save GLB model using StorageService
    const modelUrl = await this.storageService.saveFile(
      glbFile,
      'models',
      ['.glb'],
      10 * 1024 * 1024 // 10 MB limit
    );

    // Save thumbnail if provided
    let thumbnailUrl = null;
    if (thumbFile) {
      thumbnailUrl = await this.storageService.saveFile(
        thumbFile,
        'thumbnails',
        ['.png', '.jpg', '.jpeg', '.webp'],
        2 * 1024 * 1024 // 2 MB limit
      );
    }

    const object3d = await this.prisma.object3D.create({
      data: {
        nom,
        categorie,
        modelUrl,
        thumbnailUrl,
        isCustom: true,
        uploadedById: user.id,
      },
    });

    return {
      success: true,
      data: object3d,
    };
  }

  async remove(id: string, user: { id: string; role: string }) {
    const object3d = await this.prisma.object3D.findUnique({
      where: { id },
    });

    if (!object3d) {
      throw new NotFoundException(`Objet 3D avec l'ID ${id} introuvable`);
    }

    // Authorization: SUPERADMIN can delete anything. Owners can delete their custom objects.
    if (user.role !== 'SUPERADMIN' && object3d.uploadedById !== user.id) {
      throw new ForbiddenException('Non autorisé à supprimer cet objet du catalogue.');
    }

    await this.prisma.object3D.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Objet 3D supprimé du catalogue avec succès',
    };
  }
}
