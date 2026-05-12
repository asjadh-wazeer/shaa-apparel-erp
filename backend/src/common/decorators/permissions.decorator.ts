import { SetMetadata } from '@nestjs/common';
import { PermissionModule, PermissionAction } from '../enums';

export const PERMISSIONS_KEY = 'permissions';

export type PermissionDefinition = {
  module: PermissionModule;
  action: PermissionAction;
};

export const Permissions = (
  ...permissions: PermissionDefinition[]
): ReturnType<typeof SetMetadata> => SetMetadata(PERMISSIONS_KEY, permissions);
