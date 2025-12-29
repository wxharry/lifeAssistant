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
    ingredients: [],
    servings: dish?.servings || 1
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
          ingredients: dish.ingredients,
          servings: dish.servings || 1
        });
      } else {
        setFormData({ name: '', seasonings: [], videoLink: '', ingredients: [], servings: 1 });
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg">
            {mode === 'add' ? 'Add New Dish' : mode === 'edit' ? 'Edit Dish' : dish?.name}
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {mode === 'view' ? (
            <div className="flex flex-col gap-4">
              {dish?.servings && dish.servings > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Makes</span>
                  <span className="text-sm text-gray-500">
                    {dish.servings} serving{dish.servings !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {dish?.seasonings && dish.seasonings.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Seasonings</span>
                  <div className="flex flex-wrap gap-1">
                    {dish.seasonings.map((s, idx) => (
                      <span key={idx} className="text-sm bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
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
                  className="flex items-center gap-2 text-sm text-blue-600 no-underline hover:text-blue-700"
                >
                  <Video size={16} />
                  Watch Tutorial
                </a>
              )}
              
              <div>
                <h3 className="text-sm font-semibold mb-2">Ingredients</h3>
                <ul className="flex flex-col gap-2">
                  {dish?.ingredients.map(ing => (
                    <li key={ing.id} className="flex justify-between text-sm border-b border-gray-200 pb-1">
                      <span>{ing.name}</span>
                      <span className="text-gray-500">{ing.amount} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setMode('edit')} 
                  className="btn btn-primary flex-1"
                >
                  Edit
                </button>
                {onDelete && dish && (
                  <button 
                    onClick={() => { onDelete(dish.id); onClose(); }} 
                    className="btn btn-danger p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Dish Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Spaghetti Bolognese"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Servings (this recipe makes)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.servings || 1}
                  onChange={e => setFormData({...formData, servings: parseInt(e.target.value) || 1})}
                  placeholder="1"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Seasonings</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={seasoningInput}
                    onChange={e => setSeasoningInput(e.target.value)}
                    placeholder="Add seasoning"
                    className="flex-1"
                  />
                  <button type="button" onClick={handleAddSeasoning} className="btn btn-secondary p-2">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.seasonings?.map((s, idx) => (
                    <span key={idx} className="text-sm bg-white border border-gray-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => handleRemoveSeasoning(idx)} className="border-none bg-transparent cursor-pointer p-0 flex">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Video Link</label>
                <input
                  type="url"
                  value={formData.videoLink}
                  onChange={e => setFormData({...formData, videoLink: e.target.value})}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500">Ingredients</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Name" 
                    className="flex-1"
                    value={ingredientInput.name}
                    onChange={e => setIngredientInput({...ingredientInput, name: e.target.value})}
                  />
                  <input 
                    placeholder="Qty" 
                    className="w-[60px]"
                    value={ingredientInput.amount}
                    onChange={e => setIngredientInput({...ingredientInput, amount: e.target.value})}
                  />
                  <input 
                    placeholder="Unit" 
                    className="w-[60px]"
                    value={ingredientInput.unit}
                    onChange={e => setIngredientInput({...ingredientInput, unit: e.target.value})}
                  />
                  <button type="button" onClick={handleAddOrUpdateIngredient} className="btn btn-secondary p-2">
                    {editingIngredientId ? 'Update' : <Plus size={16} />}
                  </button>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-2 max-h-[150px] overflow-y-auto flex flex-col gap-1">
                  {formData.ingredients.length === 0 && (
                    <p className="text-xs text-gray-500 text-center p-2">No ingredients added</p>
                  )}
                  {formData.ingredients.map(ing => (
                    <div 
                      key={ing.id} 
                      className={`flex justify-between items-center text-sm bg-white p-1.5 rounded border cursor-pointer ${editingIngredientId === ing.id ? 'bg-blue-50 border-blue-600' : 'border-gray-300'}`}
                      onClick={() => handleEditIngredient(ing)}
                    >
                      <span>{ing.amount} {ing.unit} {ing.name}</span>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveIngredient(ing.id); }}
                        className="text-gray-500 bg-transparent border-none p-1 cursor-pointer hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn btn-primary flex-1">Save Dish</button>
                <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
