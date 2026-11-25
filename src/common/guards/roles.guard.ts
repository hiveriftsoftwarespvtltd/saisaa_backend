import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified on endpoint or class, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Access denied: Insufficient privileges to perform this action',
      );
    }

    const hasRole = requiredRoles.some(
      (role) => role.toLowerCase() === user.role.toLowerCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Restricted to [${requiredRoles.join(', ')}] role`,
      );
    }

    return true;
  }
}
