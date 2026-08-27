import { Controller, Get, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Helper to build clean, human-readable summaries for business users
 */
function buildHumanReadableSummary(action: string, entityType: string, metadata: any, actorName: string): string {
  const act = (action || '').toLowerCase();
  const meta = metadata || {};
  const targetName = meta.nom || meta.numero || meta.targetPack || entityType || 'élément';

  if (act.includes('espace.create') || act.includes('espace_created')) {
    return `${actorName} a créé l'espace "${meta.nom || 'Nouveau'}"`;
  }
  if (act.includes('espace.update') || act.includes('espace_updated')) {
    const statusNote = meta.statut ? ` (Statut : ${meta.statut})` : '';
    return `${actorName} a modifié l'espace "${meta.nom || targetName}"${statusNote}`;
  }
  if (act.includes('espace.delete') || act.includes('espace_deleted')) {
    return `${actorName} a supprimé un espace`;
  }
  if (act.includes('kart.create') || act.includes('kart_created')) {
    return `${actorName} a ajouté le kart #${meta.numero || targetName}`;
  }
  if (act.includes('kart.update') || act.includes('kart_updated')) {
    const statusNote = meta.actif !== undefined ? (meta.actif ? ' (Actif)' : ' (En Maintenance)') : '';
    return `${actorName} a mis à jour le kart #${meta.numero || targetName}${statusNote}`;
  }
  if (act.includes('kart.delete') || act.includes('kart_deleted')) {
    return `${actorName} a retiré le kart #${meta.numero || targetName}`;
  }
  if (act.includes('karts.reorder')) {
    return `${actorName} a réorganisé l'ordre de la flotte de karts`;
  }
  if (act.includes('scene.save') || act.includes('placement')) {
    return `${actorName} a mis à jour la disposition 3D des objets`;
  }
  if (act.includes('user.create')) {
    return `${actorName} a ajouté un nouveau collaborateur (${meta.nom || meta.email || 'Utilisateur'})`;
  }
  if (act.includes('user.update')) {
    return `${actorName} a mis à jour le profil de (${meta.nom || meta.email || 'Utilisateur'})`;
  }
  if (act.includes('user.delete')) {
    return `${actorName} a supprimé un compte utilisateur`;
  }
  if (act.includes('company.pack_upgraded') || act.includes('company.pack_override')) {
    return `Mise à niveau du pack entreprise vers "${meta.newPack || meta.targetPack || 'Nouveau Pack'}"`;
  }
  if (act.includes('company.upgrade_requested')) {
    return `${actorName} a soumis une demande de mise à niveau vers le pack "${meta.targetPack || 'Avancé'}"`;
  }
  if (act.includes('company.upgrade_approved')) {
    return `Demande d'upgrade validée : activation du pack "${meta.newPack || meta.targetPack || 'Pack Supérieur'}"`;
  }
  if (act.includes('company.upgrade_rejected')) {
    return `Demande d'upgrade refusée pour le moment`;
  }
  if (act.includes('role.create') || act.includes('role.update')) {
    return `${actorName} a mis à jour les droits et rôles d'équipe`;
  }

  // Fallback high-level summary
  return `${actorName} a effectué une opération sur ${entityType || 'le système'}`;
}

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/audit-logs')
export class AuditLogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve system/company activity audit logs with strict RBAC sanitization and telemetry segregation' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'subsystem', required: false, description: 'Filter by subsystem (ROOT only: karts, espaces, users, subscriptions, studio3d, system)' })
  @ApiQuery({ name: 'ip', required: false, description: 'Filter by IP address (ROOT only)' })
  @ApiQuery({ name: 'actorId', required: false, description: 'Filter by Actor ID' })
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
    @Query('subsystem') subsystem?: string,
    @Query('ip') ip?: string,
    @Query('actorId') actorId?: string,
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
    const isRoot = userRoles.some((r) => r.nom === 'ROOT' || (r.niveau ?? 0) >= 100);
    const userMaxNiveau = Math.max(...userRoles.map((r) => r.niveau ?? 20), 20);
    const isSuperAdmin = !isRoot && (userRoles.some((r) => r.nom === 'SUPERADMIN') || userMaxNiveau >= 90);
    const isAdmin = !isRoot && !isSuperAdmin && (userRoles.some((r) => r.nom === 'ADMIN') || userMaxNiveau >= 50);
    const isEmploye = !isRoot && !isSuperAdmin && !isAdmin;

    const where: any = {};

    // 1. Role-Based Scope & Strict Hierarchy Enforcement (System & Custom Roles)
    if (isRoot) {
      // ROOT sees everything across all companies & roles (Full Telemetry View)
      if (companyId) {
        where.companyId = companyId;
      }
      if (actorId) {
        where.actorId = actorId;
      }
    } else {
      const userCompanyId = currentUser.companyId || userRecord?.companyId;
      if (!userCompanyId) {
        throw new ForbiddenException("Aucune entreprise rattachée à cet utilisateur.");
      }

      // Strictly isolate to the user's authorized company
      where.companyId = userCompanyId;
      where.isRootIntervention = false;

      // Define disallowed higher-tier actor roles according to strict organizational hierarchy:
      // - SUPERADMIN (90): Blocks ROOT (100)
      // - ADMIN (50): Blocks ROOT (100) and SUPERADMIN (90)
      // - EMPLOYE / Custom Roles (<= 40): Blocks ROOT (100), SUPERADMIN (90), and ADMIN (50)
      const disallowedRoles: string[] = ['ROOT'];
      if (userMaxNiveau < 90) {
        disallowedRoles.push('SUPERADMIN');
      }
      if (userMaxNiveau < 50) {
        disallowedRoles.push('ADMIN');
      }

      where.AND = where.AND || [];
      where.AND.push({
        actor: {
          roles: {
            none: {
              role: {
                OR: [
                  { nom: { in: disallowedRoles } },
                  { niveau: { gt: userMaxNiveau } },
                ],
              },
            },
          },
        },
      });

      if (isEmploye) {
        // Standard Employees can only see their own logs or logs from staff in their assigned space
        if (userRecord?.assignedSpaceId) {
          const spaceStaff = await this.prisma.user.findMany({
            where: {
              assignedSpaceId: userRecord.assignedSpaceId,
              companyId: userCompanyId,
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

    // 5. Server-Side Data Stripping & Sanitization
    let sanitizedData: any[] = [];

    if (isRoot) {
      // ROOT receives FULL raw telemetry (IP, userAgent, method, route, transactionId, before/after diffs, stackTrace)
      sanitizedData = items.map((log) => {
        const meta = (log.metadata as any) || {};
        return {
          id: log.id,
          createdAt: log.createdAt,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          companyId: log.companyId,
          company: log.company,
          actor: log.actor,
          isRootIntervention: log.isRootIntervention,
          subsystem: meta.subsystem || 'system',
          ip: meta.ip || '127.0.0.1 (Local/Gateway)',
          userAgent: meta.userAgent || 'Mozilla/5.0 (Client)',
          method: meta.method || (log.action.includes('create') ? 'POST' : log.action.includes('delete') ? 'DELETE' : 'PUT'),
          route: meta.route || `/api/${log.entityType?.toLowerCase() || 'system'}`,
          transactionId: meta.transactionId || `tx-${log.id.slice(0, 8)}`,
          before: meta.before || null,
          after: meta.after || null,
          diff: meta.diff || null,
          stackTrace: meta.stackTrace || null,
          reason: meta.reason || null,
          metadata: meta,
          summary: buildHumanReadableSummary(log.action, log.entityType, meta, log.actor?.nom || 'Utilisateur'),
        };
      });

      // In-memory filter for ROOT custom filters if needed
      if (subsystem && subsystem !== 'ALL') {
        sanitizedData = sanitizedData.filter((d) => (d.subsystem || '').toLowerCase() === subsystem.toLowerCase());
      }
      if (ip && ip.trim() !== '') {
        const ipQuery = ip.trim().toLowerCase();
        sanitizedData = sanitizedData.filter((d) => (d.ip || '').toLowerCase().includes(ipQuery));
      }
    } else {
      // Non-ROOT users: Server completely strips all sensitive developer keys and technical telemetry
      sanitizedData = items.map((log) => {
        const meta = (log.metadata as any) || {};
        const safeMetadata: any = {};

        // Only keep safe, user-friendly business keys
        if (meta.nom) safeMetadata.nom = meta.nom;
        if (meta.numero) safeMetadata.numero = meta.numero;
        if (meta.category || meta.categorie) safeMetadata.category = meta.category || meta.categorie;
        if (meta.statut || meta.status) safeMetadata.status = meta.statut || meta.status;
        if (meta.targetPack) safeMetadata.targetPack = meta.targetPack;
        if (meta.newPack) safeMetadata.newPack = meta.newPack;
        if (meta.reason && !log.isRootIntervention) safeMetadata.reason = meta.reason;

        return {
          id: log.id,
          createdAt: log.createdAt,
          action: log.action,
          entityType: log.entityType,
          actor: {
            id: log.actor?.id,
            nom: log.actor?.nom,
            email: log.actor?.email,
          },
          summary: buildHumanReadableSummary(log.action, log.entityType, meta, log.actor?.nom || 'Collaborateur'),
          metadata: safeMetadata,
        };
      });
    }

    return {
      success: true,
      data: sanitizedData,
      meta: {
        total: isRoot && (subsystem || ip) ? sanitizedData.length : total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}


