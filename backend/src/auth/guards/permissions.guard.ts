import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié dans la requête.');
    }

    // Retrieve user's aggregated roles and their permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const userPermissionKeys = new Set<string>();
    let isRoot = false;

    for (const ur of userRoles) {
      if (ur.role.nom === 'ROOT' && ur.role.isSystem) {
        isRoot = true;
        break;
      }
      for (const rp of ur.role.permissions) {
        userPermissionKeys.add(rp.permission.key);
      }
    }

    // ROOT has access to EVERYTHING bypass
    if (isRoot) {
      // Attach a helper flag to the request so controllers and services know this is ROOT
      request.isRootUser = true;
      return true;
    }

    // Verify all required permissions are met (AND logic by default, or OR logic can be used)
    // Here we implement OR logic: if the user has AT LEAST ONE of the required permissions, allow it.
    // This provides maximum flexibility (e.g. @RequirePermissions('espace:update', 'espace:create') means either)
    const hasPermission = requiredPermissions.some((perm) => userPermissionKeys.has(perm));

    if (!hasPermission) {
      throw new ForbiddenException(
        `Accès refusé. Vous ne possédez pas les permissions requises (${requiredPermissions.join(', ')}).`
      );
    }

    return true;
  }
}
