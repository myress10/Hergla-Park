import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscriptionPack,
  UpgradeRequestStatus,
  SUBSCRIPTION_PACKS_CONFIG,
} from './subscriptions.constants';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns current subscription details, active quotas, usage statistics,
   * any pending upgrade request, and all available pack definitions.
   */
  async getCompanyPlan(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Entreprise introuvable (${companyId}).`);
    }

    const currentPack = (company.pack as SubscriptionPack) || SubscriptionPack.STANDARD;
    const packConfig = SUBSCRIPTION_PACKS_CONFIG[currentPack] || SUBSCRIPTION_PACKS_CONFIG[SubscriptionPack.STANDARD];

    // Calculate usage metrics
    const [espacesCount, usersCount, customObjectsCount] = await Promise.all([
      this.prisma.espace.count({
        where: { companyId },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { companyId },
            { userCompanies: { some: { companyId } } },
          ],
        },
      }),
      this.prisma.object3D.count({
        where: {
          companyId,
          isCustom: true,
        },
      }),
    ]);

    // Check for pending upgrade request
    const pendingRequest = await this.prisma.upgradeRequest.findFirst({
      where: {
        companyId,
        status: UpgradeRequestStatus.EN_ATTENTE,
      },
      include: {
        requestedBy: {
          select: { id: true, nom: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate usage percentages
    const calcPercent = (current: number, max: number | null) => {
      if (max === null) return null;
      if (max === 0) return 100;
      return Math.min(100, Math.round((current / max) * 100));
    };

    return {
      company: {
        id: company.id,
        nom: company.nom,
        slug: company.slug,
        pack: currentPack,
      },
      currentPackConfig: packConfig,
      usage: {
        espaces: {
          current: espacesCount,
          max: packConfig.maxEspaces,
          percent: calcPercent(espacesCount, packConfig.maxEspaces),
          isUnlimited: packConfig.maxEspaces === null,
          isExceeded: packConfig.maxEspaces !== null && espacesCount >= packConfig.maxEspaces,
        },
        users: {
          current: usersCount,
          max: packConfig.maxUsers,
          percent: calcPercent(usersCount, packConfig.maxUsers),
          isUnlimited: packConfig.maxUsers === null,
          isExceeded: packConfig.maxUsers !== null && usersCount >= packConfig.maxUsers,
        },
        customObjects: {
          current: customObjectsCount,
          max: packConfig.maxCustomObjects,
          percent: calcPercent(customObjectsCount, packConfig.maxCustomObjects),
          isUnlimited: packConfig.maxCustomObjects === null,
          isAllowed: (packConfig.maxCustomObjects ?? 0) > 0 || packConfig.maxCustomObjects === null,
          isExceeded: packConfig.maxCustomObjects !== null && customObjectsCount >= packConfig.maxCustomObjects,
        },
      },
      pendingUpgradeRequest: pendingRequest,
      allPacks: SUBSCRIPTION_PACKS_CONFIG,
    };
  }

  /**
   * Root: list all companies with their current subscription packs, superadmins, and quotas usage
   */
  async getAllCompaniesWithPacks() {
    const companies = await this.prisma.company.findMany({
      include: {
        users: {
          where: {
            roles: {
              some: {
                role: {
                  nom: 'SUPERADMIN',
                },
              },
            },
          },
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
          },
        },
        _count: {
          select: {
            espaces: true,
            users: true,
            objects3D: { where: { isCustom: true } },
            upgradeRequests: { where: { status: UpgradeRequestStatus.EN_ATTENTE } },
          },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return companies.map((c) => {
      const pack = (c.pack as SubscriptionPack) || SubscriptionPack.STANDARD;
      const packConfig = SUBSCRIPTION_PACKS_CONFIG[pack] || SUBSCRIPTION_PACKS_CONFIG[SubscriptionPack.STANDARD];

      return {
        id: c.id,
        nom: c.nom,
        slug: c.slug,
        pack,
        packConfig,
        superadmins: c.users,
        counts: {
          espaces: c._count.espaces,
          users: c._count.users,
          customObjects: c._count.objects3D,
          pendingUpgrades: c._count.upgradeRequests,
        },
        createdAt: c.createdAt,
      };
    });
  }

  /**
   * Quota assertion: verify if the company can create a new Espace
   */
  async assertCanCreateEspace(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { pack: true },
    });

    if (!company) return;

    const pack = (company.pack as SubscriptionPack) || SubscriptionPack.STANDARD;
    const config = SUBSCRIPTION_PACKS_CONFIG[pack];

    if (config.maxEspaces !== null) {
      const count = await this.prisma.espace.count({ where: { companyId } });
      if (count >= config.maxEspaces) {
        throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED_ESPACES',
          message: `Limite d'espaces atteinte (${count}/${config.maxEspaces}) pour le pack ${config.nom}. Veuillez passer au pack supérieur pour créer d'autres espaces.`,
          currentPack: pack,
          maxAllowed: config.maxEspaces,
        });
      }
    }
  }

  /**
   * Quota assertion: verify if the company can create/register a new User
   */
  async assertCanCreateUser(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { pack: true },
    });

    if (!company) return;

    const pack = (company.pack as SubscriptionPack) || SubscriptionPack.STANDARD;
    const config = SUBSCRIPTION_PACKS_CONFIG[pack];

    if (config.maxUsers !== null) {
      const count = await this.prisma.user.count({
        where: {
          OR: [
            { companyId },
            { userCompanies: { some: { companyId } } },
          ],
        },
      });
      if (count >= config.maxUsers) {
        throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED_USERS',
          message: `Limite de collaborateurs atteinte (${count}/${config.maxUsers}) pour le pack ${config.nom}. Veuillez passer au pack supérieur pour ajouter d'autres membres.`,
          currentPack: pack,
          maxAllowed: config.maxUsers,
        });
      }
    }
  }

  /**
   * Quota assertion: verify if the company can upload a custom 3D model (.glb)
   */
  async assertCanUploadCustomObject(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { pack: true },
    });

    if (!company) return;

    const pack = (company.pack as SubscriptionPack) || SubscriptionPack.STANDARD;
    const config = SUBSCRIPTION_PACKS_CONFIG[pack];

    if (config.maxCustomObjects === 0) {
      throw new ForbiddenException({
        code: 'CUSTOM_MODELS_NOT_ALLOWED',
        message: `L'upload de modèles 3D personnalisés (.glb) n'est pas disponible dans le pack ${config.nom}. Veuillez passer au pack Avancé ou Premium.`,
        currentPack: pack,
      });
    }

    if (config.maxCustomObjects !== null) {
      const count = await this.prisma.object3D.count({
        where: { companyId, isCustom: true },
      });
      if (count >= config.maxCustomObjects) {
        throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED_CUSTOM_MODELS',
          message: `Limite de modèles 3D personnalisés atteinte (${count}/${config.maxCustomObjects}) pour le pack ${config.nom}. Veuillez passer au pack Premium pour des uploads illimités.`,
          currentPack: pack,
          maxAllowed: config.maxCustomObjects,
        });
      }
    }
  }

  /**
   * Quota assertion: verify access to specialized module
   */
  async assertCanAccessModule(companyId: string, moduleName: 'karts' | 'audit_logs' | 'custom_roles') {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { pack: true },
    });

    if (!company) return;

    const pack = (company.pack as SubscriptionPack) || SubscriptionPack.STANDARD;
    const config = SUBSCRIPTION_PACKS_CONFIG[pack];

    if (moduleName === 'karts' && !config.allowKartsModule) {
      throw new ForbiddenException({
        code: 'MODULE_LOCKED_KARTS',
        message: `Le module Karts & Pistes nécessite le pack Avancé ou Premium. Contactez votre administrateur pour débloquer cette fonctionnalité.`,
        currentPack: pack,
      });
    }

    if (moduleName === 'audit_logs' && !config.allowAuditLogs) {
      throw new ForbiddenException({
        code: 'MODULE_LOCKED_AUDIT',
        message: `L'accès au journal d'audit nécessite le pack Avancé ou Premium.`,
        currentPack: pack,
      });
    }
  }

  /**
   * Submit an upgrade request by Superadmin
   */
  async createUpgradeRequest(
    companyId: string,
    userId: string,
    targetPack: SubscriptionPack,
    notes?: string,
    contactPhone?: string,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Entreprise introuvable.`);
    }

    const currentPack = (company.pack as SubscriptionPack) || SubscriptionPack.STANDARD;

    if (currentPack === targetPack) {
      throw new BadRequestException(`Votre entreprise possède déjà le pack ${targetPack}.`);
    }

    // Check if there is already an active pending request
    const existing = await this.prisma.upgradeRequest.findFirst({
      where: {
        companyId,
        status: UpgradeRequestStatus.EN_ATTENTE,
      },
    });

    if (existing) {
      // Update the existing pending request with new target / details
      const updated = await this.prisma.upgradeRequest.update({
        where: { id: existing.id },
        data: {
          targetPack,
          notes,
          contactPhone,
          requestedById: userId,
        },
        include: {
          company: true,
          requestedBy: { select: { id: true, nom: true, email: true } },
        },
      });

      await this.prisma.auditLog.create({
        data: {
          companyId,
          actorId: userId,
          action: 'upgrade_request.update',
          entityType: 'UpgradeRequest',
          entityId: updated.id,
          metadata: { currentPack, targetPack, notes, contactPhone },
        },
      });

      return updated;
    }

    const created = await this.prisma.upgradeRequest.create({
      data: {
        companyId,
        requestedById: userId,
        currentPack,
        targetPack,
        status: UpgradeRequestStatus.EN_ATTENTE,
        notes,
        contactPhone,
      },
      include: {
        company: true,
        requestedBy: { select: { id: true, nom: true, email: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: userId,
        action: 'upgrade_request.create',
        entityType: 'UpgradeRequest',
        entityId: created.id,
        metadata: { currentPack, targetPack, notes, contactPhone },
      },
    });

    return created;
  }

  /**
   * Root: list all upgrade requests
   */
  async getAllUpgradeRequests(status?: UpgradeRequestStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.upgradeRequest.findMany({
      where,
      include: {
        company: {
          select: { id: true, nom: true, slug: true, pack: true, logoUrl: true },
        },
        requestedBy: {
          select: { id: true, nom: true, email: true, telephone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Root: approve an upgrade request
   */
  async approveUpgradeRequest(requestId: string, rootUserId: string, adminResponse?: string) {
    const request = await this.prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: { company: true },
    });

    if (!request) {
      throw new NotFoundException(`Demande d'upgrade introuvable.`);
    }

    if (request.status === UpgradeRequestStatus.APPROUVE) {
      throw new BadRequestException(`Cette demande a déjà été approuvée.`);
    }

    const prevPack = request.company.pack;
    const newPack = request.targetPack;

    // Transaction to update request status and company pack
    const [updatedRequest, updatedCompany] = await this.prisma.$transaction([
      this.prisma.upgradeRequest.update({
        where: { id: requestId },
        data: {
          status: UpgradeRequestStatus.APPROUVE,
          processedById: rootUserId,
          processedAt: new Date(),
          adminResponse: adminResponse || `Upgrade approuvé vers le pack ${newPack}`,
        },
        include: {
          company: true,
          requestedBy: { select: { id: true, nom: true, email: true } },
        },
      }),
      this.prisma.company.update({
        where: { id: request.companyId },
        data: { pack: newPack },
      }),
    ]);

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        companyId: request.companyId,
        actorId: rootUserId,
        action: 'company.pack_upgraded',
        entityType: 'Company',
        entityId: request.companyId,
        isRootIntervention: true,
        metadata: {
          requestId,
          previousPack: prevPack,
          newPack: newPack,
          adminResponse,
        },
      },
    });

    return {
      request: updatedRequest,
      company: updatedCompany,
    };
  }

  /**
   * Root: reject an upgrade request
   */
  async rejectUpgradeRequest(requestId: string, rootUserId: string, adminResponse?: string) {
    const request = await this.prisma.upgradeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Demande d'upgrade introuvable.`);
    }

    const updated = await this.prisma.upgradeRequest.update({
      where: { id: requestId },
      data: {
        status: UpgradeRequestStatus.REFUSE,
        processedById: rootUserId,
        processedAt: new Date(),
        adminResponse: adminResponse || 'Demande refusée.',
      },
      include: {
        company: true,
        requestedBy: { select: { id: true, nom: true, email: true } },
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        companyId: request.companyId,
        actorId: rootUserId,
        action: 'company.upgrade_rejected',
        entityType: 'Company',
        entityId: request.companyId,
        isRootIntervention: true,
        metadata: {
          requestId,
          reason: adminResponse,
        },
      },
    });

    return updated;
  }

  /**
   * Root: manually set company pack
   */
  async setCompanyPackManually(
    companyId: string,
    newPack: SubscriptionPack,
    rootUserId: string,
    reason?: string,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Entreprise introuvable.`);
    }

    const prevPack = company.pack;

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { pack: newPack },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId: rootUserId,
        action: 'company.pack_override',
        entityType: 'Company',
        entityId: companyId,
        isRootIntervention: true,
        metadata: {
          previousPack: prevPack,
          newPack,
          reason,
        },
      },
    });

    return updated;
  }
}
