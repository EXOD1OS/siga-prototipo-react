import { UserRole } from '@prisma/client';

export function hasRole(rol: UserRole, allowed: UserRole[]) {
  return allowed.includes(rol);
}
