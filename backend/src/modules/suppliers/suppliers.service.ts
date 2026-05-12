import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto } from './dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly repo: SuppliersRepository) {}

  async create(tenantId: string, dto: CreateSupplierDto): Promise<unknown> {
    const existing = await this.repo.findByCode(dto.code, tenantId);
    if (existing) throw new ConflictException(`Supplier with code "${dto.code}" already exists`);

    const supplier = await this.repo.create({
      tenant: { connect: { id: tenantId } },
      code: dto.code,
      name: dto.name,
      contactName: dto.contactName,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      country: dto.country,
      taxNumber: dto.taxNumber,
      paymentTerms: dto.paymentTerms,
      isActive: dto.isActive ?? true,
    });
    return buildApiResponse(supplier, 'Supplier created');
  }

  async findAll(tenantId: string, query: QuerySuppliersDto): Promise<unknown> {
    return this.repo.findMany(tenantId, query);
  }

  async listAll(tenantId: string): Promise<unknown> {
    const suppliers = await this.repo.listAll(tenantId);
    return buildApiResponse(suppliers);
  }

  async findOne(id: string, tenantId: string): Promise<unknown> {
    const supplier = await this.repo.findById(id, tenantId);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return buildApiResponse(supplier);
  }

  async update(id: string, tenantId: string, dto: UpdateSupplierDto): Promise<unknown> {
    const supplier = await this.repo.findById(id, tenantId);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);

    if (dto.code && dto.code !== supplier.code) {
      const existing = await this.repo.findByCode(dto.code, tenantId);
      if (existing) throw new ConflictException(`Supplier with code "${dto.code}" already exists`);
    }

    const updated = await this.repo.update(id, {
      ...(dto.code        !== undefined && { code: dto.code }),
      ...(dto.name        !== undefined && { name: dto.name }),
      ...(dto.contactName !== undefined && { contactName: dto.contactName }),
      ...(dto.email       !== undefined && { email: dto.email }),
      ...(dto.phone       !== undefined && { phone: dto.phone }),
      ...(dto.address     !== undefined && { address: dto.address }),
      ...(dto.country     !== undefined && { country: dto.country }),
      ...(dto.taxNumber   !== undefined && { taxNumber: dto.taxNumber }),
      ...(dto.paymentTerms !== undefined && { paymentTerms: dto.paymentTerms }),
      ...(dto.isActive    !== undefined && { isActive: dto.isActive }),
    });
    return buildApiResponse(updated, 'Supplier updated');
  }

  async remove(id: string, tenantId: string): Promise<unknown> {
    const supplier = await this.repo.findById(id, tenantId);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    await this.repo.softDelete(id);
    return buildApiResponse(null, 'Supplier deleted');
  }
}
