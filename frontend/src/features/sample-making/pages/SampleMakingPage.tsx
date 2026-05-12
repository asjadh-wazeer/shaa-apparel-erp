import React from 'react';

interface SampleRow {
  sampleNo: string;
  product: string;
  patternRef: string;
  maker: string;
  size: string;
  startDate: string;
  status: string;
  fitApproval: string;
}

const samples: SampleRow[] = [
  {
    sampleNo: 'SMP-2201',
    product: 'Office Blouse Ivory',
    patternRef: 'PAT-2205',
    maker: 'Nisha R.',
    size: '32/MB',
    startDate: '2026-04-12',
    status: 'APPROVED FOR PRODUCTION',
    fitApproval: 'Approved',
  },
  {
    sampleNo: 'SMP-2202',
    product: 'Casual Blouse Navy',
    patternRef: 'PAT-2206',
    maker: 'Nisha R.',
    size: '30/MB',
    startDate: '2026-04-15',
    status: 'APPROVED FOR PRODUCTION',
    fitApproval: 'Approved',
  },
  {
    sampleNo: 'SMP-2203',
    product: 'Frock Summer Floral',
    patternRef: 'PAT-2207',
    maker: 'Chamari W.',
    size: 'M',
    startDate: '2026-04-20',
    status: 'FIT REVIEW',
    fitApproval: 'Pending',
  },
  {
    sampleNo: 'SMP-2204',
    product: 'Crop Top Black',
    patternRef: 'PAT-2208',
    maker: '—',
    size: '—',
    startDate: '—',
    status: 'NOT STARTED',
    fitApproval: '—',
  },
];

const statusStyle: Record<string, string> = {
  'APPROVED FOR PRODUCTION': 'bg-green-100 text-green-700',
  'FIT REVIEW': 'bg-amber-100 text-amber-700',
  'NOT STARTED': 'bg-gray-100 text-gray-500',
  'IN PROGRESS': 'bg-blue-100 text-blue-700',
  'REJECTED': 'bg-red-100 text-red-700',
};

export function SampleMakingPage(): React.JSX.Element {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sample Making</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Stage 3 — Physical sample construction, fit review and production approval
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Samples', value: 4, color: 'border-blue-500' },
          { label: 'Approved', value: 2, color: 'border-green-500' },
          { label: 'Under Review', value: 1, color: 'border-amber-400' },
          { label: 'Not Started', value: 1, color: 'border-gray-300' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sample Records</h2>
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            + New Sample
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Sample #', 'Product', 'Pattern Ref', 'Sample Maker', 'Size', 'Start Date', 'Status', 'Fit Approval'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samples.map((row) => (
                <tr key={row.sampleNo} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.sampleNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.product}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.patternRef}</td>
                  <td className="px-4 py-3 text-gray-600">{row.maker}</td>
                  <td className="px-4 py-3 text-gray-600">{row.size}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.startDate}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${row.fitApproval === 'Approved' ? 'text-green-600' : row.fitApproval === 'Pending' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {row.fitApproval}
                    </span>
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
