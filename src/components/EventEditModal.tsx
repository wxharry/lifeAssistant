import { useState } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { MealType, MEAL_TYPES } from '../types';

interface ScheduleEvent {
  day: string;
  mealType: MealType;
  dishId: string;
  dishIndex: number;
  servings: number;
  dish: { id: string; name: string };
}

interface EventEditModalProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateServings: (delta: number) => void;
  onChangeMealType: (newMealType: MealType) => void;
  onDelete: () => Promise<void> | void;
}

export default function EventEditModal({
  event,
  isOpen,
  onClose,
  onUpdateServings,
  onChangeMealType,
  onDelete
}: EventEditModalProps) {
  const [selectedMealType, setSelectedMealType] = useState<MealType>(event?.mealType || 'others');

  if (!isOpen || !event) return null;

  const handleMealTypeChange = (newType: MealType) => {
    setSelectedMealType(newType);
    onChangeMealType(newType);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${event.dish.name} from the schedule?`)) {
      try {
        await onDelete();
        onClose();
      } catch (error) {
        alert('Failed to delete: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{event.dish.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Servings */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Servings</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdateServings(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Remove 1 serving"
              >
                <Minus size={18} className="text-gray-600" />
              </button>
              <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-center">
                {event.servings}x
              </span>
              <button
                onClick={() => onUpdateServings(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add 1 serving"
              >
                <Plus size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Meal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleMealTypeChange(type)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedMealType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Info */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Date</label>
            <p className="text-gray-600 text-sm">{event.day}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
