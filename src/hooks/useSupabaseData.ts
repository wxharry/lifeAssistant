import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dish, ScheduleItem } from '../types';

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
        const { data, error } = await supabase
          .from('dishes')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setDishes(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dishes');
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`dishes_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setDishes(prev => prev.filter(d => d.id !== payload.old.id));
        } else {
          setDishes(prev => {
            const idx = prev.findIndex(d => d.id === payload.new.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = payload.new;
              return updated;
            }
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const addDish = async (dish: Dish) => {
    if (!userId) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('dishes')
      .insert([{ ...dish, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    setDishes(prev => [...prev, data]);
    return data;
  };

  const updateDish = async (dish: Dish) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('dishes')
      .update(dish)
      .eq('id', dish.id)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const deleteDish = async (dishId: string) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId)
      .eq('user_id', userId);

    if (error) throw error;
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
        const { data, error } = await supabase
          .from('schedule_items')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setSchedule(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`schedule_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_items', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setSchedule(prev => prev.filter(s => s.id !== payload.old.id));
        } else {
          setSchedule(prev => {
            const idx = prev.findIndex(s => s.id === payload.new.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = payload.new;
              return updated;
            }
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const addScheduleItem = async (item: ScheduleItem) => {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('schedule_items')
      .insert([{ ...item, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    setSchedule(prev => [...prev, data]);
    return data;
  };

  const updateScheduleItem = async (item: ScheduleItem) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('schedule_items')
      .update(item)
      .eq('id', item.id)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const deleteScheduleItem = async (itemId: string) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const upsertScheduleItem = async (item: ScheduleItem) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('schedule_items')
      .upsert({ ...item, user_id: userId })
      .eq('id', item.id);

    if (error) throw error;
  };

  return { schedule, loading, error, addScheduleItem, updateScheduleItem, deleteScheduleItem, upsertScheduleItem };
}
