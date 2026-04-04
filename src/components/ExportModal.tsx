import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '../lib/utils.ts';
import { Button } from './ui/button.tsx';
import { Calendar } from './ui/calendar.tsx';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.tsx';

export type ExportItemKey = 'grocery' | 'schedule';

export interface ExportItemDefinition {
  key: ExportItemKey;
  label: string;
  storageKey: string;
  defaultChecked?: boolean;
  defaultFormat?: 'txt' | 'json';
}

export interface ExportItemConfig extends ExportItemDefinition {
  checked: boolean;
  format: 'txt' | 'json';
  listName: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: Date, endDate: Date, items: ExportItemConfig[]) => void;
  initialStartDate: Date;
  initialEndDate: Date;
  title: string;
  items: ExportItemDefinition[];
  mode?: 'combined';
}

const RANGE_STORAGE_KEY = 'exportModalDateRange';

// Parse a YYYY-MM-DD string as a local midnight Date to avoid UTC timezone shifts
function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  initialStartDate, 
  initialEndDate,
  title,
  items
}: ExportModalProps) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: initialStartDate,
    to: initialEndDate
  });
  const [itemConfigs, setItemConfigs] = useState<ExportItemConfig[]>([]);

  const defaultConfigs = useMemo(() => {
    return items.map(item => {
      const storedListName = localStorage.getItem(item.storageKey) || '';
      const rawFormat = localStorage.getItem(item.storageKey + '_format');
      const storedFormat: 'txt' | 'json' | null = rawFormat === 'txt' || rawFormat === 'json' ? rawFormat : null;
      const storedChecked = localStorage.getItem(item.storageKey + '_checked');
      return {
        ...item,
        checked: storedChecked !== null ? storedChecked === 'true' : (item.defaultChecked ?? true),
        format: storedFormat ?? item.defaultFormat ?? 'json',
        listName: storedListName
      };
    });
  }, [items]);

  useEffect(() => {
    if (isOpen) {
      const storedRange = localStorage.getItem(RANGE_STORAGE_KEY);
      if (storedRange) {
        try {
          const parsed = JSON.parse(storedRange);
          const from = parseDateLocal(parsed.from);
          const to = parseDateLocal(parsed.to);
          if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
            setRange({ from, to });
          } else {
            setRange({ from: initialStartDate, to: initialEndDate });
          }
        } catch {
          setRange({ from: initialStartDate, to: initialEndDate });
        }
      } else {
        setRange({ from: initialStartDate, to: initialEndDate });
      }
      setItemConfigs(defaultConfigs);
    }
  }, [isOpen, initialStartDate, initialEndDate, defaultConfigs]);

  const handleRangeChange = useCallback((newRange: DateRange | undefined) => {
    setRange(newRange);
    if (newRange?.from && newRange?.to) {
      localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify({
        from: format(newRange.from, 'yyyy-MM-dd'),
        to: format(newRange.to, 'yyyy-MM-dd')
      }));
    } else {
      localStorage.removeItem(RANGE_STORAGE_KEY);
    }
  }, []);

  if (!isOpen) return null;

  const handleConfigChange = (key: ExportItemKey, updates: Partial<ExportItemConfig>) => {
    setItemConfigs(prev => {
      return prev.map(item => {
        if (item.key !== key) return item;
        const next = { ...item, ...updates } as ExportItemConfig;
        if ('listName' in updates) {
          localStorage.setItem(item.storageKey, next.listName);
        }
        if ('format' in updates) {
          localStorage.setItem(item.storageKey + '_format', next.format);
        }
        if ('checked' in updates) {
          localStorage.setItem(item.storageKey + '_checked', String(next.checked));
        }
        return next;
      });
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!range?.from || !range?.to) {
      alert('Please select a date range.');
      return;
    }

    const selectedItems = itemConfigs.filter(item => item.checked);
    if (selectedItems.length === 0) {
      alert('Please select at least one export item.');
      return;
    }

    const missingNames = selectedItems.filter(item => item.format === 'json' && !item.listName.trim());
    if (missingNames.length > 0) {
      alert('List name is required for JSON export.');
      return;
    }

    onExport(range.from, range.to, itemConfigs);
    onClose();
  };

  const dateLabel = range?.from
    ? range.to
      ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`
      : format(range.from, 'MMM dd, yyyy')
    : 'Pick a date range';

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-500">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !range?.from && 'text-gray-400'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={handleRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[auto_2fr_1fr_2fr] gap-3 text-xs font-semibold text-gray-500">
              <span></span>
              <span>Export Item</span>
              <span>Format</span>
              <span>List Name</span>
            </div>

            {itemConfigs.map(item => (
              <div key={item.key} className="grid grid-cols-[auto_2fr_1fr_2fr] gap-3 items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => handleConfigChange(item.key, { checked: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-900">{item.label}</span>

                <select
                  value={item.format}
                  onChange={(e) => handleConfigChange(item.key, { format: e.target.value as 'txt' | 'json' })}
                  className="p-2 rounded-lg border border-gray-300 text-sm"
                  disabled={!item.checked}
                >
                  <option value="txt">Text (.txt)</option>
                  <option value="json">JSON (.json)</option>
                </select>

                <input
                  type="text"
                  placeholder="e.g., Weekly Shopping"
                  value={item.listName}
                  onChange={(e) => handleConfigChange(item.key, { listName: e.target.value })}
                  className="p-2 rounded-lg border border-gray-300 text-sm"
                  disabled={!item.checked}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-2">
            <button type="submit" className="btn btn-primary flex-1">Export</button>
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
