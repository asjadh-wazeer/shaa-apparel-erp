import React, { useState } from 'react';
import { useAppSelector } from '../../../store';

type Tab = 'pending' | 'approved' | 'rejected';

interface DesignRow {
  reviewNo: string;
  product: string;
  assignee: string;
  sizes: string[];
  date: string;
  status: 'PENDING APPROVAL' | 'APPROVED' | 'REJECTED';
}

const initialDesigns: DesignRow[] = [
  {
    reviewNo: 'DES-2204',
    product: 'Crop Top Black',
    assignee: 'Nadia K.',
    sizes: ['28/MB', '30/MB', '32/MB', '34/MB'],
    date: '2026-04-28',
    status: 'PENDING APPROVAL',
  },
  {
    reviewNo: 'DES-2203',
    product: 'Skirt A-Line Grey',
    assignee: 'Nadia K.',
    sizes: ['28/MB', '30/MB', '32/MB'],
    date: '2026-04-25',
    status: 'PENDING APPROVAL',
  },
  {
    reviewNo: 'DES-2391',
    product: 'Blouse Prototype A',
    assignee: 'Amara S.',
    sizes: ['S', 'M', 'L', 'XL'],
    date: '2026-04-22',
    status: 'APPROVED',
  },
  {
    reviewNo: 'DES-2201',
    product: 'Office Blouse Ivory',
    assignee: 'Amara S.',
    sizes: ['28/MB', '30/MB', '32/MB', '34/MB', '36/MB'],
    date: '2026-04-10',
    status: 'APPROVED',
  },
  {
    reviewNo: 'DES-2185',
    product: 'Casual Blouse Prototype',
    assignee: 'Nadia K.',
    sizes: ['S', 'M', 'L'],
    date: '2026-03-30',
    status: 'REJECTED',
  },
];

const statusStyle: Record<string, string> = {
  'PENDING APPROVAL': 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28/MB', '30/MB', '32/MB', '34/MB', '36/MB', '38/MB'];

function SubmitDesignModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (product: string, sizes: string[]) => void }) {
  const [product, setProduct] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleSize = (size: string) => {
    setSelectedSizes((prev: string[]) =>
      prev.includes(size) ? prev.filter((s: string) => s !== size) : [...prev, size],
    );
  };

  const handleSubmit = () => {
    if (!product.trim()) { setError('Product name is required'); return; }
    if (selectedSizes.length === 0) { setError('Select at least one size'); return; }
    onSubmit(product.trim(), selectedSizes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Submit New Design</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="form-label">Product Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g. Summer Blouse White"
              value={product}
              onChange={(e) => { setProduct(e.target.value); setError(''); }}
            />
          </div>
          <div>
            <label className="form-label">Submitted Sizes <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AVAILABLE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { toggleSize(size); setError(''); }}
                  className={[
                    'px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors',
                    selectedSizes.includes(size)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400',
                  ].join(' ')}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}

const ADMIN_ROLES = ['TENANT_ADMIN', 'admin', 'ADMIN', 'General Manager', 'CEO & Founder', 'Production Manager'];

export function DesignModulePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [designs, setDesigns] = useState<DesignRow[]>(initialDesigns);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const user = useAppSelector((s) => s.auth.user);
  const userRoles = user?.roles ?? [];
  const isAdmin = userRoles.some((r) => ADMIN_ROLES.includes(r)) || userRoles.length === 0;

  const tabFilter: Record<Tab, DesignRow['status']> = {
    pending: 'PENDING APPROVAL',
    approved: 'APPROVED',
    rejected: 'REJECTED',
  };

  const visible = designs.filter((d) => d.status === tabFilter[activeTab]);

  const handleApprove = (reviewNo: string): void => {
    setDesigns((prev) =>
      prev.map((d) => (d.reviewNo === reviewNo ? { ...d, status: 'APPROVED' } : d)),
    );
  };

  const handleReject = (reviewNo: string): void => {
    setDesigns((prev) =>
      prev.map((d) => (d.reviewNo === reviewNo ? { ...d, status: 'REJECTED' } : d)),
    );
  };

  const handleSubmitDesign = (product: string, sizes: string[]): void => {
    const count = designs.length + 1;
    const reviewNo = `DES-${2200 + count}`;
    const assignee = user ? `${user.firstName} ${user.lastName[0]}.` : 'Designer';
    setDesigns((prev) => [
      {
        reviewNo,
        product,
        assignee,
        sizes,
        date: new Date().toISOString().slice(0, 10),
        status: 'PENDING APPROVAL',
      },
      ...prev,
    ]);
    setShowSubmitModal(false);
    setActiveTab('pending');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending Approval' },
    { key: 'approved', label: 'Approved Designs' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Module</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stage 1 — Fashion design review and approval workflow</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Submit Design
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.label}
              <span className="ml-1.5 text-xs rounded-full px-1.5 py-0.5 bg-gray-100 text-gray-600">
                {designs.filter((d) => d.status === tabFilter[tab.key]).length}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Review #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted Sizes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    No designs in this category
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.reviewNo} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{row.reviewNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.product}</td>
                    <td className="px-4 py-3 text-gray-600">{row.assignee}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.sizes.map((size) => (
                          <span key={size} className="rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 font-mono">
                            {size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {row.status === 'PENDING APPROVAL' && isAdmin && (
                          <>
                            <button
                              onClick={() => handleApprove(row.reviewNo)}
                              className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(row.reviewNo)}
                              className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {row.status === 'PENDING APPROVAL' && !isAdmin && (
                          <span className="text-xs text-amber-600 font-medium">Awaiting review</span>
                        )}
                        {(row.status === 'APPROVED' || row.status === 'REJECTED') && (
                          <button className="px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSubmitModal && (
        <SubmitDesignModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitDesign}
        />
      )}
    </div>
  );
}
