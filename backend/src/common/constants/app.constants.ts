export const APP_CONSTANTS = {
  API_PREFIX: 'api',
  API_VERSION: 'v1',
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  BCRYPT_ROUNDS: 12,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_TIMEZONE: 'UTC',
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

export const CACHE_KEYS = {
  DASHBOARD_STATS: (tenantId: string) => `dashboard:stats:${tenantId}`,
  USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,
  TENANT_FEATURES: (tenantId: string) => `tenant:features:${tenantId}`,
  PRODUCTION_STAGES: (tenantId: string) => `production:stages:${tenantId}`,
  INVENTORY_LOW_STOCK: (tenantId: string) => `inventory:low_stock:${tenantId}`,
} as const;

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  STOCK_ALERTS: 'stock-alerts',
  POS_SYNC: 'pos-sync',
  REPORT_GENERATION: 'report-generation',
  BILLING: 'billing',
  FILE_PROCESSING: 'file-processing',
  AUDIT_LOG: 'audit-log',
} as const;

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  FACTORY_MANAGER: 'FACTORY_MANAGER',
  PRODUCTION_SUPERVISOR: 'PRODUCTION_SUPERVISOR',
  PRODUCTION_OPERATOR: 'PRODUCTION_OPERATOR',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  QUALITY_INSPECTOR: 'QUALITY_INSPECTOR',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
} as const;

export const WASTAGE_THRESHOLDS = {
  MIN_PERCENT: 0,
  MAX_PERCENT: 15,
  WARNING_PERCENT: 10,
} as const;
