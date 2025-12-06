import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: Date, endDate: Date, exportFormat: 'txt' | 'json', listName?: string) => void;
  initialStartDate: Date;
  initialEndDate: Date;
  title: string;
  storageKey: string;
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  initialStartDate, 
  initialEndDate,
  title,
  storageKey
}: ExportModalProps) {
  const [startDate, setStartDate] = useState(format(initialStartDate, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(initialEndDate, 'yyyy-MM-dd'));
  const [exportFormat, setExportFormat] = useState<'txt' | 'json'>('txt');
  const [listName, setListName] = useState(() => {
    return localStorage.getItem(storageKey) || '';
  });

  useEffect(() => {
    if (listName) {
      localStorage.setItem(storageKey, listName);
    }
  }, [listName, storageKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exportFormat === 'json' && !listName.trim()) {
      alert('List name is required for JSON export');
      return;
    }
    onExport(new Date(startDate), new Date(endDate), exportFormat, listName);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{title}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'txt' | 'json')}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="txt">Text (.txt)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          {exportFormat === 'json' && (
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>List Name *</label>
              <input
                type="text"
                placeholder="e.g., Weekly Shopping"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                required={exportFormat === 'json'}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </div>
          )}

          <div className="flex gap-3" style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Export</button>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
