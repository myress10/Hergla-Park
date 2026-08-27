import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage.service';
import { CreateObject3dDto } from './dto/create-object3d.dto';
import { AuditLogService } from '../common/audit-log.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type AuthUser = { id: string; role: string; companyId: string | null; isRoot?: boolean };

@Injectable()
export class Objects3dService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private auditLogService: AuditLogService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Find all 3D objects.
   * Standard users are locked to their own companyId.
   * ROOT users can target a specific companyId or view globally.
   */
  async findAll(user: AuthUser, targetCompanyId?: string) {
    const where: any = {};
    if (!user.isRoot) {
      where.companyId = user.companyId;
    } else if (targetCompanyId) {
      where.companyId = targetCompanyId;
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

  async createBase(dto: CreateObject3dDto, user: AuthUser, targetCompanyId?: string, reason?: string) {
    const companyId = user.isRoot ? targetCompanyId : user.companyId;
    if (!companyId) {
      throw new BadRequestException("Une entreprise cible ('companyId') est requise.");
    }

    const object3d = await this.prisma.object3D.create({
      data: {
        nom: dto.nom,
        categorie: dto.categorie,
        modelUrl: dto.modelUrl,
        thumbnailUrl: dto.thumbnailUrl || null,
        isCustom: false,
        companyId,
      },
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      companyId,
      'object3d.create',
      'Object3D',
      object3d.id,
      { nom: dto.nom, modelUrl: dto.modelUrl, reason },
    );

    return {
      success: true,
      data: object3d,
    };
  }

  async uploadCustom(
    nom: string,
    categorie: string,
    glbFile: any,
    thumbFile: any,
    user: AuthUser,
    targetCompanyId?: string,
    reason?: string,
  ) {
    if (!nom || !categorie) {
      throw new BadRequestException('Nom et catégorie sont requis.');
    }
    if (!glbFile) {
      throw new BadRequestException('Fichier de modèle (.glb) manquant.');
    }

    const companyId = user.isRoot ? targetCompanyId : user.companyId;
    if (!companyId) {
      throw new BadRequestException("Une entreprise cible ('companyId') est requise.");
    }

    // Verify subscription pack quota for custom 3D model uploads
    await this.subscriptionsService.assertCanUploadCustomObject(companyId);

    // Save GLB model using StorageService
    const modelUrl = await this.storageService.saveFile(
      glbFile,
      'models',
      ['.glb'],
      10 * 1024 * 1024, // 10 MB limit
    );

    // Save thumbnail if provided
    let thumbnailUrl = null;
    if (thumbFile) {
      thumbnailUrl = await this.storageService.saveFile(
        thumbFile,
        'thumbnails',
        ['.png', '.jpg', '.jpeg', '.webp'],
        2 * 1024 * 1024, // 2 MB limit
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
        companyId,
      },
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      companyId,
      'object3d.upload',
      'Object3D',
      object3d.id,
      { nom, modelUrl, reason },
    );

    return {
      success: true,
      data: object3d,
    };
  }

  async remove(id: string, user: AuthUser, reason?: string) {
    const where: any = { id };
    if (!user.isRoot) {
      where.companyId = user.companyId;
    }

    const object3d = await this.prisma.object3D.findFirst({
      where,
    });

    if (!object3d) {
      throw new NotFoundException(`Objet 3D avec l'ID ${id} introuvable`);
    }

    const targetCompanyId = object3d.companyId;

    // Authorization: SUPERADMIN/ROOT can delete anything. Owners can delete their custom objects.
    if (!user.isRoot && user.role !== 'SUPERADMIN' && object3d.uploadedById !== user.id) {
      throw new ForbiddenException('Non autorisé à supprimer cet objet du catalogue.');
    }

    await this.prisma.object3D.delete({
      where: { id },
    });

    // Write audit log
    await this.auditLogService.log(
      user.id,
      targetCompanyId,
      'object3d.delete',
      'Object3D',
      id,
      { deletedObject: object3d, reason },
    );

    return {
      success: true,
      message: 'Objet 3D supprimé du catalogue avec succès',
    };
  }
}
