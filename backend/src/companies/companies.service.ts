import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieve public company info by slug (no auth required).
   * Only returns safe, non-sensitive fields.
   */
  async findBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        nom: true,
        slug: true,
        logoUrl: true,
        actif: true,
      },
    });

    if (!company || !company.actif) {
      throw new NotFoundException(`Entreprise introuvable : ${slug}`);
    }

    return company;
  }

  /**
   * Resolve a slug to its internal companyId.
   * Used by the public controller to scope espace queries.
   */
  async resolveCompanyId(slug: string): Promise<string> {
    const company = await this.findBySlug(slug);
    return company.id;
  }
}
