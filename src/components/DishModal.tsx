import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Trash2, Video } from 'lucide-react';
import { Dish, Ingredient } from '../types';

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'add';
  dish?: Dish;
  onSave: (dish: Dish) => void;
  onDelete?: (id: string) => void;
}

export default function DishModal({ isOpen, onClose, mode: initialMode, dish, onSave, onDelete }: DishModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState<Omit<Dish, 'id'>>({
    name: '',
    seasonings: [],
    videoLink: '',
    ingredients: []
  });
  const [ingredientInput, setIngredientInput] = useState<Omit<Ingredient, 'id'>>({ name: '', amount: '', unit: '' });
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [seasoningInput, setSeasoningInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (dish) {
        setFormData({
          name: dish.name,
          seasonings: dish.seasonings || [],
          videoLink: dish.videoLink || '',
          ingredients: dish.ingredients
        });
      } else {
        setFormData({ name: '', seasonings: [], videoLink: '', ingredients: [] });
      }
      setIngredientInput({ name: '', amount: '', unit: '' });
      setEditingIngredientId(null);
      setSeasoningInput('');
    }
  }, [isOpen, initialMode, dish]);

  if (!isOpen) return null;

  const handleAddOrUpdateIngredient = () => {
    if (!ingredientInput.name) return;
    
    if (editingIngredientId) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.map(ing => 
          ing.id === editingIngredientId 
            ? { ...ingredientInput, id: editingIngredientId } as Ingredient 
            : ing
        )
      }));
      setEditingIngredientId(null);
    } else {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { ...ingredientInput, id: uuidv4() } as Ingredient]
      }));
    }
    setIngredientInput({ name: '', amount: '', unit: '' });
  };

  const handleEditIngredient = (ing: Ingredient) => {
    setIngredientInput({ name: ing.name, amount: ing.amount, unit: ing.unit });
    setEditingIngredientId(ing.id);
  };

  const handleRemoveIngredient = (id: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.id !== id)
    }));
    if (editingIngredientId === id) {
      setEditingIngredientId(null);
      setIngredientInput({ name: '', amount: '', unit: '' });
    }
  };

  const handleAddSeasoning = () => {
    if (!seasoningInput) return;
    setFormData(prev => ({
      ...prev,
      seasonings: [...(prev.seasonings || []), seasoningInput]
    }));
    setSeasoningInput('');
  };

  const handleRemoveSeasoning = (index: number) => {
    setFormData(prev => ({
      ...prev,
      seasonings: prev.seasonings?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    onSave({
      ...formData,
      id: dish?.id || uuidv4()
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.125rem' }}>
            {mode === 'add' ? 'Add New Dish' : mode === 'edit' ? 'Edit Dish' : dish?.name}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {mode === 'view' ? (
            <div className="flex flex-col gap-4">
              {dish?.seasonings && dish.seasonings.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Seasonings</span>
                  <div className="flex flex-wrap gap-1">
                    {dish.seasonings.map((s, idx) => (
                      <span key={idx} style={{ fontSize: '0.875rem', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {dish?.videoLink && (
                <a 
                  href={dish.videoLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                  style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  <Video size={16} />
                  Watch Tutorial
                </a>
              )}
              
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Ingredients</h3>
                <ul className="flex flex-col gap-2">
                  {dish?.ingredients.map(ing => (
                    <li key={ing.id} className="flex justify-between" style={{ fontSize: '0.875rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>
                      <span>{ing.name}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{ing.amount} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => setMode('edit')} 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Edit
                </button>
                {onDelete && dish && (
                  <button 
                    onClick={() => { onDelete(dish.id); onClose(); }} 
                    className="btn btn-danger"
                    style={{ padding: '0.5rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Dish Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Spaghetti Bolognese"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Seasonings</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={seasoningInput}
                    onChange={e => setSeasoningInput(e.target.value)}
                    placeholder="Add seasoning"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddSeasoning} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.seasonings?.map((s, idx) => (
                    <span key={idx} style={{ fontSize: '0.875rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {s}
                      <button type="button" onClick={() => handleRemoveSeasoning(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Video Link</label>
                <input
                  type="url"
                  value={formData.videoLink}
                  onChange={e => setFormData({...formData, videoLink: e.target.value})}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>Ingredients</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Name" 
                    style={{ flex: 1 }}
                    value={ingredientInput.name}
                    onChange={e => setIngredientInput({...ingredientInput, name: e.target.value})}
                  />
                  <input 
                    placeholder="Qty" 
                    style={{ width: '60px' }}
                    value={ingredientInput.amount}
                    onChange={e => setIngredientInput({...ingredientInput, amount: e.target.value})}
                  />
                  <input 
                    placeholder="Unit" 
                    style={{ width: '60px' }}
                    value={ingredientInput.unit}
                    onChange={e => setIngredientInput({...ingredientInput, unit: e.target.value})}
                  />
                  <button type="button" onClick={handleAddOrUpdateIngredient} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    {editingIngredientId ? 'Update' : <Plus size={16} />}
                  </button>
                </div>
                
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '0.5rem', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {formData.ingredients.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.5rem' }}>No ingredients added</p>
                  )}
                  {formData.ingredients.map(ing => (
                    <div 
                      key={ing.id} 
                      className={`flex justify-between items-center ${editingIngredientId === ing.id ? 'bg-blue-50 border-blue-200' : ''}`}
                      style={{ fontSize: '0.875rem', background: editingIngredientId === ing.id ? 'var(--color-surface)' : 'var(--color-surface)', padding: '0.375rem', borderRadius: 'var(--radius-sm)', border: editingIngredientId === ing.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', cursor: 'pointer' }}
                      onClick={() => handleEditIngredient(ing)}
                    >
                      <span>{ing.amount} {ing.unit} {ing.name}</span>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveIngredient(ing.id); }}
                        style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Dish</button>
                <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
