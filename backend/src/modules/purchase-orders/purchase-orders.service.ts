import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  QueryPurchaseOrdersDto,
  CreateGrnDto,
} from './dto';

const EDITABLE_STATUSES = ['DRAFT'];
const SUBMITTABLE_STATUSES = ['DRAFT'];
const APPROVABLE_STATUSES = ['SUBMITTED'];
const GRN_ALLOWED_STATUSES = ['APPROVED', 'PARTIALLY_RECEIVED'];

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly repo: PurchaseOrdersRepository,
    private readonly inventoryRepo: InventoryRepository,
  ) {}

  async create(
    tenantId: string,
    dto: CreatePurchaseOrderDto,
    userId: string,
  ): Promise<unknown> {
    if (dto.poNumber) {
      const existing = await this.repo.findByPoNumber(dto.poNumber, tenantId);
      if (existing) throw new ConflictException(`PO number "${dto.poNumber}" already exists`);
    }

    const poNumber = dto.poNumber ?? (await this.repo.generatePoNumber(tenantId));
    const totalAmount = dto.items.reduce((s, i) => s + i.orderedQty * i.unitPrice, 0);

    const po = await this.repo.create({
      tenantId,
      supplierId: dto.supplierId,
      poNumber,
      orderDate: new Date(dto.orderDate),
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      notes: dto.notes,
      totalAmount,
      createdById: userId,
      items: dto.items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        orderedQty: i.orderedQty,
        unitPrice: i.unitPrice,
        totalPrice: i.orderedQty * i.unitPrice,
        notes: i.notes,
      })),
    });

    return buildApiResponse(po, 'Purchase order created');
  }

  async findAll(tenantId: string, query: QueryPurchaseOrdersDto): Promise<unknown> {
    return this.repo.findMany(tenantId, query);
  }

  async getStats(tenantId: string): Promise<unknown> {
    const stats = await this.repo.getDashboardStats(tenantId);
    return buildApiResponse(stats);
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const po = await this.repo.findById(id, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    return buildApiResponse(po);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<unknown> {
    const po = await this.repo.findById(id, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (!EDITABLE_STATUSES.includes(po.status)) {
      throw new BadRequestException(`Cannot edit a PO with status ${po.status}`);
    }

    const updated = await this.repo.update(id, {
      ...(dto.orderDate    && { orderDate: new Date(dto.orderDate) }),
      ...(dto.expectedDate !== undefined && {
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
      }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });
    return buildApiResponse(updated, 'Purchase order updated');
  }

  async submit(id: string, tenantId: string): Promise<unknown> {
    const po = await this.repo.findById(id, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (!SUBMITTABLE_STATUSES.includes(po.status)) {
      throw new BadRequestException(`Cannot submit a PO with status ${po.status}`);
    }
    await this.repo.updateStatus(id, 'SUBMITTED');
    return buildApiResponse(null, 'Purchase order submitted for approval');
  }

  async approve(id: string, tenantId: string, userId: string): Promise<unknown> {
    const po = await this.repo.findById(id, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (!APPROVABLE_STATUSES.includes(po.status)) {
      throw new BadRequestException(`Cannot approve a PO with status ${po.status}`);
    }
    await this.repo.updateStatus(id, 'APPROVED', {
      approvedById: userId,
      approvedAt: new Date(),
    });
    return buildApiResponse(null, 'Purchase order approved');
  }

  async cancel(id: string, tenantId: string): Promise<unknown> {
    const po = await this.repo.findById(id, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (['FULLY_RECEIVED', 'CANCELLED'].includes(po.status)) {
      throw new BadRequestException(`Cannot cancel a PO with status ${po.status}`);
    }
    await this.repo.softDelete(id);
    return buildApiResponse(null, 'Purchase order cancelled');
  }

  async createGrn(
    poId: string,
    tenantId: string,
    dto: CreateGrnDto,
    userId: string,
  ): Promise<unknown> {
    const po = await this.repo.findById(poId, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${poId} not found`);
    if (!GRN_ALLOWED_STATUSES.includes(po.status)) {
      throw new BadRequestException(
        `GRN can only be created for APPROVED or PARTIALLY_RECEIVED orders (current: ${po.status})`,
      );
    }

    const grnNumber = dto.grnNumber ?? (await this.repo.generateGrnNumber(tenantId));
    const grn = await this.repo.createGrn({
      tenantId,
      purchaseOrderId: poId,
      grnNumber,
      warehouseId: dto.warehouseId,
      receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
      notes: dto.notes,
      receivedById: userId,
      items: dto.items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        receivedQty: i.receivedQty,
        acceptedQty: i.acceptedQty,
        rejectedQty: i.rejectedQty ?? 0,
        unitCost: i.unitCost,
        notes: i.notes,
      })),
    });

    return buildApiResponse(grn, 'GRN created — confirm to update stock');
  }

  async confirmGrn(
    poId: string,
    grnId: string,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    const po = await this.repo.findById(poId, tenantId);
    if (!po) throw new NotFoundException(`Purchase order ${poId} not found`);

    const grn = await this.repo.findGrnById(grnId, poId);
    if (!grn) throw new NotFoundException(`GRN ${grnId} not found`);
    if (grn.status === 'CONFIRMED') {
      throw new BadRequestException('GRN is already confirmed');
    }
    if (grn.status === 'CANCELLED') {
      throw new BadRequestException('GRN has been cancelled');
    }

    for (const item of grn.items) {
      if (Number(item.acceptedQty) <= 0) continue;

      await this.inventoryRepo.updateWarehouseStock(
        grn.warehouseId!,
        item.inventoryItemId,
        Number(item.acceptedQty),
        Number(item.unitCost),
      );

      await this.inventoryRepo.createMovement({
        tenantId,
        inventoryItem: { connect: { id: item.inventoryItemId } },
        warehouseId: grn.warehouseId ?? undefined,
        type: 'PURCHASE_RECEIVED',
        status: 'COMPLETED',
        quantity: Number(item.acceptedQty),
        unitCost: Number(item.unitCost),
        totalCost: Number(item.acceptedQty) * Number(item.unitCost),
        referenceType: 'GRN',
        referenceId: grn.id,
        performedById: userId,
      });

      await this.repo.incrementPoItemReceived(poId, item.inventoryItemId, Number(item.acceptedQty));
    }

    await this.repo.confirmGrn(grnId, userId);

    const { allFull, anyReceived } = await this.repo.getPoReceiptStatus(poId);
    if (allFull) {
      await this.repo.updateStatus(poId, 'FULLY_RECEIVED', { receivedDate: new Date() });
    } else if (anyReceived) {
      await this.repo.updateStatus(poId, 'PARTIALLY_RECEIVED');
    }

    return buildApiResponse(null, 'GRN confirmed — inventory updated');
  }
}
