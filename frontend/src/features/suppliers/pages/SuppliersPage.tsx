import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/components/modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '../../purchasing/api/purchasing.api';
import type { Supplier } from '../../purchasing/types/purchasing.types';

const supplierSchema = z.object({
  code:         z.string().min(2, 'Code is required'),
  name:         z.string().min(2, 'Name is required'),
  contactName:  z.string().optional(),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  phone:        z.string().optional(),
  address:      z.string().optional(),
  country:      z.string().optional(),
  paymentTerms: z.string().optional(),
  isActive:     z.boolean().optional(),
});
type SupplierForm = z.infer<typeof supplierSchema>;

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: Supplier;
}

function SupplierModal({ isOpen, onClose, editing }: SupplierModalProps): React.JSX.Element {
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();
  const isLoading = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { isActive: true },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(editing
        ? {
            code:         editing.code,
            name:         editing.name,
            contactName:  editing.contactName ?? '',
            email:        editing.email ?? '',
            phone:        editing.phone ?? '',
            address:      editing.address ?? '',
            country:      editing.country ?? '',
            paymentTerms: editing.paymentTerms ?? '',
            isActive:     editing.isActive,
          }
        : { isActive: true, code: '', name: '', contactName: '', email: '', phone: '', address: '', country: '', paymentTerms: '' });
    }
  }, [isOpen, editing, reset]);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: SupplierForm) => {
    const payload = {
      code:         values.code,
      name:         values.name,
      contactName:  values.contactName || undefined,
      email:        values.email || undefined,
      phone:        values.phone || undefined,
      address:      values.address || undefined,
      country:      values.country || undefined,
      paymentTerms: values.paymentTerms || undefined,
      isActive:     values.isActive ?? true,
    };
    if (editing) {
      await updateSupplier({ id: editing.id, data: payload }).unwrap();
    } else {
      await createSupplier(payload).unwrap();
    }
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? 'Edit Supplier' : 'Add Supplier'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" loading={isLoading} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Code <span className="text-red-500">*</span></label>
            <input {...register('code')} placeholder="e.g. SUP-001" className="input w-full" disabled={!!editing} />
            {errors.code && <p className="form-error">{errors.code.message}</p>}
          </div>
          <div>
            <label className="form-label">Company Name <span className="text-red-500">*</span></label>
            <input {...register('name')} placeholder="Supplier name" className="input w-full" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Contact Person</label>
            <input {...register('contactName')} placeholder="Contact name" className="input w-full" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input {...register('phone')} placeholder="+94 11 234 5678" className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Email</label>
            <input {...register('email')} type="email" placeholder="orders@supplier.com" className="input w-full" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">Country</label>
            <input {...register('country')} placeholder="e.g. Sri Lanka" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="form-label">Address</label>
          <textarea {...register('address')} rows={2} className="input w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Payment Terms</label>
            <input {...register('paymentTerms')} placeholder="e.g. Net 30" className="input w-full" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input {...register('isActive')} type="checkbox" id="isActive" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function SuppliersPage(): React.JSX.Element {
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Supplier | undefined>();
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);

  const [deleteSupplier] = useDeleteSupplierMutation();

  const { data, isLoading, isError } = useGetSuppliersQuery({ page, limit: 15, search: search || undefined });
  const suppliers = data?.data ?? [];
  const meta      = data?.meta;

  const activeCount = suppliers.filter((s) => s.isActive).length;

  const handleEdit = (s: Supplier) => { setEditing(s); setShowModal(true); };
  const handleClose = () => { setEditing(undefined); setShowModal(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage fabric, accessories and material suppliers</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Add Supplier</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers', value: isLoading ? '—' : String(meta?.total ?? suppliers.length) },
          { label: 'Active (this page)', value: isLoading ? '—' : String(activeCount) },
          { label: 'With POs', value: isLoading ? '—' : String(suppliers.filter((s) => (s._count?.purchaseOrders ?? 0) > 0).length) },
          { label: 'Inactive (this page)', value: isLoading ? '—' : String(suppliers.filter((s) => !s.isActive).length) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search suppliers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load suppliers.</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium">No suppliers yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first supplier to start creating purchase orders.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowModal(true)}>+ Add Supplier</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Code', 'Name', 'Contact', 'Phone', 'Email', 'Country', 'POs', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.contactName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">{row.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{row.country ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700">
                        {row._count?.purchaseOrders ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSupplier(row.id)}
                          className="text-xs text-red-500 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}</span>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="secondary" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="px-2">{page} / {meta.totalPages}</span>
            <Button size="xs" variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <SupplierModal isOpen={showModal} onClose={handleClose} editing={editing} />
    </div>
  );
}
