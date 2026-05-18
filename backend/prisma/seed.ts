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

  // These codes must match what the production pages query (DESIGN, PATTERN, SAMPLE, CUTTING, SEWING, QC, FINISHING)
  const defaultStages = [
    { name: 'Design & Review',   code: 'DESIGN',    orderIndex: 1, isMandatory: true  },
    { name: 'Pattern Making',    code: 'PATTERN',   orderIndex: 2, isMandatory: true  },
    { name: 'Sample Making',     code: 'SAMPLE',    orderIndex: 3, isMandatory: false },
    { name: 'Cutting',           code: 'CUTTING',   orderIndex: 4, isMandatory: true  },
    { name: 'Sewing',            code: 'SEWING',    orderIndex: 5, isMandatory: true  },
    { name: 'Quality Control',   code: 'QC',        orderIndex: 6, isMandatory: true  },
    { name: 'Finishing',         code: 'FINISHING', orderIndex: 7, isMandatory: true  },
  ];

  for (const tenant of tenants) {
    for (const stage of defaultStages) {
      await prisma.productionStageConfig.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: stage.code } },
        create: { ...stage, tenantId: tenant.id },
        update: { name: stage.name, orderIndex: stage.orderIndex, isMandatory: stage.isMandatory, isActive: true },
      });
    }
  }
  console.log('✅ Production stages seeded/updated (7-stage workflow: DESIGN→PATTERN→SAMPLE→CUTTING→SEWING→QC→FINISHING)');
}

async function seedProductionData(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null } });

  for (const tenant of tenants) {
    // Always rebuild production data so each stage has demo batches
    await prisma.qualityCheck.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.productionStageHistory.deleteMany({
      where: { batch: { productionOrder: { tenantId: tenant.id } } },
    });
    await prisma.productionBatch.deleteMany({ where: { productionOrder: { tenantId: tenant.id } } });
    await prisma.productionOrder.deleteMany({ where: { tenantId: tenant.id } });

    type StageConfig = { id: string; code: string; orderIndex: number };
    const stages = await prisma.productionStageConfig.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { orderIndex: 'asc' },
    }) as StageConfig[];
    if (stages.length === 0) continue;

    const getStage = (code: string) => stages.find((s: StageConfig) => s.code === code);

    // One order per stage so each department page shows data
    const orderDefs = [
      { orderNumber: 'PO-2026-001', description: 'Cotton Blouse — Summer Collection',  plannedQty: 120, priority: 1, atStage: 'DESIGN'    },
      { orderNumber: 'PO-2026-002', description: 'Denim Skirt — A-Line Grey',          plannedQty: 80,  priority: 2, atStage: 'PATTERN'   },
      { orderNumber: 'PO-2026-003', description: 'Office Blouse Ivory — Vol.2',        plannedQty: 200, priority: 3, atStage: 'SAMPLE'    },
      { orderNumber: 'PO-2026-004', description: 'Crop Top Black — Basic Range',       plannedQty: 150, priority: 4, atStage: 'CUTTING'   },
      { orderNumber: 'PO-2026-005', description: 'Frock Summer Floral — Midi',         plannedQty: 60,  priority: 5, atStage: 'SEWING'    },
    ];

    for (const def of orderDefs) {
      const currentStage = getStage(def.atStage);
      if (!currentStage) continue;

      const order = await prisma.productionOrder.create({
        data: {
          tenantId: tenant.id,
          orderNumber: def.orderNumber,
          description: def.description,
          plannedQty: def.plannedQty,
          priority: def.priority,
          status: 'IN_PROGRESS',
          plannedStartDate: new Date('2026-05-01'),
          plannedEndDate: new Date('2026-06-30'),
        },
      });

      const batch = await prisma.productionBatch.create({
        data: {
          productionOrderId: order.id,
          batchNumber: `${def.orderNumber}-B1`,
          status: 'IN_PROGRESS',
          plannedQty: def.plannedQty,
          startedAt: new Date(),
          currentStageId: currentStage.id,
        },
      });

      // Stage histories: all stages up to current are COMPLETED, current is IN_PROGRESS, rest PENDING
      const stageHistories = stages.map((stage: StageConfig) => {
        let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
        if (stage.orderIndex < currentStage.orderIndex) status = 'COMPLETED';
        if (stage.orderIndex === currentStage.orderIndex) status = 'IN_PROGRESS';
        return {
          batchId:       batch.id,
          stageConfigId: stage.id,
          plannedQty:    def.plannedQty,
          completedQty:  status === 'COMPLETED' ? def.plannedQty : 0,
          status,
          startedAt:     status !== 'PENDING'   ? new Date() : undefined,
          completedAt:   status === 'COMPLETED' ? new Date() : undefined,
        };
      });

      await prisma.productionStageHistory.createMany({ data: stageHistories });
    }

    console.log(`✅ Production data seeded for tenant "${tenant.name}": ${orderDefs.length} orders across all stages`);
  }
}

async function seedEmployees(): Promise<void> {
  const tenants = await prisma.tenant.findMany({ where: { deletedAt: null } });

  for (const tenant of tenants) {
    const existing = await prisma.employee.count({ where: { tenantId: tenant.id } });
    if (existing > 0) {
      console.log('ℹ️  Employees already exist — skipping');
      continue;
    }

    await prisma.employee.createMany({
      data: [
        {
          tenantId: tenant.id,
          employeeCode: 'EMP-001',
          firstName: 'System',
          lastName: 'Admin',
          email: 'admin@shaaapparel.com',
          jobTitle: 'Administrator',
          department: 'Management',
          hireDate: new Date('2024-01-01'),
          isActive: true,
        },
        {
          tenantId: tenant.id,
          employeeCode: 'EMP-002',
          firstName: 'QC',
          lastName: 'Inspector',
          email: 'qc@shaaapparel.com',
          jobTitle: 'QC Inspector',
          department: 'Quality Control',
          hireDate: new Date('2024-01-01'),
          isActive: true,
        },
        {
          tenantId: tenant.id,
          employeeCode: 'EMP-003',
          firstName: 'Production',
          lastName: 'Manager',
          email: 'production@shaaapparel.com',
          jobTitle: 'Production Manager',
          department: 'Production',
          hireDate: new Date('2024-01-01'),
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ Employees seeded for tenant "${tenant.name}"`);
  }
}

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');
  await seedPermissions();
  await seedDefaultTenant();
  await seedInventoryData();
  await seedProductionStages();
  await seedProductionData();
  await seedEmployees();
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
