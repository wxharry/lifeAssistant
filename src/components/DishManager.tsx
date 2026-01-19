import { Dish } from '../types';

export function DishListItem({ dish, onDelete, style }: { dish: Dish, onDelete?: (id: string) => void, style?: React.CSSProperties }) {
  return (
    <div 
      style={style}
      className="dish-item group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium">{dish.name}</h3>
          {dish.servings && dish.servings > 0 && (
            <p className="text-gray-500 text-xs mt-0.5">
              Makes {dish.servings} serving{dish.servings !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {onDelete && (
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(dish.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 bg-transparent border-none cursor-pointer text-gray-500"
            title="Delete Dish"
          >
            &times;
          </button>
        )}
      </div>
      {dish.seasonings && dish.seasonings.length > 0 && (
        <p className="text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis mt-1 text-xs">
          {dish.seasonings.join(', ')}
        </p>
      )}
      {dish.ingredients.length > 0 && (
        <p className="text-sm text-gray-500 mt-1">
          {dish.ingredients.map(ingredient => ingredient.name).join(', ')}
        </p>
      )}
    </div>
  );
}
