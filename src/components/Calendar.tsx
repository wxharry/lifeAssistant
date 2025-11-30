import { useDroppable, useDraggable } from '@dnd-kit/core';
import { format, addDays } from 'date-fns';
import { Minus, Plus, X } from 'lucide-react';
import { MEAL_TYPES, ScheduleItem, Dish, MealType } from '../types';

interface ScheduledDishProps {
  dish: Dish;
  servings: number;
  idx: number;
  day: string;
  mealType: MealType;
  onRemoveDish: (day: string, mealType: MealType, dishIndex: number) => void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => void;
}

function ScheduledDish({ dish, servings, idx, day, mealType, onRemoveDish, onUpdateServings }: ScheduledDishProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `scheduled-${day}-${mealType}-${idx}`,
    data: {
      dish,
      servings,
      sourceDay: day,
      sourceMealType: mealType,
      sourceIndex: idx,
      isRescheduling: true
    }
  });

  const style: React.CSSProperties = {
    // Intentionally omit transform so element does not follow cursor
    opacity: isDragging ? 0.7 : 1,
    cursor: 'grab',
    //outline: isDragging ? '2px solid var(--color-primary)' : undefined,
    background: isDragging ? 'var(--color-surface-alt)' : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`dish-item group flex flex-col gap-1 ${isDragging ? 'dragging' : ''}`}
    >
      <div className="flex justify-between items-center">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>{dish.name}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveDish(day, mealType, idx);
          }}
          style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem' }}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
        <span>Servings:</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded px-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateServings(day, mealType, dish.id, -1);
            }}
            className="hover:text-primary p-0.5"
            disabled={servings <= 1}
            style={{ opacity: servings <= 1 ? 0.3 : 1, cursor: servings <= 1 ? 'default' : 'pointer' }}
          >
            <Minus size={10} />
          </button>
          <span style={{ minWidth: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--color-text-main)' }}>{servings}</span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateServings(day, mealType, dish.id, 1);
            }}
            className="hover:text-primary p-0.5"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MealSlotProps {
  day: string; // YYYY-MM-DD
  mealType: MealType;
  items: { dish: Dish; servings: number }[];
  onRemoveDish: (day: string, mealType: MealType, dishIndex: number) => void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => void;
}

function MealSlot({ day, mealType, items, onRemoveDish, onUpdateServings }: MealSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${day}-${mealType}`,
    data: { day, mealType }
  });

  return (
    <div ref={setNodeRef} className={`meal-slot ${isOver ? 'over' : ''}`}>
      <div className="meal-slot-label">{mealType}</div>
      <div className="flex flex-col gap-1">
        {items.map(({ dish, servings }, idx) => (
          <ScheduledDish
            key={`${dish.id}-${idx}`}
            dish={dish}
            servings={servings}
            idx={idx}
            day={day}
            mealType={mealType}
            onRemoveDish={onRemoveDish}
            onUpdateServings={onUpdateServings}
          />
        ))}
      </div>
    </div>
  );
}

interface CalendarProps {
  schedule: ScheduleItem[];
  dishes: Dish[];
  onRemoveFromSchedule: (day: string, mealType: MealType, dishIndex: number) => void;
  onUpdateServings: (day: string, mealType: MealType, dishId: string, delta: number) => void;
  startDate: Date;
}

export default function Calendar({ schedule, dishes, onRemoveFromSchedule, onUpdateServings, startDate }: CalendarProps) {
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startDate, i);
    return {
      dateObj: date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEEE'),
      dayNum: format(date, 'd')
    };
  });

  const getItemsForSlot = (day: string, mealType: MealType) => {
    const slot = schedule.find(s => s.date === day && s.mealType === mealType);
    if (!slot) return [];
    return slot.items.map(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      return dish ? { dish, servings: item.servings } : null;
    }).filter((item): item is { dish: Dish; servings: number } => !!item);
  };

  return (
    <div className="calendar-grid">
      {weekDays.map(({ dateStr, dayName, dayNum }) => {
        const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
        return (
          <div key={dateStr} className="day-column">
            <div className={`day-header ${isToday ? 'today' : ''}`}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', opacity: isToday ? 0.9 : 1 }}>{dayName}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{dayNum}</div>
            </div>
            <div className="flex flex-col gap-2">
              {MEAL_TYPES.map(mealType => (
                <MealSlot 
                  key={`${dateStr}-${mealType}`}
                  day={dateStr}
                  mealType={mealType}
                  items={getItemsForSlot(dateStr, mealType)}
                  onRemoveDish={onRemoveFromSchedule}
                  onUpdateServings={onUpdateServings}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
