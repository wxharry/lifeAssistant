import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: Date, endDate: Date, exportFormat: 'txt' | 'json', listName?: string) => void;
  initialStartDate: Date;
  initialEndDate: Date;
}

export default function DateRangeModal({ isOpen, onClose, onExport, initialStartDate, initialEndDate }: DateRangeModalProps) {
  const [startDate, setStartDate] = useState(format(initialStartDate, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(initialEndDate, 'yyyy-MM-dd'));
  const [exportFormat, setExportFormat] = useState<'txt' | 'json'>('txt');
  const [listName, setListName] = useState(() => {
    return localStorage.getItem('groceryListName') || '';
  });

  useEffect(() => {
    if (listName) {
      localStorage.setItem('groceryListName', listName);
    }
  }, [listName]);

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
      <div className="modal-content max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg">Export Grocery List</h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-500">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'txt' | 'json')}
              className="p-2 rounded-lg border border-gray-300"
            >
              <option value="txt">Text (.txt)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          {exportFormat === 'json' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-500">List Name *</label>
              <input
                type="text"
                placeholder="e.g., Weekly Groceries"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                required={exportFormat === 'json'}
                className="p-2 rounded-lg border border-gray-300"
              />
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn btn-primary flex-1">Export</button>
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
