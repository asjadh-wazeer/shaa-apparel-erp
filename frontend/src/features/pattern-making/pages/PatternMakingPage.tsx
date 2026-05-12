import React from 'react';

interface PatternRow {
  patternNo: string;
  product: string;
  type: string;
  size: string;
  drawing: string;
  approver: string;
  status: string;
  plotter: string;
  canApprove: boolean;
  canFree: boolean;
}

const patterns: PatternRow[] = [
  {
    patternNo: 'PAT-2205',
    product: 'Office Blouse Ivory',
    type: 'SAMPLE',
    size: '28–38',
    drawing: 'Chithari P.',
    approver: "Chithari P. (S'C2)",
    status: 'SAMPLE APPROVED',
    plotter: 'UP/GPS',
    canApprove: false,
    canFree: true,
  },
  {
    patternNo: 'PAT-2206',
    product: 'Casual Blouse Navy',
    type: 'SAMPLE',
    size: '28–36',
    drawing: 'Chithari P.',
    approver: "Chithari P. (S'C2)",
    status: 'SAMPLE APPROVED',
    plotter: 'UP/GPS',
    canApprove: false,
    canFree: true,
  },
  {
    patternNo: 'PAT-2207',
    product: 'Frock Summer Floral',
    type: 'FORMAL',
    size: 'S–XL',
    drawing: 'Roshan P.',
    approver: '—',
    status: 'PENDING REVIEW',
    plotter: '—',
    canApprove: true,
    canFree: false,
  },
  {
    patternNo: 'PAT-2208',
    product: 'Jumpsuit Khaki',
    type: 'FORMAL',
    size: '—',
    drawing: '—',
    approver: '—',
    status: 'IN PROGRESS',
    plotter: '—',
    canApprove: true,
    canFree: false,
  },
];

const statusStyle: Record<string, string> = {
  'SAMPLE APPROVED': 'bg-green-100 text-green-700',
  'IN PROGRESS': 'bg-blue-100 text-blue-700',
  'PENDING REVIEW': 'bg-amber-100 text-amber-700',
};

const alphabeticSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const numericSizes = ['28', '30', '32', '34', '36', '38', '40'];

const sizeData = [
  { alpha: 'S', num: '28', chest: '32"', waist: '26"', hip: '35"' },
  { alpha: 'M', num: '30', chest: '34"', waist: '28"', hip: '37"' },
  { alpha: 'L', num: '32', chest: '36"', waist: '30"', hip: '39"' },
  { alpha: 'XL', num: '34', chest: '38"', waist: '32"', hip: '41"' },
  { alpha: '2XL', num: '36', chest: '40"', waist: '34"', hip: '43"' },
  { alpha: '3XL', num: '38', chest: '42"', waist: '36"', hip: '45"' },
];

export function PatternMakingPage(): React.JSX.Element {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pattern Making</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Stage 2 — Digital/Plotter PDS to manual pattern-creation, grading, dress pieces
        </p>
      </div>

      {/* Patterns table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pattern Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Pattern #', 'Product', 'Type', 'Size', 'Drawing', 'Approver', 'Status', 'Plotter', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patterns.map((row) => (
                <tr key={row.patternNo} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.patternNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.product}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.size}</td>
                  <td className="px-4 py-3 text-gray-600">{row.drawing}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{row.approver}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.plotter}</td>
                  <td className="px-4 py-3">
                    {row.canFree && (
                      <button className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                        Free
                      </button>
                    )}
                    {row.canApprove && (
                      <button className="px-3 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alphabetic Size */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Alphabetic Size Reference</h2>
            <p className="text-xs text-gray-500 mt-0.5">S through 4XL grading guide</p>
          </div>
          <div className="p-5">
            <div className="flex gap-2 flex-wrap mb-4">
              {alphabeticSizes.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                  {s}
                </span>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-semibold">Alpha</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Chest</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Waist</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Hip</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row) => (
                  <tr key={row.alpha} className="border-b border-gray-50">
                    <td className="py-1.5 font-semibold text-gray-700">{row.alpha}</td>
                    <td className="py-1.5 text-gray-600">{row.chest}</td>
                    <td className="py-1.5 text-gray-600">{row.waist}</td>
                    <td className="py-1.5 text-gray-600">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Numeric Size */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Numeric Size Reference</h2>
            <p className="text-xs text-gray-500 mt-0.5">28 through 40 grading guide</p>
          </div>
          <div className="p-5">
            <div className="flex gap-2 flex-wrap mb-4">
              {numericSizes.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                  {s}
                </span>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-semibold">Numeric</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Chest</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Waist</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Hip</th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row) => (
                  <tr key={row.num} className="border-b border-gray-50">
                    <td className="py-1.5 font-semibold text-gray-700">{row.num}</td>
                    <td className="py-1.5 text-gray-600">{row.chest}</td>
                    <td className="py-1.5 text-gray-600">{row.waist}</td>
                    <td className="py-1.5 text-gray-600">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
