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
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: '500' }}>{dish.name}</h3>
          {dish.servings && dish.servings > 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              Makes {dish.servings} serving{dish.servings !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {onDelete && (
          <button 
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
            onClick={() => onDelete(dish.id)}
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger"
            title="Delete Dish"
          >
            &times;
          </button>
        )}
      </div>
      {dish.seasonings && dish.seasonings.length > 0 && (
        <p style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.25rem', fontSize: '0.75rem' }}>
          {dish.seasonings.join(', ')}
        </p>
      )}
      {dish.ingredients.length > 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          {dish.ingredients.map(ingredient => ingredient.name).join(', ')}
        </p>
      )}
    </div>
  );
}

interface DraggableDishProps {
  dish: Dish;
  onDelete: (id: string) => void;
}

function DraggableDish({ dish, onDelete }: DraggableDishProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dish.id,
    data: { dish }
  });

  const style: React.CSSProperties = {
    // No transform so list item stays put; just style feedback
    opacity: isDragging ? 0.7 : 1,
    outline: isDragging ? '2px solid var(--color-primary)' : undefined,
    cursor: 'grab'
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" style={{ background: 'var(--color-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
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
              style={{ flex: 1, fontSize: '0.75rem' }}
            />
            <button type="button" onClick={handleAddSeasoning} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>+</button>
          </div>
          {newDish.seasonings && newDish.seasonings.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {newDish.seasonings.map((s, idx) => (
                <span key={idx} style={{ fontSize: '0.7rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {s}
                  <button type="button" onClick={() => setNewDish(prev => ({...prev, seasonings: prev.seasonings?.filter((_, i) => i !== idx)}))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>&times;</button>
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
            <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Servings (this recipe makes)</label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={newDish.servings || 1}
              onChange={e => setNewDish({...newDish, servings: parseInt(e.target.value) || 1})}
              style={{ fontSize: '0.75rem' }}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Ingredients</p>
            <div className="flex gap-2">
              <input 
                placeholder="Name" 
                style={{ flex: 1, fontSize: '0.75rem' }}
                value={ingredientInput.name}
                onChange={e => setIngredientInput({...ingredientInput, name: e.target.value})}
              />
              <input 
                placeholder="Qty" 
                style={{ width: '48px', fontSize: '0.75rem' }}
                value={ingredientInput.amount}
                onChange={e => setIngredientInput({...ingredientInput, amount: e.target.value})}
              />
              <input 
                placeholder="Unit" 
                style={{ width: '48px', fontSize: '0.75rem' }}
                value={ingredientInput.unit}
                onChange={e => setIngredientInput({...ingredientInput, unit: e.target.value})}
              />
              <button type="button" onClick={handleAddIngredient} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>+</button>
            </div>
            <ul style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {newDish.ingredients.map(ing => (
                <li key={ing.id} className="flex justify-between" style={{ color: 'var(--color-text-muted)' }}>
                  <span>{ing.amount} {ing.unit} {ing.name}</span>
                  <button 
                    type="button"
                    onClick={() => setNewDish(prev => ({...prev, ingredients: prev.ingredients.filter(i => i.id !== ing.id)}))}
                    style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>Cancel</button>
          </div>
        </form>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {dishes.map(dish => (
          <DraggableDish key={dish.id} dish={dish} onDelete={onDeleteDish} />
        ))}
      </div>
    </div>
  );
}
