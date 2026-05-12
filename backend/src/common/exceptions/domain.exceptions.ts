import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';

export class TenantNotFoundException extends NotFoundException {
  constructor(tenantId: string) {
    super(`Tenant with ID "${tenantId}" not found`);
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`User "${identifier}" not found`);
  }
}

export class InvalidCredentialsException extends BadRequestException {
  constructor() {
    super('Invalid email or password');
  }
}

export class AccountSuspendedException extends ForbiddenException {
  constructor() {
    super('Your account has been suspended. Please contact support.');
  }
}

export class DuplicateRecordException extends ConflictException {
  constructor(field: string) {
    super(`A record with this ${field} already exists`);
  }
}

export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID "${id}" not found`);
  }
}

export class InsufficientStockException extends BadRequestException {
  constructor(itemName: string, available: number, requested: number) {
    super(
      `Insufficient stock for "${itemName}": available ${available}, requested ${requested}`,
    );
  }
}

export class WastageThresholdExceededException extends BadRequestException {
  constructor(actual: number, max: number) {
    super(
      `Wastage percentage ${actual}% exceeds the configured maximum of ${max}%`,
    );
  }
}

export class FeatureNotEnabledException extends ForbiddenException {
  constructor(featureKey: string) {
    super(`Feature "${featureKey}" is not enabled for your subscription plan`);
  }
}
