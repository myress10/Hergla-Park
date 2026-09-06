import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLapTimeDto } from './dto/create-laptime.dto';

@Injectable()
export class LapTimesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyCompanyAndSpace(slug: string, espaceId: string) {
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

    return { company, space };
  }

  async recordLapTime(slug: string, espaceId: string, dto: CreateLapTimeDto) {
    await this.verifyCompanyAndSpace(slug, espaceId);

    // Sanitize pseudo: strip any dangerous tags/characters
    const cleanPseudo = dto.pseudo.replace(/[<>'"/\\;]/g, '').trim();
    if (cleanPseudo.length < 2) {
      throw new BadRequestException('Pseudo invalide après nettoyage.');
    }

    // Verify kartId if provided
    let kartId: string | null = null;
    if (dto.kartId) {
      const kart = await this.prisma.kart.findFirst({
        where: { id: dto.kartId, espaceId },
      });
      if (kart) {
        kartId = kart.id;
      }
    }

    const lapTime = await this.prisma.lapTime.create({
      data: {
        espaceId,
        kartId,
        pseudo: cleanPseudo,
        tempsMs: dto.tempsMs,
      },
      include: {
        kart: {
          select: {
            numeroPlaque: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Temps au tour enregistré avec succès',
      data: {
        id: lapTime.id,
        pseudo: lapTime.pseudo,
        tempsMs: lapTime.tempsMs,
        numeroKart: lapTime.kart?.numeroPlaque || null,
        createdAt: lapTime.createdAt,
      },
    };
  }

  async getLeaderboard(slug: string, espaceId: string, limitQuery?: number) {
    await this.verifyCompanyAndSpace(slug, espaceId);

    const limit = Math.min(Math.max(Number(limitQuery) || 10, 1), 50);

    const records = await this.prisma.lapTime.findMany({
      where: { espaceId },
      orderBy: { tempsMs: 'asc' },
      take: limit,
      include: {
        kart: {
          select: {
            numeroPlaque: true,
          },
        },
      },
    });

    return records.map((r) => ({
      pseudo: r.pseudo,
      tempsMs: r.tempsMs,
      numeroKart: r.kart?.numeroPlaque || null,
      date: r.createdAt,
    }));
  }
}
