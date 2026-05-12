import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  storageConfig,
  throttleConfig,
} from './config';
import { PrismaModule } from './database/prisma.module';
import { QUEUE_NAMES } from './common/constants';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { FactoriesModule } from './modules/factories/factories.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { ProductionModule } from './modules/production/production.module';
import { HrModule } from './modules/hr/hr.module';
import { GarmentTypesModule } from './modules/garment-types/garment-types.module';
import { CostingModule } from './modules/costing/costing.module';
import { QualityControlModule } from './modules/quality-control/quality-control.module';
import { FinishedGoodsModule } from './modules/finished-goods/finished-goods.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { PosIntegrationModule } from './modules/pos-integration/pos-integration.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { FileManagementModule } from './modules/file-management/file-management.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig, throttleConfig],
      envFilePath: ['.env', '.env.local'],
      cache: true,
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 60000),
            limit: config.get<number>('throttle.limit', 100),
          },
        ],
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.queueHost', 'localhost'),
          port: config.get<number>('redis.queuePort', 6379),
          password: config.get<string | undefined>('redis.queuePassword'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
    }),

    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.STOCK_ALERTS },
      { name: QUEUE_NAMES.POS_SYNC },
      { name: QUEUE_NAMES.REPORT_GENERATION },
      { name: QUEUE_NAMES.BILLING },
      { name: QUEUE_NAMES.FILE_PROCESSING },
      { name: QUEUE_NAMES.AUDIT_LOG },
    ),

    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    FactoriesModule,
    InventoryModule,
    WarehousesModule,
    SuppliersModule,
    PurchaseOrdersModule,
    ProductionModule,
    HrModule,
    GarmentTypesModule,
    CostingModule,
    QualityControlModule,
    FinishedGoodsModule,
    DashboardsModule,
    ReportingModule,
    NotificationsModule,
    AuditLogsModule,
    PosIntegrationModule,
    SubscriptionsModule,
    FeatureFlagsModule,
    FileManagementModule,
  ],
})
export class AppModule {}
