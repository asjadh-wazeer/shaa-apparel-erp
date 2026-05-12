export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';

export interface EmployeeOption {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  factoryId?: string;
  hireDate?: string;
  baseSalary?: number;
  isActive: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  factory?: { id: string; name: string; code: string };
  _count?: { attendances: number; kpiRecords: number };
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    department?: string;
  };
}

export interface AttendanceSummary {
  PRESENT?: number;
  ABSENT?: number;
  LATE?: number;
  HALF_DAY?: number;
  ON_LEAVE?: number;
}

export interface KpiRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  month: number;
  year: number;
  metric: string;
  target?: number;
  actual: number;
  incentiveAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    department?: string;
  };
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateEmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  factoryId?: string;
  hireDate?: string;
  baseSalary?: number;
  isActive?: boolean;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {}

export interface MarkAttendancePayload {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  notes?: string;
}

export interface BulkAttendancePayload {
  records: MarkAttendancePayload[];
}

export interface UpsertKpiPayload {
  employeeId: string;
  month: number;
  year: number;
  metric: string;
  target?: number;
  actual: number;
  incentiveAmount?: number;
  notes?: string;
}
