import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import Layout from './components/Layout';
import MenuPage from './pages/MenuPage';
import SchedulePage from './pages/SchedulePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { Dish, MealType } from './types';
import { SupabaseProvider, useSupabaseAuth } from './contexts/SupabaseContext';
import { useDishes, useSchedule } from './hooks/useSupabaseData';
import { BackupData } from './utils/exportBackup';
import { useState } from 'react';
import { MEAL_COLORS, MEAL_DARK_COLORS } from './components/SchedulerXCalendar';

// Initial Data (Mock) - kept for fallback/demo purposes
const INITIAL_DISHES: Dish[] = [
  { 
    id: '1', 
    name: 'Pancakes', 
    servings: 1,
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
    servings: 1,
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
    servings: 1,
    seasonings: ['Salt', 'Pepper'],
    ingredients: [
      { id: 'i7', name: 'Romaine Lettuce', amount: '1', unit: 'head' },
      { id: 'i8', name: 'Croutons', amount: '1', unit: 'cup' },
      { id: 'i9', name: 'Parmesan', amount: '0.5', unit: 'cup' }
    ] 
  }
];

function AppContent() {
  const { user, loading } = useSupabaseAuth();
  const { dishes, addDish, updateDish, deleteDish } = useDishes(user?.id);
  const { schedule, addScheduleItem, updateScheduleItem, deleteScheduleItem, upsertScheduleItem } = useSchedule(user?.id);

  type ActiveDrag =
    | { type: 'dish'; dish: Dish }
    | { type: 'event'; dish: Dish; mealType: MealType; servings: number };

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  // Configure sensors for drag detection - require 5px movement before drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const handleAddDish = async (dish: Dish) => {
    try {
      await addDish(dish);
    } catch (error) {
      alert('Failed to add dish: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateDish = async (updatedDish: Dish) => {
    try {
      await updateDish(updatedDish);
    } catch (error) {
      alert('Failed to update dish: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteDish = async (id: string) => {
    try {
      await deleteDish(id);
      // Remove from schedule as well
      const itemsToDelete = schedule.flatMap(slot => 
        slot.items.filter(item => item.dishId === id).map(item => slot.id)
      );
      for (const scheduleId of itemsToDelete) {
        const scheduleItem = schedule.find(s => s.id === scheduleId);
        if (scheduleItem) {
          await deleteScheduleItem(scheduleItem.id);
        }
      }
    } catch (error) {
      alert('Failed to delete dish: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateServings = async (day: string, mealType: MealType, dishId: string, delta: number) => {
    try {
      const scheduleItem = schedule.find(s => s.date === day && s.mealType === mealType);
      if (scheduleItem) {
        const updated = {
          ...scheduleItem,
          items: scheduleItem.items.map(item => {
            if (item.dishId === dishId) {
              return { ...item, servings: Math.max(1, item.servings + delta) };
            }
            return item;
          })
        };
        await updateScheduleItem(updated);
      }
    } catch (error) {
      alert('Failed to update servings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRemoveFromSchedule = async (day: string, mealType: MealType, dishIndex: number) => {
    try {
      const scheduleItem = schedule.find(s => s.date === day && s.mealType === mealType);
      if (scheduleItem) {
        const newItems = [...scheduleItem.items];
        newItems.splice(dishIndex, 1);
        
        if (newItems.length === 0) {
          await deleteScheduleItem(scheduleItem.id);
        } else {
          await updateScheduleItem({ ...scheduleItem, items: newItems });
        }
      }
    } catch (error) {
      alert('Failed to remove dish: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleChangeMealType = async (day: string, fromMealType: MealType, toMealType: MealType, dishId: string) => {
    if (fromMealType === toMealType) return;

    try {
      const fromSlot = schedule.find(s => s.date === day && s.mealType === fromMealType);
      if (!fromSlot) return;

      const itemIdx = fromSlot.items.findIndex(i => i.dishId === dishId);
      if (itemIdx === -1) return;

      const item = fromSlot.items[itemIdx];
      const newFromItems = [...fromSlot.items];
      newFromItems.splice(itemIdx, 1);

      // Update/delete from slot
      if (newFromItems.length === 0) {
        await deleteScheduleItem(fromSlot.id);
      } else {
        await updateScheduleItem({ ...fromSlot, items: newFromItems });
      }

      // Add to destination slot
      const toSlot = schedule.find(s => s.date === day && s.mealType === toMealType);
      if (toSlot) {
        await updateScheduleItem({ ...toSlot, items: [...toSlot.items, item] });
      } else {
        await addScheduleItem({
          id: uuidv4(),
          date: day,
          mealType: toMealType,
          items: [item]
        });
      }
    } catch (error) {
      alert('Failed to change meal type: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRestoreBackup = async (backup: BackupData) => {
    try {
      let dishesAdded = 0;
      let dishesSkipped = 0;
      let scheduleAdded = 0;
      let scheduleSkipped = 0;

      // Add all dishes from backup, skip if already exists
      for (const dish of backup.dishes) {
        const existingDish = dishes.find(d => d.id === dish.id);
        if (!existingDish) {
          try {
            await addDish(dish);
            dishesAdded++;
          } catch (error) {
            console.error(`Failed to add dish ${dish.name}:`, error);
            dishesSkipped++;
          }
        } else {
          dishesSkipped++;
        }
      }

      // Add all schedule items from backup, skip if already exists
      for (const scheduleItem of backup.schedule) {
        const existingItem = schedule.find(s => s.id === scheduleItem.id);
        if (!existingItem) {
          try {
            await addScheduleItem(scheduleItem);
            scheduleAdded++;
          } catch (error) {
            console.error(`Failed to add schedule item:`, error);
            scheduleSkipped++;
          }
        } else {
          scheduleSkipped++;
        }
      }

      alert(
        `Restore complete!\n` +
        `Dishes: ${dishesAdded} added, ${dishesSkipped} skipped\n` +
        `Schedule: ${scheduleAdded} added, ${scheduleSkipped} skipped`
      );
    } catch (error) {
      console.error(error);
      alert('Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDragStart = (event: any) => {
    const data = event.active.data.current;
    if (!data?.dish) {
      setActiveDrag(null);
      return;
    }

    if (data.isRescheduling) {
      setActiveDrag({
        type: 'event',
        dish: data.dish as Dish,
        mealType: data.sourceMealType as MealType,
        servings: data.servings || 1,
      });
      return;
    }

    setActiveDrag({ type: 'dish', dish: data.dish as Dish });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over || !active.data.current || !over.data.current) return;

    const data: any = active.data.current;
    const dish = data.dish as Dish;
    const { day } = over.data.current as any;
    if (!day) return;
    
    const servings = data.servings || 1;
    const isRescheduling = !!data.isRescheduling;
    
    // Preserve original mealType when rescheduling; for new adds default to 'others'
    const mealType: MealType = isRescheduling 
      ? (data.sourceMealType as MealType)
      : 'others';

    try {
      if (isRescheduling) {
        const { sourceDay, sourceMealType, sourceIndex } = data;
        if (sourceDay === day && sourceMealType === mealType) {
          return;
        }

        const srcSlot = schedule.find(s => s.date === sourceDay && s.mealType === sourceMealType);
        if (srcSlot) {
          const newItems = [...srcSlot.items];
          newItems.splice(sourceIndex, 1);

          if (newItems.length === 0) {
            await deleteScheduleItem(srcSlot.id);
          } else {
            await updateScheduleItem({ ...srcSlot, items: newItems });
          }
        }
      }

      const destSlot = schedule.find(s => s.date === day && s.mealType === mealType);
      if (destSlot) {
        await updateScheduleItem({
          ...destSlot,
          items: [...destSlot.items, { dishId: dish.id, servings }]
        });
      } else {
        await addScheduleItem({
          id: uuidv4(),
          date: day,
          mealType,
          items: [{ dishId: dish.id, servings }]
        });
      }
    } catch (error) {
      alert('Failed to update schedule: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const renderDragOverlay = () => {
    if (!activeDrag) return null;

    if (activeDrag.type === 'dish') {
      return (
        <div style={{ width: '240px', opacity: 0.9, backgroundColor: '#dbe4ff', }} className="rounded border border-gray-200 bg-blue px-3 py-2 shadow-md">
          <div className="font-semibold pointer-events-none">{activeDrag.dish.name}</div>
        </div>
      );
    }

    return (
      <div
        style={{
          width: '220px',
          backgroundColor: MEAL_COLORS[activeDrag.mealType],
          borderLeft: `4px solid ${MEAL_DARK_COLORS[activeDrag.mealType]}`,
          opacity: 0.95,
        }}
        className="rounded px-3 py-2 shadow-md"
      >
        <div className="font-semibold text-sm text-gray-800">{activeDrag.dish.name}</div>
        <div className="text-xs text-gray-600">{activeDrag.mealType} • {activeDrag.servings}x</div>
      </div>
    );
  };

  return (
    <BrowserRouter>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <SchedulePage 
                schedule={schedule} 
                dishes={dishes} 
                onRemoveFromSchedule={handleRemoveFromSchedule}
                onUpdateServings={handleUpdateServings}
                onChangeMealType={handleChangeMealType}
                onRestoreBackup={handleRestoreBackup}
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
        <DragOverlay>{renderDragOverlay()}</DragOverlay>
      </DndContext>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}
