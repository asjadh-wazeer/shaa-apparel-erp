import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { HrRepository } from './hr.repository';
import { buildApiResponse } from '../../common/utils/pagination.util';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeesDto,
  MarkAttendanceDto,
  BulkAttendanceDto,
  QueryAttendanceDto,
  UpsertKpiDto,
  QueryKpiDto,
} from './dto';

@Injectable()
export class HrService {
  constructor(private readonly repo: HrRepository) {}

  // ── Employees ─────────────────────────────────────────────────────────────────

  async createEmployee(tenantId: string, dto: CreateEmployeeDto) {
    const existing = await this.repo.findEmployeeByCode(dto.employeeCode, tenantId);
    if (existing) {
      throw new ConflictException(`Employee code "${dto.employeeCode}" already exists`);
    }

    const employee = await this.repo.createEmployee({
      tenant:       { connect: { id: tenantId } },
      employeeCode: dto.employeeCode,
      firstName:    dto.firstName,
      lastName:     dto.lastName,
      email:        dto.email,
      phone:        dto.phone,
      jobTitle:     dto.jobTitle,
      department:   dto.department,
      ...(dto.factoryId && { factory: { connect: { id: dto.factoryId } } }),
      hireDate:     dto.hireDate   ? new Date(dto.hireDate) : undefined,
      baseSalary:   dto.baseSalary ?? undefined,
      isActive:     dto.isActive ?? true,
    });
    return buildApiResponse(employee, 'Employee created');
  }

  async findAllEmployees(tenantId: string, query: QueryEmployeesDto) {
    return this.repo.findManyEmployees(tenantId, query);
  }

  async listAllEmployees(tenantId: string) {
    const employees = await this.repo.listAllEmployees(tenantId);
    return buildApiResponse(employees);
  }

  async findEmployee(id: string, tenantId: string) {
    const employee = await this.repo.findEmployeeById(id, tenantId);
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    return buildApiResponse(employee);
  }

  async updateEmployee(id: string, tenantId: string, dto: UpdateEmployeeDto) {
    const employee = await this.repo.findEmployeeById(id, tenantId);
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);

    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      const existing = await this.repo.findEmployeeByCode(dto.employeeCode, tenantId);
      if (existing) throw new ConflictException(`Employee code "${dto.employeeCode}" already exists`);
    }

    const updated = await this.repo.updateEmployee(id, {
      ...(dto.employeeCode !== undefined && { employeeCode: dto.employeeCode }),
      ...(dto.firstName    !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName     !== undefined && { lastName: dto.lastName }),
      ...(dto.email        !== undefined && { email: dto.email }),
      ...(dto.phone        !== undefined && { phone: dto.phone }),
      ...(dto.jobTitle     !== undefined && { jobTitle: dto.jobTitle }),
      ...(dto.department   !== undefined && { department: dto.department }),
      ...(dto.hireDate     !== undefined && { hireDate: new Date(dto.hireDate) }),
      ...(dto.baseSalary   !== undefined && { baseSalary: dto.baseSalary }),
      ...(dto.isActive     !== undefined && { isActive: dto.isActive }),
      ...(dto.factoryId !== undefined && {
        factory: dto.factoryId ? { connect: { id: dto.factoryId } } : { disconnect: true },
      }),
    });
    return buildApiResponse(updated, 'Employee updated');
  }

  async removeEmployee(id: string, tenantId: string) {
    const employee = await this.repo.findEmployeeById(id, tenantId);
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    await this.repo.softDeleteEmployee(id);
    return buildApiResponse(null, 'Employee removed');
  }

  // ── Attendance ────────────────────────────────────────────────────────────────

  async getAttendance(tenantId: string, query: QueryAttendanceDto) {
    const records = await this.repo.findAttendance(tenantId, query);
    return buildApiResponse(records);
  }

  async markAttendance(tenantId: string, dto: MarkAttendanceDto, userId?: string) {
    const employee = await this.repo.findEmployeeById(dto.employeeId, tenantId);
    if (!employee) throw new NotFoundException(`Employee ${dto.employeeId} not found`);

    const record = await this.repo.upsertAttendance(
      tenantId,
      dto.employeeId,
      new Date(dto.date),
      {
        status:      dto.status,
        checkIn:     dto.checkIn,
        checkOut:    dto.checkOut,
        hoursWorked: dto.hoursWorked,
        notes:       dto.notes,
        recordedById: userId,
      },
    );
    return buildApiResponse(record, 'Attendance marked');
  }

  async bulkMarkAttendance(tenantId: string, dto: BulkAttendanceDto, userId?: string) {
    const results = await Promise.all(
      dto.records.map((r) =>
        this.repo.upsertAttendance(tenantId, r.employeeId, new Date(r.date), {
          status:      r.status,
          checkIn:     r.checkIn,
          checkOut:    r.checkOut,
          hoursWorked: r.hoursWorked,
          notes:       r.notes,
          recordedById: userId,
        }),
      ),
    );
    return buildApiResponse(results, `${results.length} attendance records saved`);
  }

  async getAttendanceSummary(tenantId: string, month: string) {
    const summary = await this.repo.getAttendanceSummary(tenantId, month);
    return buildApiResponse(summary);
  }

  // ── KPI ───────────────────────────────────────────────────────────────────────

  async getKpiRecords(tenantId: string, query: QueryKpiDto) {
    const records = await this.repo.findKpiRecords(tenantId, {
      employeeId: query.employeeId,
      month:      query.month,
      year:       query.year,
    });
    return buildApiResponse(records);
  }

  async upsertKpi(tenantId: string, dto: UpsertKpiDto) {
    const employee = await this.repo.findEmployeeById(dto.employeeId, tenantId);
    if (!employee) throw new NotFoundException(`Employee ${dto.employeeId} not found`);

    const record = await this.repo.upsertKpi(
      tenantId,
      dto.employeeId,
      dto.month,
      dto.year,
      dto.metric,
      {
        target:          dto.target,
        actual:          dto.actual,
        incentiveAmount: dto.incentiveAmount,
        notes:           dto.notes,
      },
    );
    return buildApiResponse(record, 'KPI record saved');
  }

  async deleteKpi(id: string, tenantId: string) {
    const record = await this.repo.findKpiById(id, tenantId);
    if (!record) throw new NotFoundException(`KPI record ${id} not found`);
    await this.repo.deleteKpi(id);
    return buildApiResponse(null, 'KPI record deleted');
  }
}
