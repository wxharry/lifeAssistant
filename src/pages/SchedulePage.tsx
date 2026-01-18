import { useState, useCallback } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Search } from 'lucide-react';
import { ScheduleItem, Dish, MealType } from '../types';
import SchedulerXCalendar from '../components/SchedulerXCalendar';
import FixedHeader from '../components/FixedHeader';
import { DraggableDish } from '../components/DishManager';
import { exportGroceryList } from '../utils/exportGroceryList';
import { exportScheduledDishes } from '../utils/exportScheduledDishes';
import { exportBackup, importBackup, BackupData } from '../utils/exportBackup';
import ExportModal from '../components/ExportModal';

interface SchedulePageProps {
  schedule: ScheduleItem[];
  dishes: Dish[];
  onRemoveFromSchedule: (day: string, mealType: MealType, dishIndex: number) => Promise<void> | void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => Promise<void> | void;
  onChangeMealType: (day: string, fromMealType: MealType, toMealType: MealType, dishId: string) => Promise<void> | void;
  onRestoreBackup: (backup: BackupData) => Promise<void>;
}

export default function SchedulePage({ schedule, dishes, onRemoveFromSchedule, onUpdateServings, onChangeMealType, onRestoreBackup }: SchedulePageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGroceryExportOpen, setIsGroceryExportOpen] = useState(false);
  const [isScheduleExportOpen, setIsScheduleExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrev = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));

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

  const monthDisplay = format(currentDate, 'yyyy-MM-dd');

  const handleRemoveFromScheduleInternal = useCallback((day: string, mealType: MealType, dishIndex: number) => {
    onRemoveFromSchedule(day, mealType, dishIndex);
  }, [onRemoveFromSchedule]);

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
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          {isSidebarOpen && <h3 className="text-sm font-bold">Dishes</h3>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn btn-ghost p-1"
          >
            {isSidebarOpen ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
          </button>
        </div>
        
        {isSidebarOpen && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {filteredDishes.length === 0 ? (
                <div className="text-center p-4 text-gray-500 text-xs">
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
          <div className="flex items-center justify-center flex-1">
             <span className="rotate-[-90deg] whitespace-nowrap text-gray-600 font-medium tracking-wider">
               Drag Dishes
             </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <FixedHeader 
          monthDisplay={monthDisplay}
          onPrev={handlePrev}
          onNext={handleNext}
          onGroceryExport={handleGroceryExportClick}
          onScheduleExport={handleScheduleExportClick}
          onBackupExport={handleBackupExport}
          onBackupImport={handleBackupImport}
        />

        <div className="flex-1 overflow-auto p-4">
           <SchedulerXCalendar 
             schedule={schedule} 
             dishes={dishes} 
             onRemoveFromSchedule={handleRemoveFromScheduleInternal}
             onUpdateServings={onUpdateServings}
             onChangeMealType={onChangeMealType}
             currentDate={currentDate}
           />
        </div>
      </div>

      <ExportModal 
        isOpen={isGroceryExportOpen}
        onClose={() => setIsGroceryExportOpen(false)}
        onExport={handleGroceryExportConfirm}
        initialStartDate={currentDate}
        initialEndDate={currentDate}
        title="Export Grocery List"
        storageKey="groceryListName"
      />

      <ExportModal 
        isOpen={isScheduleExportOpen}
        onClose={() => setIsScheduleExportOpen(false)}
        onExport={handleScheduleExportConfirm}
        initialStartDate={currentDate}
        initialEndDate={currentDate}
        title="Export Scheduled Dishes"
        storageKey="scheduledDishesListName"
      />
    </div>
  );
}
