import { useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Search, HardDrive, Upload } from 'lucide-react';
import { ScheduleItem, Dish, MealType } from '../types';
import Calendar from '../components/Calendar';
import { DraggableDish } from '../components/DishManager';
import { exportGroceryList } from '../utils/exportGroceryList';
import { exportScheduledDishes } from '../utils/exportScheduledDishes';
import { exportBackup, importBackup, BackupData } from '../utils/exportBackup';
import ExportModal from '../components/ExportModal';

interface SchedulePageProps {
  schedule: ScheduleItem[];
  dishes: Dish[];
  onRemoveFromSchedule: (day: string, mealType: MealType, dishIndex: number) => void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => void;
  onChangeMealType: (day: string, fromMealType: MealType, toMealType: MealType, dishId: string) => void;
  onRestoreBackup: (backup: BackupData) => Promise<void>;
}

export default function SchedulePage({ schedule, dishes, onRemoveFromSchedule, onUpdateServings, onChangeMealType, onRestoreBackup }: SchedulePageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGroceryExportOpen, setIsGroceryExportOpen] = useState(false);
  const [isScheduleExportOpen, setIsScheduleExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calendar State
  const startDate = viewMode === 'week'
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : startOfMonth(currentDate);
  const endDate = viewMode === 'week'
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : endOfMonth(currentDate);

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrev = () => setCurrentDate(viewMode === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(viewMode === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));

  const handleGroceryExportClick = () => {
    setIsGroceryExportOpen(true);
  };

  const handleScheduleExportClick = () => {
    setIsScheduleExportOpen(true);
  };

  const handleGroceryExportConfirm = (start: Date, end: Date, format: 'txt' | 'json', listName?: string) => {
    exportGroceryList(schedule, dishes, start, end, format, listName);
  };

  const handleScheduleExportConfirm = (start: Date, end: Date, format: 'txt' | 'json', listName?: string) => {
    exportScheduledDishes(schedule, dishes, start, end, format, listName);
  };

  const handleRemoveFromScheduleInternal = (day: string, mealType: MealType, dishIndex: number) => {
     onRemoveFromSchedule(day, mealType, dishIndex);
  };

  const handleBackupExport = () => {
    exportBackup(dishes, schedule);
  };

  const handleBackupImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = await importBackup(file);
      await onRestoreBackup(backup);
    } catch (error) {
      alert(`Error importing backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Reset the input
    event.target.value = '';
  };

  return (
    <div className="schedule-layout">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="flex justify-between items-center" style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          {isSidebarOpen && <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Dishes</h3>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn btn-ghost"
            style={{ padding: '0.25rem' }}
          >
            {isSidebarOpen ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
          </button>
        </div>
        
        {isSidebarOpen && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column'}}>
            <div className="relative">
              <Search className="absolute" size={16} style={{ left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  paddingLeft: '32px',
                  width: '100%',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredDishes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  No dishes found
                </div>
              ) : (
                filteredDishes.map(dish => (
                  <DraggableDish key={dish.id} dish={dish} />
                ))
              )}
            </div>
          </div>
        )}
        {/* Vertical text when closed */}
        {!isSidebarOpen && (
          <div className="flex items-center justify-center" style={{ flex: 1 }}>
             <span style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontWeight: '500', letterSpacing: '0.05em' }}>
               Drag Dishes
             </span>
          </div>
        )}
      </div>

      {/* Main Calendar */}
      <div className="calendar-container">
        <div className="flex justify-between items-center" style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(248, 249, 250, 0.5)' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
              <button onClick={handlePrev} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}><ChevronLeft size={18} /></button>
              <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', minWidth: '200px', textAlign: 'center', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                {viewMode === 'week' ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}` : format(startDate, 'MMMM yyyy')}
              </span>
              <button onClick={handleNext} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="flex gap-2 viewmode-toggle" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.125rem' }}>
            <button
              onClick={() => setViewMode('week')}
              className={`btn btn-ghost viewmode-btn${viewMode === 'week' ? ' selected' : ''}`}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: viewMode === 'week' ? 'bold' : 'normal', color: viewMode === 'week' ? 'var(--color-primary)' : 'var(--color-text-main)', boxShadow: viewMode === 'week' ? '0 0 0 2px var(--color-primary-light)' : 'none', background: viewMode === 'week' ? 'var(--color-primary-light)' : 'var(--color-surface)' }}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`btn btn-ghost viewmode-btn${viewMode === 'month' ? ' selected' : ''}`}
              style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: viewMode === 'month' ? 'bold' : 'normal', color: viewMode === 'month' ? 'var(--color-primary)' : 'var(--color-text-main)', boxShadow: viewMode === 'month' ? '0 0 0 2px var(--color-primary-light)' : 'none', background: viewMode === 'month' ? 'var(--color-primary-light)' : 'var(--color-surface)' }}
            >
              Month
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleGroceryExportClick}
              className="btn btn-primary"
            >
              <Download size={16} style={{ marginRight: '0.5rem' }} />
              Export Groceries
            </button>
            <button 
              onClick={handleScheduleExportClick}
              className="btn btn-primary"
            >
              <Download size={16} style={{ marginRight: '0.5rem' }} />
              Export Schedule
            </button>
            <button 
              onClick={handleBackupExport}
              className="btn btn-secondary"
              title="Export all dishes and schedules as a backup file"
            >
              <HardDrive size={16} style={{ marginRight: '0.5rem' }} />
              Backup
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={16} />
              Restore
              <input 
                type="file" 
                accept=".json" 
                onChange={handleBackupImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
           <Calendar 
             schedule={schedule} 
             dishes={dishes} 
             onRemoveFromSchedule={handleRemoveFromScheduleInternal}
             onUpdateServings={onUpdateServings}
             onChangeMealType={onChangeMealType}
             startDate={startDate}
             viewMode={viewMode}
           />
        </div>
      </div>

      <ExportModal 
        isOpen={isGroceryExportOpen}
        onClose={() => setIsGroceryExportOpen(false)}
        onExport={handleGroceryExportConfirm}
        initialStartDate={startDate}
        initialEndDate={endDate}
        title="Export Grocery List"
        storageKey="groceryListName"
      />

      <ExportModal 
        isOpen={isScheduleExportOpen}
        onClose={() => setIsScheduleExportOpen(false)}
        onExport={handleScheduleExportConfirm}
        initialStartDate={startDate}
        initialEndDate={endDate}
        title="Export Scheduled Dishes"
        storageKey="scheduledDishesListName"
      />
    </div>
  );
}
