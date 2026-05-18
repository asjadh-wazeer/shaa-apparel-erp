import React, { useRef, useState } from 'react';
import { useGetProductionOrdersQuery } from '../../production/api/production.api';

interface PhotoRecord {
  id: string;
  productDescription: string;
  photoCount: number;
  uploadedBy: string;
  uploadedAt: string;
  status: 'PENDING_REVIEW' | 'DISTRIBUTED' | 'NOT_UPLOADED';
  channels: string[];
  files: File[];
}

const CHANNELS = ['Instagram', 'Facebook', 'Website', 'Catalog'] as const;
type Channel = typeof CHANNELS[number];

const channelColors: Record<Channel, string> = {
  Instagram: 'bg-pink-100 text-pink-700',
  Facebook:  'bg-blue-100 text-blue-700',
  Website:   'bg-purple-100 text-purple-700',
  Catalog:   'bg-orange-100 text-orange-700',
};

const statusStyle: Record<PhotoRecord['status'], string> = {
  DISTRIBUTED:    'bg-green-100 text-green-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  NOT_UPLOADED:   'bg-gray-100 text-gray-500',
};

const statusLabel: Record<PhotoRecord['status'], string> = {
  DISTRIBUTED:    'DISTRIBUTED',
  PENDING_REVIEW: 'PENDING REVIEW',
  NOT_UPLOADED:   'NOT UPLOADED',
};

function UploadModal({
  orders,
  onClose,
  onUploaded,
}: {
  orders: { id: string; description?: string; orderNumber: string }[];
  onClose: () => void;
  onUploaded: (record: PhotoRecord) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const valid = picked.filter((f) => f.type.startsWith('image/'));
    if (valid.length < picked.length) setError('Only image files (JPG, PNG, etc.) are accepted.');
    else setError('');
    setFiles(valid);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) { setError('Select a product.'); return; }
    if (files.length === 0) { setError('Upload at least one photo.'); return; }
    const order = orders.find((o) => o.id === selectedOrderId);
    onUploaded({
      id: `PHD-${Date.now()}`,
      productDescription: order?.description ?? order?.orderNumber ?? selectedOrderId,
      photoCount: files.length,
      uploadedBy: 'Current User',
      uploadedAt: new Date().toLocaleDateString('en-GB'),
      status: 'PENDING_REVIEW',
      channels: [],
      files,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Upload Product Photos</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product / Production Order <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.description ?? 'Unnamed'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors"
            >
              {files.length > 0 ? (
                <p className="font-medium text-gray-700">{files.length} photo{files.length !== 1 ? 's' : ''} selected</p>
              ) : (
                <>
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Click to select photos (JPG, PNG)
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DistributeModal({
  record,
  onClose,
  onDistributed,
}: {
  record: PhotoRecord;
  onClose: () => void;
  onDistributed: (id: string, channels: Channel[]) => void;
}): React.JSX.Element {
  const [selected, setSelected] = useState<Channel[]>([...CHANNELS]);

  const toggle = (ch: Channel) =>
    setSelected((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    onDistributed(record.id, selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Approve &amp; Distribute</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Select distribution channels for <strong>{record.productDescription}</strong>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggle(ch)}
                className={[
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  selected.includes(ch)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400',
                ].join(' ')}
              >
                {ch}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={selected.length === 0} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              Distribute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PhotoDistributionPage(): React.JSX.Element {
  const [showUpload, setShowUpload] = useState(false);
  const [distributeFor, setDistributeFor] = useState<PhotoRecord | null>(null);
  const [records, setRecords] = useState<PhotoRecord[]>([]);

  const { data: ordersData } = useGetProductionOrdersQuery({ page: 1, limit: 50 });
  const orders = (ordersData?.data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    description: o.description,
  }));

  const handleUploaded = (record: PhotoRecord) => {
    setRecords((prev) => [record, ...prev]);
  };

  const handleDistributed = (id: string, channels: Channel[]) => {
    setRecords((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'DISTRIBUTED', channels } : r),
    );
  };

  const totalPhotos   = records.reduce((s, r) => s + r.photoCount, 0);
  const distributed   = records.filter((r) => r.status === 'DISTRIBUTED').length;
  const pendingCount  = records.filter((r) => r.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo &amp; Distribution</h1>
          <p className="text-sm text-gray-500 mt-0.5">Product photography management and multi-channel distribution</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Upload Photos
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: records.length },
          { label: 'Photos Uploaded', value: totalPhotos },
          { label: 'Distributed', value: distributed },
          { label: 'Pending Review', value: pendingCount },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No photos uploaded yet</p>
          <p className="text-gray-400 text-sm mt-1">Click &ldquo;Upload Photos&rdquo; to add product photography.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{record.productDescription}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[record.status]}`}>
                      {statusLabel[record.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {record.photoCount} photo{record.photoCount !== 1 ? 's' : ''} · Uploaded by {record.uploadedBy} · {record.uploadedAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  {record.status === 'PENDING_REVIEW' && (
                    <button
                      onClick={() => setDistributeFor(record)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Approve &amp; Distribute
                    </button>
                  )}
                </div>
              </div>
              {(record.channels?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Distributed to:</span>
                  {(record.channels ?? []).map((ch) => (
                    <span key={ch} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${channelColors[ch as Channel] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          orders={orders}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}

      {distributeFor && (
        <DistributeModal
          record={distributeFor}
          onClose={() => setDistributeFor(null)}
          onDistributed={handleDistributed}
        />
      )}
    </div>
  );
}
