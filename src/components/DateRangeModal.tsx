import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: Date, endDate: Date) => void;
  initialStartDate: Date;
  initialEndDate: Date;
}

export default function DateRangeModal({ isOpen, onClose, onExport, initialStartDate, initialEndDate }: DateRangeModalProps) {
  const [startDate, setStartDate] = useState(format(initialStartDate, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(initialEndDate, 'yyyy-MM-dd'));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExport(new Date(startDate), new Date(endDate));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem' }}>Export Grocery List</h2>
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

          <div className="flex gap-3" style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Export</button>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
