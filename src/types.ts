export interface Ingredient {
  id: string;
  name: string;
  amount: number | string; // Allow string for now as input might be loose, but ideally number
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  ingredients: Ingredient[];
  seasonings?: string[];
  videoLink?: string;
  servings?: number; // Number of servings this dish makes (ingredient base)
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'others';

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  items: { dishId: string; servings: number }[];
}

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'others'];
