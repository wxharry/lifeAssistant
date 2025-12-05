import { useState } from 'react';
import { Plus, Search, ChefHat } from 'lucide-react';
import { Dish } from '../types';
import DishModal from '../components/DishModal';

interface MenuPageProps {
  dishes: Dish[];
  onAddDish: (dish: Dish) => void;
  onUpdateDish: (dish: Dish) => void;
  onDeleteDish: (id: string) => void;
}

export default function MenuPage({ dishes, onAddDish, onUpdateDish, onDeleteDish }: MenuPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedDish, setSelectedDish] = useState<Dish | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenAdd = () => {
    setSelectedDish(undefined);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenView = (dish: Dish) => {
    setSelectedDish(dish);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleSave = (dish: Dish) => {
    if (modalMode === 'add') {
      onAddDish(dish);
    } else {
      onUpdateDish(dish);
    }
  };

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Menu Library</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your collection of dishes</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={20} style={{ marginRight: '0.5rem' }} />
          Add New Dish
        </button>
      </div>

      <div className="relative" style={{ maxWidth: '400px' }}>
        <Search className="absolute" size={20} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search dishes or ingredients..." 
          style={{ paddingLeft: '40px' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredDishes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', padding: '3rem', 
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', 
          border: '1px dashed var(--color-border)' 
        }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'var(--color-bg)', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <ChefHat size={32} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500' }}>No dishes found</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Try adding a new dish or adjusting your search.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredDishes.map(dish => (
            <div 
              key={dish.id} 
              onClick={() => handleOpenView(dish)}
              className="card card-hover"
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{dish.name}</h3>
              {dish.servings && dish.servings > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  Makes {dish.servings} serving{dish.servings !== 1 ? 's' : ''}
                </p>
              )}
              {dish.videoLink && (
              <a style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dish.videoLink}
              </a>
              )}
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.75rem', color: 'var(--color-text-muted)',
                background: 'var(--color-bg)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)'
              }}>
                <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{dish.ingredients.length}</span> ingredients
              </div>
            </div>
          ))}
        </div>
      )}

      <DishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode={modalMode}
        dish={selectedDish}
        onSave={handleSave}
        onDelete={onDeleteDish}
      />
    </div>
  );
}
