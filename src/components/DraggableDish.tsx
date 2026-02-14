import { useDraggable } from '@dnd-kit/core';
import { Dish } from '../types';

interface DraggableDishProps {
  dish: Dish;
}

export function DraggableDish({ dish }: DraggableDishProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dish.id,
    data: { dish }
  });

  return (
    <div
      ref={setNodeRef}
      className={`px-4 py-2 mb-2 h-10 text-sm rounded cursor-grab active:cursor-grabbing transition-opacity select-none flex items-center ${isDragging ? 'opacity-50' : ''}`}
      {...listeners}  
      {...attributes}
      style={{
        userSelect: 'none',
        backgroundColor: '#dbe4ff',
      }}
    >
      <div className="font-semibold pointer-events-none truncate">{dish.name}</div>
    </div>
  );
}
