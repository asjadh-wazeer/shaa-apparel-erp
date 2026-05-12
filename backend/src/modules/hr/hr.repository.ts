import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResponse } from '../../common/utils/pagination.util';
import { QueryEmployeesDto, QueryAttendanceDto } from './dto';

const EMPLOYEE_INCLUDE = {
  factory: { select: { id: true, name: true, code: true } },
  _count: { select: { attendances: true, kpiRecords: true } },
} satisfies Prisma.EmployeeInclude;

@Injectable()
export class HrRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Employees ────────────────────────────────────────────────────────────────

  async findEmployeeById(id: string, tenantId: string) {
    return this.prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: EMPLOYEE_INCLUDE,
    });
  }

  async findEmployeeByCode(code: string, tenantId: string) {
    return this.prisma.employee.findFirst({
      where: { employeeCode: code, tenantId, deletedAt: null },
    });
  }

  async findManyEmployees(tenantId: string, query: QueryEmployeesDto) {
    const { page, limit, skip, search, isActive, department, factoryId } = query;

    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      deletedAt: null,
      ...(isActive   !== undefined && { isActive }),
      ...(department && { department: { contains: department } }),
      ...(factoryId  && { factoryId }),
      ...(search && {
        OR: [
          { firstName:    { contains: search } },
          { lastName:     { contains: search } },
          { employeeCode: { contains: search } },
          { jobTitle:     { contains: search } },
          { department:   { contains: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        include: EMPLOYEE_INCLUDE,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async listAllEmployees(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: { id: true, employeeCode: true, firstName: true, lastName: true, jobTitle: true, department: true },
    });
  }

  async createEmployee(data: Prisma.EmployeeCreateInput) {
    return this.prisma.employee.create({ data, include: EMPLOYEE_INCLUDE });
  }

  async updateEmployee(id: string, data: Prisma.EmployeeUpdateInput) {
    return this.prisma.employee.update({ where: { id }, data, include: EMPLOYEE_INCLUDE });
  }

  async softDeleteEmployee(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ── Attendance ────────────────────────────────────────────────────────────────

  async findAttendanceById(id: string, tenantId: string) {
    return this.prisma.attendance.findFirst({
      where: { id, tenantId },
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, jobTitle: true, department: true } } },
    });
  }

  async findAttendanceByEmployeeDate(employeeId: string, date: Date) {
    return this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
  }

  async findAttendance(tenantId: string, query: QueryAttendanceDto) {
    const where: Prisma.AttendanceWhereInput = { tenantId };

    if (query.date) {
      const d = new Date(query.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      where.date = {
        gte: new Date(year, month - 1, 1),
        lt:  new Date(year, month, 1),
      };
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { employee: { firstName: 'asc' } }],
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true, jobTitle: true, department: true },
        },
      },
    });
  }

  async upsertAttendance(
    tenantId: string,
    employeeId: string,
    date: Date,
    data: {
      status: string;
      checkIn?: string;
      checkOut?: string;
      hoursWorked?: number;
      notes?: string;
      recordedById?: string;
    },
  ) {
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: {
        tenantId,
        employeeId,
        date,
        status: data.status as any,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        hoursWorked: data.hoursWorked,
        notes: data.notes,
        recordedById: data.recordedById,
      },
      update: {
        status: data.status as any,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        hoursWorked: data.hoursWorked,
        notes: data.notes,
        recordedById: data.recordedById,
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true, jobTitle: true, department: true },
        },
      },
    });
  }

  async getAttendanceSummary(tenantId: string, month: string) {
    const [year, mon] = month.split('-').map(Number);
    const from = new Date(year, mon - 1, 1);
    const to   = new Date(year, mon, 1);

    const rows = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { tenantId, date: { gte: from, lt: to } },
      _count: { status: true },
    });

    const summary: Record<string, number> = {};
    for (const row of rows) {
      summary[row.status] = row._count.status;
    }
    return summary;
  }

  // ── KPI ───────────────────────────────────────────────────────────────────────

  async findKpiById(id: string, tenantId: string) {
    return this.prisma.kpiRecord.findFirst({
      where: { id, tenantId },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, jobTitle: true } } },
    });
  }

  async findKpiRecords(tenantId: string, { employeeId, month, year }: { employeeId?: string; month?: number; year?: number }) {
    return this.prisma.kpiRecord.findMany({
      where: {
        tenantId,
        ...(employeeId && { employeeId }),
        ...(month      && { month }),
        ...(year       && { year }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { firstName: 'asc' } }],
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, jobTitle: true, department: true },
        },
      },
    });
  }

  async upsertKpi(
    tenantId: string,
    employeeId: string,
    month: number,
    year: number,
    metric: string,
    data: { target?: number; actual: number; incentiveAmount?: number; notes?: string },
  ) {
    return this.prisma.kpiRecord.upsert({
      where: { employeeId_month_year_metric: { employeeId, month, year, metric } },
      create: {
        tenantId,
        employeeId,
        month,
        year,
        metric,
        target: data.target,
        actual: data.actual,
        incentiveAmount: data.incentiveAmount,
        notes: data.notes,
      },
      update: {
        target: data.target,
        actual: data.actual,
        incentiveAmount: data.incentiveAmount,
        notes: data.notes,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, jobTitle: true, department: true },
        },
      },
    });
  }

  async deleteKpi(id: string) {
    return this.prisma.kpiRecord.delete({ where: { id } });
  }
}
