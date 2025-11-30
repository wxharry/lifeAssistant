import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import Layout from './components/Layout';
import MenuPage from './pages/MenuPage';
import SchedulePage from './pages/SchedulePage';
import { DishListItem } from './components/DishManager';
import { Dish, ScheduleItem } from './types';

// Initial Data (Mock)
const INITIAL_DISHES: Dish[] = [
  { 
    id: '1', 
    name: 'Pancakes', 
    seasonings: ['Salt', 'Sugar', 'Vanilla Extract'],
    ingredients: [
      { id: 'i1', name: 'Flour', amount: '2', unit: 'cups' },
      { id: 'i2', name: 'Milk', amount: '1.5', unit: 'cups' },
      { id: 'i3', name: 'Eggs', amount: '2', unit: 'pcs' }
    ] 
  },
  { 
    id: '2', 
    name: 'Spaghetti Bolognese', 
    seasonings: ['Salt', 'Pepper', 'Oregano', 'Basil'],
    ingredients: [
      { id: 'i4', name: 'Spaghetti', amount: '500', unit: 'g' },
      { id: 'i5', name: 'Ground Beef', amount: '300', unit: 'g' },
      { id: 'i6', name: 'Tomato Sauce', amount: '1', unit: 'can' }
    ] 
  },
  { 
    id: '3', 
    name: 'Caesar Salad', 
    seasonings: ['Salt', 'Pepper'],
    ingredients: [
      { id: 'i7', name: 'Romaine Lettuce', amount: '1', unit: 'head' },
      { id: 'i8', name: 'Croutons', amount: '1', unit: 'cup' },
      { id: 'i9', name: 'Parmesan', amount: '0.5', unit: 'cup' }
    ] 
  }
];

function App() {
  const [dishes, setDishes] = useState<Dish[]>(() => {
    const saved = localStorage.getItem('dishes');
    return saved ? JSON.parse(saved) : INITIAL_DISHES;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      // Simple check to see if it's the old format (has dishIds)
      if (parsed.length > 0 && parsed[0].dishIds) {
        return []; // Reset if old format
      }
      return parsed;
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dishes', JSON.stringify(dishes));
  }, [dishes]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [schedule]);

  const handleAddDish = (dish: Dish) => {
    setDishes([...dishes, dish]);
  };

  const handleUpdateDish = (updatedDish: Dish) => {
    setDishes(dishes.map(d => d.id === updatedDish.id ? updatedDish : d));
  };

  const handleDeleteDish = (id: string) => {
    setDishes(dishes.filter(d => d.id !== id));
    // Also remove from schedule
    setSchedule(schedule.map(slot => ({
      ...slot,
      items: slot.items.filter(item => item.dishId !== id)
    })));
  };

  const handleUpdateServings = (day: string, mealType: any, dishId: string, delta: number) => {
    setSchedule(prev => prev.map(slot => {
      if (slot.date === day && slot.mealType === mealType) {
        return {
          ...slot,
          items: slot.items.map(item => {
            if (item.dishId === dishId) {
              const newServings = Math.max(1, item.servings + delta);
              return { ...item, servings: newServings };
            }
            return item;
          })
        };
      }
      return slot;
    }));
  };

  const handleRemoveFromSchedule = (day: string, mealType: any, dishIndex: number) => {
    setSchedule(prev => prev.map(slot => {
      if (slot.date === day && slot.mealType === mealType) {
        const newItems = [...slot.items];
        newItems.splice(dishIndex, 1);
        return { ...slot, items: newItems };
      }
      return slot;
    }));
  };

  const [activeDish, setActiveDish] = useState<Dish | null>(null);

  const handleDragStart = (event: any) => {
    if (event.active.data.current?.dish) {
      setActiveDish(event.active.data.current.dish);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDish(null);

    if (!over || !active.data.current || !over.data.current) return;

    const data: any = active.data.current; // broaden typing for dynamic dnd-kit data payload
    const dish = data.dish as Dish;
    const { day, mealType } = over.data.current as any;
    const isRescheduling = !!data.isRescheduling;
    const servings = data.servings || 1;

    setSchedule(prev => {
      let working = [...prev];

      if (isRescheduling) {
        const { sourceDay, sourceMealType, sourceIndex } = data;
        if (sourceDay === day && sourceMealType === mealType) {
          return working; // dropped on same slot, no change
        }
        const srcIdx = working.findIndex(s => s.date === sourceDay && s.mealType === sourceMealType);
        if (srcIdx >= 0) {
          const srcSlot = { ...working[srcIdx] };
            const newItems = [...srcSlot.items];
            newItems.splice(sourceIndex, 1);
            srcSlot.items = newItems;
            if (srcSlot.items.length === 0) {
              working.splice(srcIdx, 1); // remove empty slot
            } else {
              working[srcIdx] = srcSlot;
            }
        }
      }

      // Destination slot logic
      const destIdx = working.findIndex(s => s.date === day && s.mealType === mealType);
      if (destIdx >= 0) {
        const destSlot = { ...working[destIdx] };
        const existingItemIndex = destSlot.items.findIndex(i => i.dishId === dish.id);
        if (existingItemIndex >= 0 && !isRescheduling) {
          // adding from menu duplicates -> increment servings
          destSlot.items[existingItemIndex] = {
            ...destSlot.items[existingItemIndex],
            servings: destSlot.items[existingItemIndex].servings + 1
          };
        } else {
          destSlot.items = [...destSlot.items, { dishId: dish.id, servings }];
        }
        working[destIdx] = destSlot;
      } else {
        working.push({
          id: uuidv4(),
          date: day,
          mealType: mealType as any,
          items: [{ dishId: dish.id, servings }]
        });
      }

      return working;
    });
  };

  return (
    <BrowserRouter>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <SchedulePage 
                schedule={schedule} 
                dishes={dishes} 
                onRemoveFromSchedule={handleRemoveFromSchedule}
                onUpdateServings={handleUpdateServings}
              />
            } />
            <Route path="menu" element={
              <MenuPage 
                dishes={dishes} 
                onAddDish={handleAddDish} 
                onUpdateDish={handleUpdateDish}
                onDeleteDish={handleDeleteDish} 
              />
            } />
          </Route>
        </Routes>
        <DragOverlay>
          {activeDish ? (
            <div style={{ width: '250px', opacity: 0.8 }}>
               <DishListItem dish={activeDish} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </BrowserRouter>
  );
}

export default App;
