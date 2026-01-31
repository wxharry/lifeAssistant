import { useCallback, useMemo, useRef, useState } from 'react';
import { format, startOfWeek, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useDroppable } from '@dnd-kit/core';
import { ScheduleItem, Dish, MealType, MEAL_TYPES } from '../types';
import EventEditModal from './EventEditModal';
import { DraggableEvent } from './DraggableEvent';

// Meal time mapping
const MEAL_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '12:00',
  dinner: '18:00',
  others: '15:00'
};

// Color mapping for meal types
export const MEAL_COLORS: Record<MealType, string> = {
  breakfast: '#fef3c7',
  lunch: '#dbeafe',
  dinner: '#fce7f3',
  others: '#e0e7ff'
};

export const MEAL_DARK_COLORS: Record<MealType,   string> = {
  breakfast: '#fbbf24',
  lunch: '#60a5fa',
  dinner: '#f472b6',
  others: '#818cf8'
};

export interface ScheduleEvent {
  day: string;
  mealType: MealType;
  dishId: string;
  dishIndex: number;
  servings: number;
  dish: Dish;
}

interface SchedulerXCalendarProps {
  schedule: ScheduleItem[];
  dishes: Dish[];
  onRemoveFromSchedule: (day: string, mealType: MealType, dishIndex: number) => Promise<void> | void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => Promise<void> | void;
  onChangeMealType?: (day: string, fromMealType: MealType, toMealType: MealType, dishId: string, newServings?: number) => Promise<void> | void;
  currentDate: Date;
}

// Droppable day cell
function DroppableDay({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: { day: dateStr }
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[150px] border border-gray-200 p-2 relative transition-colors ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      {children}
    </div>
  );
}

export default function SchedulerXCalendar({
  schedule,
  dishes,
  onRemoveFromSchedule,
  onUpdateServings,
  onChangeMealType,
  currentDate
}: SchedulerXCalendarProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate calendar grid
  const { weekDays, weeks } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Start from the beginning of the week containing the first day of the month
    const calendarStart = startOfWeek(start, { locale: enUS });
    
    // End at the end of the week containing the last day of the month
    let calendarEnd = endOfMonth(currentDate);
    const endDayOfWeek = getDay(calendarEnd);
    if (endDayOfWeek !== 0) {
      // Add remaining days to complete the week
      calendarEnd = addDays(calendarEnd, 7 - endDayOfWeek);
    }
    
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Group days into weeks
    const groupedWeeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      groupedWeeks.push(allDays.slice(i, i + 7));
    }
    
    return { weekDays, weeks: groupedWeeks };
  }, [currentDate]);

  // Map schedule items by date for quick lookup
  const scheduleByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    schedule.forEach(scheduleItem => {
      scheduleItem.items.forEach((item, idx) => {
        const dish = dishes.find(d => d.id === item.dishId);
        if (!dish) return;
        
        const event: ScheduleEvent = {
          day: scheduleItem.date,
          mealType: scheduleItem.mealType,
          dishId: item.dishId,
          dishIndex: idx,
          servings: item.servings,
          dish
        };
        
        if (!map.has(scheduleItem.date)) {
          map.set(scheduleItem.date, []);
        }
        map.get(scheduleItem.date)!.push(event);
      });
    });
    return map;
  }, [schedule, dishes]);

  // Handle event double-click to open modal
  const handleEventDoubleClick = useCallback((event: ScheduleEvent) => {
    console.log('Event double-clicked:', event);
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  // Handle modal confirm - save all changes
  const handleModalConfirm = useCallback(async (newServings: number, newMealType: MealType) => {
    if (!selectedEvent) return;

    const servingsChanged = newServings !== selectedEvent.servings;
    const mealTypeChanged = newMealType !== selectedEvent.mealType;

    // If both changed, handle in one operation
    if (servingsChanged && mealTypeChanged && onChangeMealType) {
      await onChangeMealType(selectedEvent.day, selectedEvent.mealType, newMealType, selectedEvent.dishId, newServings);
    } else {
      // Update servings if only servings changed
      if (servingsChanged) {
        const delta = newServings - selectedEvent.servings;
        await onUpdateServings(selectedEvent.day, selectedEvent.mealType, selectedEvent.dishId, delta);
      }

      // Update meal type if only meal type changed
      if (mealTypeChanged && onChangeMealType) {
        await onChangeMealType(selectedEvent.day, selectedEvent.mealType, newMealType, selectedEvent.dishId);
      }
    }
  }, [selectedEvent, onUpdateServings, onChangeMealType]);

  // Handle modal delete
  const handleModalDelete = useCallback(() => {
    if (selectedEvent) {
      console.log('[SchedulerXCalendar] handleModalDelete called', { day: selectedEvent.day, mealType: selectedEvent.mealType, dishIndex: selectedEvent.dishIndex });
      onRemoveFromSchedule(selectedEvent.day, selectedEvent.mealType, selectedEvent.dishIndex);
      setSelectedEvent(null);
      setIsModalOpen(false);
    }
  }, [selectedEvent, onRemoveFromSchedule]);

  return (
    <div className="scheduler-x-wrapper" ref={calendarRef}>
      <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <strong>Tip:</strong> Drag dishes from the sidebar onto a day to add them. Double-click events to edit them.
      </div>
      <div className="calendar-container border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Month header */}
        <div className="bg-gray-100 p-4 text-center font-bold text-lg border-b border-gray-200">
          {format(currentDate, 'MMMM yyyy')}
        </div>
        
        {/* Day of week headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm text-gray-700">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7">
              {week.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, currentDate);
                const events = scheduleByDate.get(dateStr) || [];
                
                return (
                  <DroppableDay key={dateStr} dateStr={dateStr}>
                    <div className={`h-full ${!isCurrentMonth ? 'bg-gray-50' : ''}`}>
                      <div className={`text-xs font-semibold mb-1 ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="flex flex-col gap-1">
                        {events.map((event, idx) => (
                          <DraggableEvent
                            key={`${event.day}-${event.mealType}-${idx}`}
                            event={event}
                            onDoubleClick={() => handleEventDoubleClick(event)}
                          />
                        ))}
                      </div>
                    </div>
                  </DroppableDay>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Event Edit Modal */}
      <EventEditModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        onDelete={handleModalDelete}
      />
    </div>
  );
}
