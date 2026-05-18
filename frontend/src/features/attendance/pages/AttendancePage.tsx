import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetEmployeesQuery,
  useGetAllEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useBulkMarkAttendanceMutation,
  useGetAttendanceSummaryQuery,
} from '../../hr/api/hr.api';
import type { Employee, AttendanceStatus, MarkAttendancePayload } from '../../hr/types/hr.types';

// ── Schemas ───────────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  employeeCode: z.string().min(1, 'Code required'),
  firstName:    z.string().min(1, 'First name required'),
  lastName:     z.string().min(1, 'Last name required'),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  phone:        z.string().optional(),
  jobTitle:     z.string().optional(),
  department:   z.string().optional(),
  hireDate:     z.string().optional(),
  baseSalary:   z.coerce.number().min(0).optional(),
  isActive:     z.boolean().optional(),
});
type EmployeeForm = z.infer<typeof employeeSchema>;

const attendanceStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'];

const statusStyle: Record<AttendanceStatus, string> = {
  PRESENT:  'bg-green-100 text-green-700',
  ABSENT:   'bg-red-100 text-red-700',
  LATE:     'bg-amber-100 text-amber-700',
  HALF_DAY: 'bg-blue-100 text-blue-700',
  ON_LEAVE: 'bg-purple-100 text-purple-700',
};

const statusLabel: Record<AttendanceStatus, string> = {
  PRESENT:  'Present',
  ABSENT:   'Absent',
  LATE:     'Late',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Leave',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

// ── Employee Modal ────────────────────────────────────────────────────────────

function EmployeeModal({
  isOpen, onClose, editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  editing?: Employee;
}): React.JSX.Element {
  const [create, { isLoading: creating }] = useCreateEmployeeMutation();
  const [update, { isLoading: updating }] = useUpdateEmployeeMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { isActive: true },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(editing
        ? {
            employeeCode: editing.employeeCode,
            firstName:    editing.firstName,
            lastName:     editing.lastName,
            email:        editing.email ?? '',
            phone:        editing.phone ?? '',
            jobTitle:     editing.jobTitle ?? '',
            department:   editing.department ?? '',
            hireDate:     editing.hireDate ? editing.hireDate.slice(0, 10) : '',
            baseSalary:   editing.baseSalary ?? undefined,
            isActive:     editing.isActive,
          }
        : { isActive: true, employeeCode: '', firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '', hireDate: '' });
    }
  }, [isOpen, editing, reset]);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: EmployeeForm) => {
    const payload = {
      employeeCode: values.employeeCode,
      firstName:    values.firstName,
      lastName:     values.lastName,
      email:        values.email || undefined,
      phone:        values.phone || undefined,
      jobTitle:     values.jobTitle || undefined,
      department:   values.department || undefined,
      hireDate:     values.hireDate || undefined,
      baseSalary:   values.baseSalary,
      isActive:     values.isActive ?? true,
    };
    if (editing) {
      await update({ id: editing.id, data: payload }).unwrap();
    } else {
      await create(payload).unwrap();
    }
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? 'Edit Employee' : 'Add Employee'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Add Employee'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Code <span className="text-red-500">*</span></label>
            <input {...register('employeeCode')} placeholder="EMP-001" className="input w-full" disabled={!!editing} />
            {errors.employeeCode && <p className="form-error">{errors.employeeCode.message}</p>}
          </div>
          <div>
            <label className="form-label">First Name <span className="text-red-500">*</span></label>
            <input {...register('firstName')} placeholder="Kasun" className="input w-full" />
            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="form-label">Last Name <span className="text-red-500">*</span></label>
            <input {...register('lastName')} placeholder="Perera" className="input w-full" />
            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Job Title</label>
            <input {...register('jobTitle')} placeholder="Cutting Supervisor" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Department</label>
            <input {...register('department')} placeholder="Production" className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Email</label>
            <input {...register('email')} type="email" placeholder="kasun@factory.com" className="input w-full" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input {...register('phone')} placeholder="+94 77 123 4567" className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Hire Date</label>
            <input {...register('hireDate')} type="date" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Base Salary (LKR)</label>
            <input {...register('baseSalary')} type="number" step="0.01" placeholder="45000" className="input w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input {...register('isActive')} type="checkbox" id="isActive" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
      </div>
    </Modal>
  );
}

// ── Mark Attendance Modal ─────────────────────────────────────────────────────

function MarkAttendanceModal({
  isOpen, onClose, date,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}): React.JSX.Element {
  const { data: empData } = useGetAllEmployeesQuery();
  const employees = empData?.data ?? [];
  const [bulkMark, { isLoading }] = useBulkMarkAttendanceMutation();

  const [rows, setRows] = useState<MarkAttendancePayload[]>(() =>
    employees.map((e) => ({
      employeeId: e.id,
      date,
      status: 'PRESENT' as AttendanceStatus,
    })),
  );

  React.useEffect(() => {
    setRows(
      employees.map((e) => ({
        employeeId: e.id,
        date,
        status: 'PRESENT' as AttendanceStatus,
      })),
    );
  }, [employees.length, date]);

  const setStatus = (employeeId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.employeeId === employeeId ? { ...r, status } : r)),
    );
  };

  const handleSave = async () => {
    await bulkMark({ records: rows }).unwrap();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mark Attendance — ${date}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSave}>Save All</Button>
        </>
      }
    >
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {employees.map((emp) => {
          const row = rows.find((r) => r.employeeId === emp.id);
          return (
            <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-gray-400">{emp.jobTitle ?? emp.department ?? emp.employeeCode}</p>
              </div>
              <div className="flex gap-1">
                {attendanceStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(emp.id, s)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      row?.status === s
                        ? statusStyle[s]
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {employees.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">No active employees. Add employees first.</p>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'daily' | 'employees';

export function AttendancePage(): React.JSX.Element {
  const [activeTab,      setActiveTab]      = useState<Tab>('daily');
  const [selectedDate,   setSelectedDate]   = useState(today());
  const [selectedMonth,  setSelectedMonth]  = useState(currentMonth());
  const [empPage,        setEmpPage]        = useState(1);
  const [empSearch,      setEmpSearch]      = useState('');
  const [showMarkModal,  setShowMarkModal]  = useState(false);
  const [showEmpModal,   setShowEmpModal]   = useState(false);
  const [editingEmp,     setEditingEmp]     = useState<Employee | undefined>();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const { data: attendanceData, isLoading: attLoading } = useGetAttendanceQuery({ date: selectedDate });
  const attendance = attendanceData?.data ?? [];

  const { data: summaryData } = useGetAttendanceSummaryQuery(selectedMonth);
  const summary = summaryData?.data ?? {};

  const { data: empData, isLoading: empLoading } = useGetEmployeesQuery({ page: empPage, limit: 15, search: empSearch || undefined });
  const employees = empData?.data ?? [];
  const empMeta   = empData?.meta;

  const present  = attendance.filter((r) => r.status === 'PRESENT').length;
  const absent   = attendance.filter((r) => r.status === 'ABSENT').length;
  const late     = attendance.filter((r) => r.status === 'LATE').length;
  const total    = attendance.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daily staff attendance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'daily' && (
            <>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="primary" onClick={() => setShowMarkModal(true)}>Mark Attendance</Button>
            </>
          )}
          {activeTab === 'employees' && (
            <Button variant="primary" onClick={() => setShowEmpModal(true)}>+ Add Employee</Button>
          )}
        </div>
      </div>

      {/* Stats (daily tab only) */}
      {activeTab === 'daily' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Present',     value: attLoading ? '—' : String(present),  color: 'border-green-500',  text: 'text-green-600' },
            { label: 'Absent',      value: attLoading ? '—' : String(absent),   color: 'border-red-500',    text: 'text-red-600' },
            { label: 'Late',        value: attLoading ? '—' : String(late),      color: 'border-amber-400',  text: 'text-amber-600' },
            { label: 'Total Staff', value: attLoading ? '—' : String(total),    color: 'border-blue-500',   text: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.color}`}>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly summary bar (daily tab) */}
      {activeTab === 'daily' && Object.keys(summary).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">Monthly summary</span>
          </div>
          {(Object.entries(summary) as [AttendanceStatus, number][]).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[status]}`}>{statusLabel[status]}</span>
              <span className="text-sm font-bold text-gray-700">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            { id: 'daily',     label: 'Daily Attendance' },
            { id: 'employees', label: 'Employee Registry' },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Daily Attendance ──────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Attendance — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>
          {attLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No attendance records for this date</p>
              <p className="text-gray-400 text-sm mt-1">Use "Mark Attendance" to record today's attendance for all staff.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowMarkModal(true)}>Mark Attendance</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Code', 'Employee', 'Department', 'Check In', 'Check Out', 'Hours', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.employee.employeeCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{row.employee.firstName} {row.employee.lastName}</p>
                        {row.employee.jobTitle && <p className="text-xs text-gray-400">{row.employee.jobTitle}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.employee.department ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.checkIn ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.checkOut ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 text-xs">
                        {row.hoursWorked ? `${Number(row.hoursWorked).toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status]}`}>
                          {statusLabel[row.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Employee Registry ─────────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, code or department…"
                value={empSearch}
                onChange={({ target }: React.ChangeEvent<HTMLInputElement>) => { setEmpSearch(target.value); setEmpPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {empLoading ? (
            <div className="flex items-center justify-center py-14">
              <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No employees yet</p>
              <p className="text-gray-400 text-sm mt-1">Add employees to start tracking attendance.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowEmpModal(true)}>+ Add Employee</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Code', 'Name', 'Job Title', 'Department', 'Phone', 'Hire Date', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{emp.firstName} {emp.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.jobTitle ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{emp.department ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{emp.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {emp.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingEmp(emp); setShowEmpModal(true); }}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEmployee(emp.id)}
                            className="text-xs text-red-500 hover:underline font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {empMeta && empMeta.totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-600 border-t border-gray-100">
              <span>Showing {(empPage - 1) * empMeta.limit + 1}–{Math.min(empPage * empMeta.limit, empMeta.total)} of {empMeta.total}</span>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="secondary" disabled={!empMeta.hasPreviousPage} onClick={() => setEmpPage((p) => p - 1)}>Prev</Button>
                <span>{empPage} / {empMeta.totalPages}</span>
                <Button size="xs" variant="secondary" disabled={!empMeta.hasNextPage} onClick={() => setEmpPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showMarkModal && (
        <MarkAttendanceModal isOpen={showMarkModal} onClose={() => setShowMarkModal(false)} date={selectedDate} />
      )}
      <EmployeeModal
        isOpen={showEmpModal}
        onClose={() => { setShowEmpModal(false); setEditingEmp(undefined); }}
        editing={editingEmp}
      />
    </div>
  );
}
