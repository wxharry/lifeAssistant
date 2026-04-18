import { useEffect, useState } from 'react';
import { Dish, ScheduleItem } from '../types';
import {
  deleteDishForUser,
  deleteScheduleItemForUser,
  listDishesByUser,
  listScheduleByUser,
  upsertDishForUser,
  upsertScheduleItemForUser,
} from '../lib/sqlite';

export function useDishes(userId: string | undefined) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDishes([]);
      setLoading(false);
      return;
    }

    const fetchDishes = async () => {
      try {
        setLoading(true);
        const data = await listDishesByUser(userId);
        setDishes(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dishes');
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [userId]);

  const addDish = async (dish: Dish) => {
    if (!userId) throw new Error('User not authenticated');

    const data = await upsertDishForUser(userId, dish);
    setDishes(prev => [...prev, data]);
    return data;
  };

  const updateDish = async (dish: Dish) => {
    if (!userId) throw new Error('User not authenticated');

    await upsertDishForUser(userId, dish);
    setDishes(prev => prev.map(existing => (existing.id === dish.id ? dish : existing)));
  };

  const deleteDish = async (dishId: string) => {
    if (!userId) throw new Error('User not authenticated');

    await deleteDishForUser(userId, dishId);
    setDishes(prev => prev.filter(existing => existing.id !== dishId));
  };

  return { dishes, loading, error, addDish, updateDish, deleteDish };
}

export function useSchedule(userId: string | undefined) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSchedule([]);
      setLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await listScheduleByUser(userId);
        setSchedule(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [userId]);

  const addScheduleItem = async (item: ScheduleItem) => {
    if (!userId) throw new Error('User not authenticated');

    const data = await upsertScheduleItemForUser(userId, item);
    setSchedule(prev => [...prev, data]);
    return data;
  };

  const updateScheduleItem = async (item: ScheduleItem) => {
    if (!userId) throw new Error('User not authenticated');

    await upsertScheduleItemForUser(userId, item);
    
    // Update local state
    setSchedule(prev => {
      const idx = prev.findIndex(s => s.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      }
      return prev;
    });
  };

  const deleteScheduleItem = async (itemId: string) => {
    if (!userId) throw new Error('User not authenticated');

    await deleteScheduleItemForUser(userId, itemId);
    
    // Update local state
    setSchedule(prev => prev.filter(s => s.id !== itemId));
  };

  const upsertScheduleItem = async (item: ScheduleItem) => {
    if (!userId) throw new Error('User not authenticated');

    await upsertScheduleItemForUser(userId, item);
    setSchedule(prev => {
      const idx = prev.findIndex(s => s.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      }
      return [...prev, item];
    });
  };

  return { schedule, loading, error, addScheduleItem, updateScheduleItem, deleteScheduleItem, upsertScheduleItem };
}
