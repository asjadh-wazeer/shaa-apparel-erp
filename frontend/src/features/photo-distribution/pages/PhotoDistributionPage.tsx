import React, { useState } from 'react';

interface ProductPhoto {
  id: string;
  product: string;
  photos: number;
  uploadedBy: string;
  date: string;
  status: string;
  distributedTo: string[];
}

const photoRecords: ProductPhoto[] = [
  { id: 'PHD-001', product: 'Office Blouse Ivory', photos: 8, uploadedBy: 'Amara S.', date: '2026-05-02', status: 'DISTRIBUTED', distributedTo: ['Instagram', 'Website', 'Catalog'] },
  { id: 'PHD-002', product: 'Frock Summer Floral', photos: 12, uploadedBy: 'Nadia K.', date: '2026-05-04', status: 'DISTRIBUTED', distributedTo: ['Instagram', 'Facebook'] },
  { id: 'PHD-003', product: 'Casual Blouse Navy', photos: 6, uploadedBy: 'Amara S.', date: '2026-05-06', status: 'PENDING REVIEW', distributedTo: [] },
  { id: 'PHD-004', product: 'Crop Top Black', photos: 0, uploadedBy: '—', date: '—', status: 'NOT UPLOADED', distributedTo: [] },
];

const statusStyle: Record<string, string> = {
  DISTRIBUTED: 'bg-green-100 text-green-700',
  'PENDING REVIEW': 'bg-amber-100 text-amber-700',
  'NOT UPLOADED': 'bg-gray-100 text-gray-500',
};

const channelColors: Record<string, string> = {
  Instagram: 'bg-pink-100 text-pink-700',
  Facebook: 'bg-blue-100 text-blue-700',
  Website: 'bg-purple-100 text-purple-700',
  Catalog: 'bg-orange-100 text-orange-700',
};

export function PhotoDistributionPage(): React.JSX.Element {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo & Distribution</h1>
          <p className="text-sm text-gray-500 mt-0.5">Product photography management and multi-channel distribution</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#1D4ED8' }}
        >
          + Upload Photos
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: 4 },
          { label: 'Photos Uploaded', value: 26 },
          { label: 'Distributed', value: 2 },
          { label: 'Pending', value: 2 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {photoRecords.map((record) => (
          <div key={record.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                📸
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{record.product}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[record.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {record.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {record.photos} photo{record.photos !== 1 ? 's' : ''} · Uploaded by {record.uploadedBy} · {record.date}
                </p>
              </div>
              <div className="flex gap-2">
                {record.photos > 0 && (
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    View Gallery
                  </button>
                )}
                {record.status === 'PENDING REVIEW' && (
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors" style={{ backgroundColor: '#1D4ED8' }}>
                    Approve & Distribute
                  </button>
                )}
              </div>
            </div>
            {record.distributedTo.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Distributed to:</span>
                {record.distributedTo.map((ch) => (
                  <span key={ch} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${channelColors[ch] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ch}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Upload Product Photos</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowUpload(false); }} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Office Blouse Ivory</option>
                  <option>Casual Blouse Navy</option>
                  <option>Crop Top Black</option>
                  <option>Frock Summer Floral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-400 hover:border-blue-400 cursor-pointer">
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Drag & drop or click to upload (JPG, PNG)
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#1D4ED8' }}>Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
