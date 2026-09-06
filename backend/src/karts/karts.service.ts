import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKartDto } from './dto/create-kart.dto';
import { UpdateKartDto } from './dto/update-kart.dto';
import { ReorderKartItemDto } from './dto/reorder-karts.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type AuthUser = {
  id: string;
  role: string;
  roles?: string[];
  companyId: string | null;
  isRoot?: boolean;
};

@Injectable()
export class KartsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Private helper to verify tenant isolation and assignedSpaceId permission.
   */
  private async verifySpaceAccess(espaceId: string, user: AuthUser) {
    const space = await this.prisma.espace.findUnique({
      where: { id: espaceId },
    });

    if (!space) {
      throw new NotFoundException(`Espace avec l'ID ${espaceId} introuvable.`);
    }

    if (!user.isRoot && space.companyId !== user.companyId) {
      throw new NotFoundException(`Espace avec l'ID ${espaceId} introuvable.`);
    }

    // Verify pack entitlement for karts module (only for non-root users or root scoped)
    if (!user.isRoot) {
      await this.subscriptionsService.assertCanAccessModule(space.companyId, 'karts');
    }

    // Checking roles
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const isSuperAdmin = user.isRoot || userRoles.includes('SUPERADMIN') || user.role === 'SUPERADMIN';

    if (!isSuperAdmin) {
      const userProfile = await this.prisma.user.findFirst({
        where: { id: user.id, companyId: user.companyId },
      });

      if (!userProfile || userProfile.assignedSpaceId !== espaceId) {
        throw new ForbiddenException(
          "Accès refusé. Vous n'êtes pas assigné à la gestion de cet espace.",
        );
      }
    }

    return space;
  }

  async findAll(espaceId: string, user: AuthUser) {
    await this.verifySpaceAccess(espaceId, user);

    return this.prisma.kart.findMany({
      where: { espaceId },
      orderBy: [{ ordre: 'asc' }, { numeroPlaque: 'asc' }],
    });
  }

  async create(espaceId: string, createKartDto: CreateKartDto, user: AuthUser) {
    await this.verifySpaceAccess(espaceId, user);

    const { numeroPlaque, couleurs, modeleBaseUrl, actif, ordre } = createKartDto;

    const existing = await this.prisma.kart.findUnique({
      where: {
        espaceId_numeroPlaque: {
          espaceId,
          numeroPlaque,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Un kart avec le numéro de plaque "${numeroPlaque}" existe déjà dans cet espace.`,
      );
    }

    const kart = await this.prisma.kart.create({
      data: {
        espaceId,
        numeroPlaque,
        couleurs,
        modeleBaseUrl: modeleBaseUrl || null,
        actif: actif !== undefined ? actif : true,
        ordre: ordre !== undefined ? ordre : 0,
      },
    });

    return { success: true, data: kart };
  }

  async update(espaceId: string, kartId: string, updateKartDto: UpdateKartDto, user: AuthUser) {
    await this.verifySpaceAccess(espaceId, user);

    const kart = await this.prisma.kart.findFirst({
      where: { id: kartId, espaceId },
    });

    if (!kart) {
      throw new NotFoundException(`Kart avec l'ID ${kartId} introuvable dans cet espace.`);
    }

    if (updateKartDto.numeroPlaque && updateKartDto.numeroPlaque !== kart.numeroPlaque) {
      const existing = await this.prisma.kart.findUnique({
        where: {
          espaceId_numeroPlaque: {
            espaceId,
            numeroPlaque: updateKartDto.numeroPlaque,
          },
        },
      });

      if (existing && existing.id !== kartId) {
        throw new BadRequestException(
          `Un kart avec le numéro de plaque "${updateKartDto.numeroPlaque}" existe déjà dans cet espace.`,
        );
      }
    }

    const updatedKart = await this.prisma.kart.update({
      where: { id: kartId },
      data: {
        ...(updateKartDto.numeroPlaque !== undefined && { numeroPlaque: updateKartDto.numeroPlaque }),
        ...(updateKartDto.couleurs !== undefined && { couleurs: updateKartDto.couleurs }),
        ...(updateKartDto.modeleBaseUrl !== undefined && { modeleBaseUrl: updateKartDto.modeleBaseUrl }),
        ...(updateKartDto.actif !== undefined && { actif: updateKartDto.actif }),
        ...(updateKartDto.ordre !== undefined && { ordre: updateKartDto.ordre }),
      },
    });

    return { success: true, data: updatedKart };
  }

  async remove(espaceId: string, kartId: string, user: AuthUser) {
    await this.verifySpaceAccess(espaceId, user);

    const kart = await this.prisma.kart.findFirst({
      where: { id: kartId, espaceId },
    });

    if (!kart) {
      throw new NotFoundException(`Kart avec l'ID ${kartId} introuvable dans cet espace.`);
    }

    await this.prisma.kart.delete({
      where: { id: kartId },
    });

    return { success: true, message: 'Kart supprimé avec succès.' };
  }

  async reorder(espaceId: string, items: ReorderKartItemDto[], user: AuthUser) {
    await this.verifySpaceAccess(espaceId, user);

    if (!items || items.length === 0) {
      throw new BadRequestException('Aucun élément fourni pour le réordonnancement.');
    }

    // Verify all karts belong to this space
    const kartIds = items.map((item) => item.id);
    const count = await this.prisma.kart.count({
      where: {
        id: { in: kartIds },
        espaceId,
      },
    });

    if (count !== kartIds.length) {
      throw new BadRequestException(
        'Certains karts spécifiés n’existent pas ou n’appartiennent pas à cet espace.',
      );
    }

    // Perform updates in a transaction
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.kart.update({
          where: { id: item.id },
          data: { ordre: item.ordre },
        }),
      ),
    );

    const karts = await this.prisma.kart.findMany({
      where: { espaceId },
      orderBy: [{ ordre: 'asc' }, { numeroPlaque: 'asc' }],
    });

    return { success: true, message: 'Ordre des karts mis à jour avec succès.', data: karts };
  }

  async findPublicKarts(slug: string, espaceId: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug, actif: true },
    });

    if (!company) {
      throw new NotFoundException(`Entreprise avec le slug "${slug}" introuvable ou inactive.`);
    }

    const space = await this.prisma.espace.findFirst({
      where: { id: espaceId, companyId: company.id },
    });

    if (!space) {
      throw new NotFoundException(
        `Espace avec l'ID ${espaceId} introuvable pour l'entreprise "${slug}".`,
      );
    }

    return this.prisma.kart.findMany({
      where: {
        espaceId,
        actif: true,
      },
      orderBy: {
        ordre: 'asc',
      },
      select: {
        numeroPlaque: true,
        couleurs: true,
        modeleBaseUrl: true,
      },
    });
  }
}
