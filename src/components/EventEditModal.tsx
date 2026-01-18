import { useEffect, useState } from 'react';
import { X, Plus, Minus, Trash2, Check } from 'lucide-react';
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
  onConfirm: (servings: number, mealType: MealType) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export default function EventEditModal({
  event,
  isOpen,
  onClose,
  onConfirm,
  onDelete
}: EventEditModalProps) {
  const [localServings, setLocalServings] = useState(1);
  const [localMealType, setLocalMealType] = useState<MealType>('others');

  // Initialize local state when modal opens or event changes
  useEffect(() => {
    if (isOpen && event) {
      setLocalServings(event.servings);
      setLocalMealType(event.mealType);
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleMealTypeChange = (newType: MealType) => {
    setLocalMealType(newType);
  };

  const handleServingsChange = (delta: number) => {
    setLocalServings(prev => Math.max(1, prev + delta));
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(localServings, localMealType);
      onClose();
    } catch (error) {
      alert('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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
                onClick={() => handleServingsChange(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Remove 1 serving"
              >
                <Minus size={18} className="text-gray-600" />
              </button>
              <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-center">
                {localServings}
              </span>
              <button
                onClick={() => handleServingsChange(1)}
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
                    localMealType === type
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
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
