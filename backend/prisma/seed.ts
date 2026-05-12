import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedPermissions(): Promise<void> {
  const modules = [
    'users', 'roles', 'tenants', 'factories', 'inventory', 'warehouses',
    'suppliers', 'purchase_orders', 'production', 'production_workflow',
    'costing', 'quality_control', 'finished_goods', 'dashboards', 'reporting',
    'pos_integration', 'subscriptions', 'feature_flags', 'billing',
    'file_management', 'audit_logs', 'notifications', 'system_settings',
  ];
  const actions = [
    'create', 'read', 'update', 'delete', 'approve', 'reject',
    'export', 'import', 'view_sensitive', 'manage',
  ];

  await prisma.permission.createMany({
    data: modules.flatMap((module) => actions.map((action) => ({ module, action }))),
    skipDuplicates: true,
  });
  console.log('✅ Permissions seeded');
}

async function seedDefaultTenant(): Promise<void> {
  const existing = await prisma.tenant.findUnique({ where: { slug: 'shaa-factory-1' } });
  if (existing) {
    console.log('ℹ️  Default tenant already exists — skipping');
    return;
  }

  const allPermissions = await prisma.permission.findMany();
  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: 'SHAA Apparel Factory 1',
        slug: 'shaa-factory-1',
        email: 'admin@shaaapparel.com',
        country: 'LK',
        timezone: 'Asia/Colombo',
        currency: 'LKR',
        status: 'ACTIVE',
      },
    });

    const adminRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: 'TENANT_ADMIN',
        description: 'Full administrative access',
        isSystem: true,
        rolePermissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@shaaapparel.com',
        username: 'admin',
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        userRoles: { create: { roleId: adminRole.id } },
      },
    });

    await tx.systemSetting.createMany({
      data: [
        { tenantId: tenant.id, key: 'currency', value: 'LKR', category: 'general', isPublic: true },
        { tenantId: tenant.id, key: 'timezone', value: 'Asia/Colombo', category: 'general', isPublic: true },
        { tenantId: tenant.id, key: 'wastage_max_percent', value: '15', category: 'production', isPublic: false },
        { tenantId: tenant.id, key: 'low_stock_alert_enabled', value: 'true', category: 'inventory', isPublic: false },
      ],
    });

    console.log(`✅ Default tenant "${tenant.name}" seeded`);
    console.log('   Admin email: admin@shaaapparel.com');
    console.log('   Admin password: Admin@1234');
  });
}

async function seedProductionStages(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null } });

  const defaultStages = [
    { name: 'Design & Pattern', code: 'DESIGN', orderIndex: 1, isMandatory: true },
    { name: 'Fabric Cutting', code: 'CUTTING', orderIndex: 2, isMandatory: true },
    { name: 'Fusing', code: 'FUSING', orderIndex: 3, isMandatory: false },
    { name: 'Stitching', code: 'STITCHING', orderIndex: 4, isMandatory: true },
    { name: 'Checking (In-Line)', code: 'CHECK_INLINE', orderIndex: 5, isMandatory: false },
    { name: 'Buttoning & Accessories', code: 'ACCESSORIES', orderIndex: 6, isMandatory: false },
    { name: 'Ironing / Pressing', code: 'IRONING', orderIndex: 7, isMandatory: true },
    { name: 'Final Quality Check', code: 'QC_FINAL', orderIndex: 8, isMandatory: true },
    { name: 'Folding & Packing', code: 'PACKING', orderIndex: 9, isMandatory: true },
    { name: 'Tagging', code: 'TAGGING', orderIndex: 10, isMandatory: false },
    { name: 'Dispatch', code: 'DISPATCH', orderIndex: 11, isMandatory: true },
  ];

  for (const tenant of tenants) {
    await prisma.productionStageConfig.createMany({
      data: defaultStages.map((s) => ({ ...s, tenantId: tenant.id })),
      skipDuplicates: true,
    });
  }
  console.log('✅ Production stages seeded (11-stage workflow)');
}

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');
  await seedPermissions();
  await seedDefaultTenant();
  await seedProductionStages();
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
