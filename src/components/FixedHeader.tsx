import { ChevronLeft, ChevronRight, Download, HardDrive, Upload } from 'lucide-react';

interface FixedHeaderProps {
  monthDisplay: string;
  onPrev: () => void;
  onNext: () => void;
  onGroceryExport: () => void;
  onScheduleExport: () => void;
  onBackupExport: () => void;
  onBackupImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FixedHeader({
  monthDisplay,
  onPrev,
  onNext,
  onGroceryExport,
  onScheduleExport,
  onBackupExport,
  onBackupImport
}: FixedHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 p-3 md:p-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <button onClick={onPrev} className="btn btn-ghost p-2 rounded-l-lg rounded-r-none">
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-sm font-medium min-w-[200px] text-center border-x border-gray-200">
              {monthDisplay}
            </span>
            <button onClick={onNext} className="btn btn-ghost p-2 rounded-r-lg rounded-l-none">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onGroceryExport}
            className="btn btn-primary"
          >
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export Groceries</span>
            <span className="sm:hidden">Groceries</span>
          </button>
          <button 
            onClick={onScheduleExport}
            className="btn btn-primary"
          >
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export Schedule</span>
            <span className="sm:hidden">Schedule</span>
          </button>
          <button 
            onClick={onBackupExport}
            className="btn btn-secondary"
            title="Export all dishes and schedules as a backup file"
          >
            <HardDrive size={16} className="mr-2" />
            Backup
          </button>
          <label className="btn btn-secondary cursor-pointer">
            <Upload size={16} className="mr-2" />
            Restore
            <input 
              type="file" 
              accept=".json" 
              onChange={onBackupImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
