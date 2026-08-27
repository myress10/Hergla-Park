import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogTelemetry {
  ip?: string;
  userAgent?: string;
  method?: string;
  route?: string;
  transactionId?: string;
  subsystem?: string;
  before?: any;
  after?: any;
  diff?: any;
  stackTrace?: string;
  reason?: string;
  [key: string]: any;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to derive subsystem from action or entityType
   */
  private deriveSubsystem(action: string, entityType: string): string {
    const act = action.toLowerCase();
    const ent = entityType.toLowerCase();

    if (act.includes('kart') || ent.includes('kart')) return 'karts';
    if (act.includes('espace') || ent.includes('espace')) return 'espaces';
    if (act.includes('scene') || act.includes('object') || ent.includes('object') || ent.includes('scene')) return 'studio3d';
    if (act.includes('pack') || act.includes('upgrade') || act.includes('subscription') || ent.includes('upgrade')) return 'subscriptions';
    if (act.includes('role') || ent.includes('role')) return 'roles';
    if (act.includes('user') || act.includes('auth') || act.includes('login') || ent.includes('user')) return 'users';
    return 'system';
  }

  /**
   * Write an entry in the system audit logs.
   * Ensures that ROOT write interventions always have a logged reason.
   */
  async log(
    actorId: string,
    companyId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata: AuditLogTelemetry = {},
  ) {
    // Determine if actor is a ROOT user
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: actorId },
      include: { role: true },
    });
    const isRoot = userRoles.some((ur) => ur.role.nom === 'ROOT' && ur.role.isSystem);

    if (isRoot) {
      const isWriteAction = ['create', 'update', 'delete', 'reset', 'set-as-original', 'assign', 'override'].some(
        (word) => action.toLowerCase().includes(word),
      );

      // ROOT intervention on any specific company's resource requires a valid reason
      if (isWriteAction && companyId !== null) {
        const reason = metadata?.reason;
        if (!reason || typeof reason !== 'string' || reason.trim() === '') {
          throw new BadRequestException(
            "Intervention ROOT refusée : un motif ('reason') non vide est obligatoire dans les métadonnées pour toute action d'écriture ROOT."
          );
        }
      }
    }

    // Enrich metadata with subsystem and transactionId if not present
    const subsystem = metadata.subsystem || this.deriveSubsystem(action, entityType);
    const enrichedMetadata: AuditLogTelemetry = {
      subsystem,
      transactionId: metadata.transactionId || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...metadata,
    };

    return this.prisma.auditLog.create({
      data: {
        actorId,
        companyId,
        action,
        entityType,
        entityId,
        isRootIntervention: isRoot,
        metadata: enrichedMetadata,
      },
    });
  }
}

