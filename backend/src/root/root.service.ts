import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class RootService {
  constructor(
    private prisma: PrismaService,
    private rolesService: RolesService,
  ) {}

  /**
   * List all roles in the database, including the associated company name
   * for custom company-specific roles.
   */
  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        company: {
          select: {
            nom: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Delete a custom role across any company.
   */
  async removeRole(id: string, actorId: string, reason?: string) {
    return this.rolesService.remove(id, null, actorId, true, reason);
  }

  /**
   * Fetch system-wide activity logs, paginated and filtered.
   */
  async findLogs(query: {
    companyId?: string;
    actorId?: string;
    action?: string;
    isRootIntervention?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;

    if (query.isRootIntervention !== undefined) {
      where.isRootIntervention = query.isRootIntervention === 'true';
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
