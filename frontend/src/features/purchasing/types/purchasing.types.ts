import { PurchaseOrderStatus } from '../../../shared/types';

export type { PurchaseOrderStatus };

export type GrnStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SupplierRef {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { purchaseOrders: number };
}

export interface SupplierOption {
  id: string;
  name: string;
  code: string;
}

export interface InventoryItemRef {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export interface PoItem {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  inventoryItem: InventoryItemRef;
}

export interface GrnItem {
  id: string;
  grnId: string;
  inventoryItemId: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitCost: number;
  notes?: string;
  inventoryItem: InventoryItemRef;
}

export interface GoodsReceivedNote {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  grnNumber: string;
  status: GrnStatus;
  receivedDate: string;
  warehouseId?: string;
  notes?: string;
  receivedById?: string;
  confirmedById?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: GrnItem[];
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  notes?: string;
  createdById?: string;
  approvedById?: string;
  approvedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  supplier: SupplierRef;
  items: PoItem[];
  grns: GoodsReceivedNote[];
  _count?: { grns: number };
}

export interface PoStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  partiallyReceived: number;
  fullyReceived: number;
}

// DTO shapes ────────────────────────────────────────────────────────────────────

export interface CreatePoItemPayload {
  inventoryItemId: string;
  orderedQty: number;
  unitPrice: number;
  notes?: string;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  poNumber?: string;
  orderDate: string;
  expectedDate?: string;
  notes?: string;
  items: CreatePoItemPayload[];
}

export interface UpdatePurchaseOrderPayload {
  orderDate?: string;
  expectedDate?: string;
  notes?: string;
}

export interface CreateGrnItemPayload {
  inventoryItemId: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty?: number;
  unitCost: number;
  notes?: string;
}

export interface CreateGrnPayload {
  grnNumber?: string;
  warehouseId: string;
  receivedDate?: string;
  notes?: string;
  items: CreateGrnItemPayload[];
}

export interface CreateSupplierPayload {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxNumber?: string;
  paymentTerms?: string;
  isActive?: boolean;
}

export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {}
