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

async function seedInventoryData(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null } });

  for (const tenant of tenants) {
    const existing = await prisma.warehouse.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
      console.log('ℹ️  Inventory data already exists — skipping');
      continue;
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        code: 'WH-MAIN',
        name: 'Main Warehouse',
        location: 'Factory Floor A',
        isDefault: true,
        isActive: true,
      },
    });

    const suppliers = await prisma.supplier.createMany({
      data: [
        { tenantId: tenant.id, code: 'SUP-001', name: 'Lanka Fabric Mills', contactName: 'Rajan P.', email: 'rajan@lankafabric.lk', phone: '+94112345678', country: 'LK', paymentTerms: 'Net 30' },
        { tenantId: tenant.id, code: 'SUP-002', name: 'Colombo Thread Co.', contactName: 'Amara S.', email: 'amara@colombothread.lk', phone: '+94113456789', country: 'LK', paymentTerms: 'Net 15' },
        { tenantId: tenant.id, code: 'SUP-003', name: 'Island Accessories Ltd', contactName: 'Nadia K.', email: 'nadia@islandacc.lk', phone: '+94114567890', country: 'LK', paymentTerms: 'Net 45' },
      ],
      skipDuplicates: true,
    });

    const items = await prisma.$transaction([
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'FAB-001', name: 'Cotton Woven Fabric', type: 'FABRIC', unit: 'Meters', reorderLevel: 50, reorderQuantity: 200, costPerUnit: 250 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'FAB-002', name: 'Polyester Blend Fabric', type: 'FABRIC', unit: 'Meters', reorderLevel: 30, reorderQuantity: 150, costPerUnit: 180 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'FAB-003', name: 'Denim Fabric', type: 'FABRIC', unit: 'Meters', reorderLevel: 40, reorderQuantity: 200, costPerUnit: 320 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'FAB-004', name: 'Silk Chiffon', type: 'FABRIC', unit: 'Meters', reorderLevel: 20, reorderQuantity: 100, costPerUnit: 850 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'FAB-005', name: 'Jersey Knit Fabric', type: 'FABRIC', unit: 'Meters', reorderLevel: 60, reorderQuantity: 300, costPerUnit: 150 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'ACC-001', name: 'Metal Buttons (12mm)', type: 'ACCESSORY', unit: 'Pieces', reorderLevel: 500, reorderQuantity: 2000, costPerUnit: 8 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'ACC-002', name: 'YKK Zippers (20cm)', type: 'ACCESSORY', unit: 'Pieces', reorderLevel: 200, reorderQuantity: 1000, costPerUnit: 45 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'ACC-003', name: 'Polyester Thread (Spool)', type: 'ACCESSORY', unit: 'Spools', reorderLevel: 50, reorderQuantity: 200, costPerUnit: 120 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'ACC-004', name: 'Sew-on Labels', type: 'ACCESSORY', unit: 'Pieces', reorderLevel: 1000, reorderQuantity: 5000, costPerUnit: 2.5 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'ACC-005', name: 'Elastic Band (2cm)', type: 'ACCESSORY', unit: 'Meters', reorderLevel: 100, reorderQuantity: 500, costPerUnit: 15 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'PKG-001', name: 'Poly Bags (A4)', type: 'PACKAGING', unit: 'Pieces', reorderLevel: 500, reorderQuantity: 2000, costPerUnit: 3 } }),
      prisma.inventoryItem.create({ data: { tenantId: tenant.id, code: 'PKG-002', name: 'Cardboard Boxes (Medium)', type: 'PACKAGING', unit: 'Pieces', reorderLevel: 100, reorderQuantity: 500, costPerUnit: 25 } }),
    ]);

    await prisma.warehouseStock.createMany({
      data: items.map((item: { id: string; costPerUnit: unknown }) => ({
        warehouseId: warehouse.id,
        inventoryItemId: item.id,
        quantity: 100,
        avgCostPerUnit: item.costPerUnit,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Inventory data seeded for tenant "${tenant.name}": ${items.length} items, 1 warehouse, ${suppliers.count} suppliers`);
  }
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

async function seedProductionData(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null } });

  for (const tenant of tenants) {
    const existing = await prisma.productionOrder.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
      console.log('ℹ️  Production data already exists — skipping');
      continue;
    }

    type StageConfig = { id: string; code: string; name: string; orderIndex: number; isMandatory: boolean; tenantId: string };
    const stages = await prisma.productionStageConfig.findMany({
      where: { tenantId: tenant.id },
      orderBy: { orderIndex: 'asc' },
    }) as StageConfig[];
    if (stages.length === 0) continue;

    const cuttingStage  = stages.find((s: StageConfig) => s.code === 'CUTTING');
    const stitchStage   = stages.find((s: StageConfig) => s.code === 'STITCHING');
    const qcStage       = stages.find((s: StageConfig) => s.code === 'QC_FINAL');
    const designStage   = stages.find((s: StageConfig) => s.code === 'DESIGN');

    const orders = [
      { orderNumber: 'PO-2026-001', description: 'Cotton Blouse — Summer Collection', plannedQty: 120, status: 'IN_PROGRESS' as const, priority: 8, plannedStartDate: new Date('2026-05-01'), plannedEndDate: new Date('2026-05-25') },
      { orderNumber: 'PO-2026-002', description: 'Denim Skirt — A-Line Grey', plannedQty: 80,  status: 'IN_PROGRESS' as const, priority: 6, plannedStartDate: new Date('2026-05-05'), plannedEndDate: new Date('2026-05-28') },
      { orderNumber: 'PO-2026-003', description: 'Office Blouse Ivory — Vol.2', plannedQty: 200, status: 'PLANNED' as const, priority: 5, plannedStartDate: new Date('2026-05-20'), plannedEndDate: new Date('2026-06-10') },
    ];

    for (const orderData of orders) {
      const order = await prisma.productionOrder.create({
        data: { tenantId: tenant.id, ...orderData },
      });

      const batch = await prisma.productionBatch.create({
        data: {
          productionOrderId: order.id,
          batchNumber: `${order.orderNumber}-B1`,
          status: orderData.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN',
          plannedQty: order.plannedQty,
          startedAt: orderData.status === 'IN_PROGRESS' ? new Date() : undefined,
          currentStageId: orderData.status === 'IN_PROGRESS' ? (cuttingStage?.id ?? undefined) : undefined,
        },
      });

      // Seed stage histories for in-progress orders
      if (orderData.status === 'IN_PROGRESS' && stages.length > 0) {
        const stageData = stages.map((stage: StageConfig) => {
          let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
          if (stage.code === 'DESIGN') status = 'COMPLETED';
          if (stage.code === 'CUTTING') status = 'IN_PROGRESS';
          return {
            batchId:       batch.id,
            stageConfigId: stage.id,
            plannedQty:    order.plannedQty,
            completedQty:  status === 'COMPLETED' ? order.plannedQty : 0,
            status,
            startedAt:     status !== 'PENDING' ? new Date() : undefined,
            completedAt:   status === 'COMPLETED' ? new Date() : undefined,
          };
        });
        await prisma.productionStageHistory.createMany({ data: stageData, skipDuplicates: true });
      }
    }

    console.log(`✅ Production data seeded for tenant "${tenant.name}": ${orders.length} orders`);
    void (cuttingStage && stitchStage && qcStage && designStage); // suppress unused warnings
  }
}

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');
  await seedPermissions();
  await seedDefaultTenant();
  await seedInventoryData();
  await seedProductionStages();
  await seedProductionData();
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
