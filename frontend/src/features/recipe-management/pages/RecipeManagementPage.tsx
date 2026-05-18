import React, { useState } from 'react';
import { useGetGarmentTypesQuery, useGetGarmentTypeQuery } from '../../costing/api/costing.api';
import type { GarmentType } from '../../costing/types/costing.types';

function BomDetailPanel({ garmentTypeId, onClose }: { garmentTypeId: string; onClose: () => void }) {
  const { data, isLoading } = useGetGarmentTypeQuery(garmentTypeId);
  const gt = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            Bill of Materials — {gt?.name ?? '…'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : !gt ? (
            <p className="text-sm text-gray-400 text-center py-6">Failed to load BOM data.</p>
          ) : (gt.garmentAccessories ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No components defined. Add accessories in Cost Calculation → Garment Types.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Component', 'Code', 'Qty', 'Unit'].map((h) => (
                    <th key={h} className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(gt.garmentAccessories ?? []).map((acc) => (
                  <tr key={acc.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-700">{acc.inventoryItem.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">{acc.inventoryItem.code}</td>
                    <td className="py-2 pr-4 text-gray-600">{acc.quantity}</td>
                    <td className="py-2 text-gray-500 text-xs">{acc.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecipeManagementPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [bomFor, setBomFor] = useState<GarmentType | null>(null);

  const { data, isLoading, isError } = useGetGarmentTypesQuery({ page, limit: 20, search: search || undefined });
  const garmentTypes = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bill of Materials (BOM) for each garment type</p>
        </div>
        <a
          href="/cost-calculation"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Manage Garment Types
        </a>
      </div>

      <div className="flex justify-end">
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search garment types…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">Failed to load recipes.</div>
        ) : garmentTypes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-medium">No garment types found</p>
            <p className="text-gray-400 text-sm mt-1">Create garment types in Cost Calculation to define recipes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Code', 'Garment Type', 'Components', 'Last Updated', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {garmentTypes.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">
                      {row._count?.garmentAccessories ?? (row.garmentAccessories?.length ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.updatedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setBomFor(row)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        View BOM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>{meta.total} garment types</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-xs">{page} / {meta.totalPages}</span>
              <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {bomFor && <BomDetailPanel garmentTypeId={bomFor.id} onClose={() => setBomFor(null)} />}
    </div>
  );
}
