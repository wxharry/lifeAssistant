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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl mb-1">Menu Library</h2>
          <p className="text-gray-500">Manage your collection of dishes</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary whitespace-nowrap">
          <Plus size={20} className="mr-2" />
          Add New Dish
        </button>
      </div>

      <div className="relative max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text" 
          placeholder="Search dishes or ingredients..." 
          className="pl-10 w-full"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredDishes.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium">No dishes found</h3>
          <p className="text-gray-500">Try adding a new dish or adjusting your search.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredDishes.map(dish => (
            <div 
              key={dish.id} 
              onClick={() => handleOpenView(dish)}
              className="card card-hover cursor-pointer relative"
            >
              <h3 className="text-lg mb-1">{dish.name}</h3>
              {dish.servings && dish.servings > 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Makes {dish.servings} serving{dish.servings !== 1 ? 's' : ''}
                </p>
              )}
              {dish.videoLink && (
              <a className="text-sm text-gray-500 mb-4 whitespace-nowrap overflow-hidden text-ellipsis block">
                {dish.videoLink}
              </a>
              )}
              <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <span className="font-semibold text-gray-900">{dish.ingredients.length}</span> ingredients
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
