import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../enum/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * The `RolesGuard` is used to restrict access to specific routes based on roles.
   * It checks if the user, extracted from the HTTP request, has the required roles
   * defined on the route via the `@Roles` decorator.
   *
   * @param reflector - A service used to retrieve metadata from controllers or methods.
   */
  constructor(private reflector: Reflector) {}

  /**
   * Main method that determines whether access to a route should be granted or denied.
   *
   * @param context - The execution context, which contains information about the HTTP request.
   * @returns `true` if the user has the required roles or if no specific roles are required.
   */
  canActivate(context: ExecutionContext): boolean {
    // Retrieve the required roles from metadata attached to the controller or method
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    // If no roles are defined, grant access to everyone
    if (!requiredRoles) {
      return true;
    }

    // Retrieve the user object from the HTTP request
    const { user } = context.switchToHttp().getRequest();

    // Debug: Log the required roles and the user's roles
    // console.log(requiredRoles, user);

    /**
     * Check if at least one of the required roles (requiredRoles)
     * is included in the roles assigned to the user (user.roles).
     *
     * @returns `true` if the user has at least one required role; otherwise, `false`.
     */
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
