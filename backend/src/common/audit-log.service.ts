import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

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
    metadata: any = {},
  ) {
    // Determine if actor is a ROOT user
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: actorId },
      include: { role: true },
    });
    const isRoot = userRoles.some((ur) => ur.role.nom === 'ROOT' && ur.role.isSystem);

    if (isRoot) {
      const isWriteAction = ['create', 'update', 'delete', 'reset', 'set-as-original', 'assign'].some(
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

    return this.prisma.auditLog.create({
      data: {
        actorId,
        companyId,
        action,
        entityType,
        entityId,
        isRootIntervention: isRoot,
        metadata: metadata || {},
      },
    });
  }
}
