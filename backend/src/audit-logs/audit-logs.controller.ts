import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/audit-logs')
export class AuditLogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve system/company activity audit logs with RBAC filtering and stealth ROOT mode' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(
    @Req() req: any,
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = Number(page || 1);
    const limitNum = Number(limit || 20);
    const skip = (pageNum - 1) * limitNum;

    const currentUser = req.user;
    const userRecord = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRoles = userRecord?.roles?.map((ur) => ur.role) || [];
    const isRoot = userRoles.some((r) => r.nom === 'ROOT');
    const isSuperAdmin = userRoles.some((r) => r.nom === 'SUPERADMIN');
    const isAdmin = userRoles.some((r) => r.nom === 'ADMIN');
    const isEmploye = !isRoot && !isSuperAdmin && !isAdmin;

    const where: any = {};

    // 1. Role-Based Scope & Stealth Mode
    if (isRoot) {
      // ROOT sees everything across all companies and spaces (Stealth View)
      if (companyId) {
        where.companyId = companyId;
      }
    } else {
      // Non-ROOT users NEVER see actions performed by ROOT (Stealth Mode)
      where.isRootIntervention = false;

      const activeCompanyId = companyId || currentUser.companyId || userRecord?.companyId;
      if (activeCompanyId) {
        where.companyId = activeCompanyId;
      }

      if (isEmploye) {
        // Standard Employees can only see their own logs or logs from staff in their assigned space
        if (userRecord?.assignedSpaceId) {
          const spaceStaff = await this.prisma.user.findMany({
            where: {
              assignedSpaceId: userRecord.assignedSpaceId,
              companyId: activeCompanyId || undefined,
            },
            select: { id: true },
          });
          const allowedIds = spaceStaff.map((s) => s.id);
          if (!allowedIds.includes(currentUser.id)) {
            allowedIds.push(currentUser.id);
          }
          where.actorId = { in: allowedIds };
        } else {
          where.actorId = currentUser.id;
        }
      }
    }

    // 2. Action Filter
    if (action && action !== 'ALL') {
      where.action = { contains: action, mode: 'insensitive' };
    }

    // 3. Search Query
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { entityType: { contains: q, mode: 'insensitive' } },
          { actor: { nom: { contains: q, mode: 'insensitive' } } },
          { actor: { email: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    // 4. Date Range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              nom: true,
              slug: true,
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
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

