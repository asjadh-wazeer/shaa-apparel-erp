import React, { useState } from 'react';

interface RecipeRow {
  id: string;
  garmentType: string;
  season: string;
  components: number;
  lastUpdated: string;
  status: string;
}

const recipes: RecipeRow[] = [
  { id: 'RCP-001', garmentType: 'Office Blouse', season: 'SS26', components: 12, lastUpdated: '2026-04-10', status: 'ACTIVE' },
  { id: 'RCP-002', garmentType: 'Casual Blouse', season: 'SS26', components: 11, lastUpdated: '2026-04-12', status: 'ACTIVE' },
  { id: 'RCP-003', garmentType: 'Frock (Summer)', season: 'SS26', components: 14, lastUpdated: '2026-04-15', status: 'ACTIVE' },
  { id: 'RCP-004', garmentType: 'Crop Top', season: 'SS26', components: 9, lastUpdated: '2026-04-20', status: 'DRAFT' },
  { id: 'RCP-005', garmentType: 'Skirt A-Line', season: 'SS26', components: 8, lastUpdated: '2026-04-22', status: 'DRAFT' },
  { id: 'RCP-006', garmentType: 'Jumpsuit', season: 'SS26', components: 16, lastUpdated: '2026-04-25', status: 'ACTIVE' },
];

export function RecipeManagementPage(): React.JSX.Element {
  const [search, setSearch] = useState('');

  const filtered = recipes.filter((r) =>
    r.garmentType.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipe Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bill of Materials (BOM) for each garment type</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#1D4ED8' }}>
          + New Recipe
        </button>
      </div>

      <div className="flex justify-end">
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Recipe ID', 'Garment Type', 'Season', 'Components', 'Last Updated', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.garmentType}</td>
                  <td className="px-4 py-3 text-gray-600">{row.season}</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">{row.components}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                        View BOM
                      </button>
                      <button className="px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
