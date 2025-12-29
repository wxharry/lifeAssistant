import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDraggable } from '@dnd-kit/core';
import { Dish, Ingredient } from '../types';

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

interface DraggableDishProps {
  dish: Dish;
  onDelete?: (id: string) => void;
}

export function DraggableDish({ dish, onDelete }: DraggableDishProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dish.id,
    data: { dish }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`cursor-grab ${isDragging ? 'opacity-70 outline outline-2 outline-blue-600' : ''}`}
      {...listeners} 
      {...attributes}
    >
      <DishListItem dish={dish} onDelete={onDelete} />
    </div>
  );
}

interface DishManagerProps {
  dishes: Dish[];
  onAddDish: (dish: Dish) => void;
  onDeleteDish: (id: string) => void;
  hideAddButton?: boolean;
}

export default function DishManager({ dishes, onAddDish, onDeleteDish, hideAddButton }: DishManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDish, setNewDish] = useState<Omit<Dish, 'id'>>({
    name: '',
    seasonings: [],
    videoLink: '',
    ingredients: [],
    servings: 1
  });
  const [ingredientInput, setIngredientInput] = useState<Omit<Ingredient, 'id'>>({ name: '', amount: '', unit: '' });
  const [seasoningInput, setSeasoningInput] = useState('');

  const handleAddIngredient = () => {
    if (!ingredientInput.name) return;
    setNewDish(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...ingredientInput, id: uuidv4() } as Ingredient]
    }));
    setIngredientInput({ name: '', amount: '', unit: '' });
  };

  const handleAddSeasoning = () => {
    if (!seasoningInput) return;
    setNewDish(prev => ({
      ...prev,
      seasonings: [...(prev.seasonings || []), seasoningInput]
    }));
    setSeasoningInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.name) return;
    onAddDish({ ...newDish, id: uuidv4(), servings: newDish.servings || 1 });
    setNewDish({ name: '', seasonings: [], videoLink: '', ingredients: [], servings: 1 });
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {!hideAddButton && !isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="btn btn-primary w-full"
        >
          + Add New Dish
        </button>
      ) : !hideAddButton && isAdding ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-gray-100 p-3 rounded-lg border border-gray-300">
          <input
            type="text"
            placeholder="Dish Name"
            value={newDish.name}
            onChange={e => setNewDish({...newDish, name: e.target.value})}
            autoFocus
          />
          
          <div className="flex gap-2">
             <input
              type="text"
              placeholder="Add Seasoning"
              value={seasoningInput}
              onChange={e => setSeasoningInput(e.target.value)}
              className="flex-1 text-xs"
            />
            <button type="button" onClick={handleAddSeasoning} className="btn btn-secondary px-2 py-1 text-xs">+</button>
          </div>
          {newDish.seasonings && newDish.seasonings.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {newDish.seasonings.map((s, idx) => (
                <span key={idx} className="text-[0.7rem] bg-white border border-gray-300 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => setNewDish(prev => ({...prev, seasonings: prev.seasonings?.filter((_, i) => i !== idx)}))} className="border-none bg-transparent cursor-pointer p-0">&times;</button>
                </span>
              ))}
            </div>
          )}

          <input
            type="url"
            placeholder="Video Link"
            value={newDish.videoLink}
            onChange={e => setNewDish({...newDish, videoLink: e.target.value})}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Servings (this recipe makes)</label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={newDish.servings || 1}
              onChange={e => setNewDish({...newDish, servings: parseInt(e.target.value) || 1})}
              className="text-xs"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500">Ingredients</p>
            <div className="flex gap-2">
              <input 
                placeholder="Name" 
                className="flex-1 text-xs"
                value={ingredientInput.name}
                onChange={e => setIngredientInput({...ingredientInput, name: e.target.value})}
              />
              <input 
                placeholder="Qty" 
                className="w-12 text-xs"
                value={ingredientInput.amount}
                onChange={e => setIngredientInput({...ingredientInput, amount: e.target.value})}
              />
              <input 
                placeholder="Unit" 
                className="w-12 text-xs"
                value={ingredientInput.unit}
                onChange={e => setIngredientInput({...ingredientInput, unit: e.target.value})}
              />
              <button type="button" onClick={handleAddIngredient} className="btn btn-secondary px-2 py-1 text-xs">+</button>
            </div>
            <ul className="text-xs flex flex-col gap-1">
              {newDish.ingredients.map(ing => (
                <li key={ing.id} className="flex justify-between text-gray-500">
                  <span>{ing.amount} {ing.unit} {ing.name}</span>
                  <button 
                    type="button"
                    onClick={() => setNewDish(prev => ({...prev, ingredients: prev.ingredients.filter(i => i.id !== ing.id)}))}
                    className="text-red-600 bg-transparent border-none cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn btn-primary flex-1 text-xs">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-ghost text-xs">Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
        {dishes.map(dish => (
          <DraggableDish key={dish.id} dish={dish} onDelete={onDeleteDish} />
        ))}
      </div>
    </div>
  );
}
