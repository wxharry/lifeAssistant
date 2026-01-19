import { useDraggable } from '@dnd-kit/core';
import { ScheduleEvent, MEAL_COLORS, MEAL_DARK_COLORS } from './SchedulerXCalendar';

// Draggable event item
export function DraggableEvent({ event, onDoubleClick }: { event: ScheduleEvent; onDoubleClick: () => void; }) {
  const { setNodeRef, isDragging, attributes, listeners } = useDraggable({
    id: `event-${event.day}-${event.mealType}-${event.dishId}-${event.dishIndex}`,
    data: {
      dish: event.dish,
      servings: event.servings,
      isRescheduling: true,
      sourceDay: event.day,
      sourceMealType: event.mealType,
      sourceIndex: event.dishIndex,
      dishId: event.dishId
    }
  });

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDoubleClick();
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={handleDoubleClick}
      className={`px-2 py-1 mb-1 text-xs rounded cursor-grab active:cursor-grabbing transition-opacity select-none ${isDragging ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: MEAL_COLORS[event.mealType],
        borderLeft: `3px solid ${MEAL_DARK_COLORS[event.mealType]}`,
        userSelect: 'none',
      }}
    >
      <div className="font-semibold pointer-events-none">{event.dish.name}</div>
      <div className="text-gray-600 pointer-events-none">{event.mealType} • {event.servings}x</div>
    </div>
  );
}
