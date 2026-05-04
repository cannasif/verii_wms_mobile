import type { MyPermissionsDto } from '../types';

export function hasPermission(
  permissions: MyPermissionsDto | null | undefined,
  requiredCode: string,
): boolean {
  if (!permissions) return false;
  if (permissions.isSystemAdmin) return true;
  return permissions.permissionCodes.includes(requiredCode);
}
