import { useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Search } from 'lucide-react';
import { ScheduleItem, Dish, MealType } from '../types';
import Calendar from '../components/Calendar';
import { DraggableDish } from '../components/DishManager';
import { exportGroceryList } from '../utils/exportGroceryList';
import DateRangeModal from '../components/DateRangeModal';

interface SchedulePageProps {
  schedule: ScheduleItem[];
  dishes: Dish[];
  onRemoveFromSchedule: (day: string, mealType: MealType, dishIndex: number) => void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => void;
}

export default function SchedulePage({ schedule, dishes, onRemoveFromSchedule, onUpdateServings }: SchedulePageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calendar State
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = (start: Date, end: Date, format: 'txt' | 'json', listName?: string) => {
    exportGroceryList(schedule, dishes, start, end, format, listName);
  };

  const handleRemoveFromScheduleInternal = (day: string, mealType: MealType, dishIndex: number) => {
     onRemoveFromSchedule(day, mealType, dishIndex);
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
              <button onClick={handlePrevWeek} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}><ChevronLeft size={18} /></button>
              <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', minWidth: '200px', textAlign: 'center', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </span>
              <button onClick={handleNextWeek} className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}><ChevronRight size={18} /></button>
            </div>
          </div>
          
          <button 
            onClick={handleExportClick}
            className="btn btn-primary"
          >
            <Download size={16} style={{ marginRight: '0.5rem' }} />
            Export Grocery List
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
           <Calendar 
             schedule={schedule} 
             dishes={dishes} 
             onRemoveFromSchedule={handleRemoveFromScheduleInternal}
             onUpdateServings={onUpdateServings}
             startDate={startDate}
           />
        </div>
      </div>

      <DateRangeModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportConfirm}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </div>
  );
}
