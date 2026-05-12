import { useAppSelector } from '../../store';

export function usePermission(permission: string): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  return permissions.includes(permission);
}

export function usePermissions(requiredPermissions: string[]): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  return requiredPermissions.every((p) => permissions.includes(p));
}

export function useHasAnyPermission(requiredPermissions: string[]): boolean {
  const permissions = useAppSelector((state) => state.auth.permissions);
  return requiredPermissions.some((p) => permissions.includes(p));
}
