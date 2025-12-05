import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ScheduleItem, Dish } from '../types';

interface GroceryItem {
  title: string;
  notes: string;
}

interface ItemWithDishes {
  name: string;
  amount: number;
  unit: string;
  dishes: Record<string, number>; // { dishName: servings }
}

export function exportGroceryList(
  schedule: ScheduleItem[],
  dishes: Dish[],
  startDate: Date,
  endDate: Date,
  exportFormat: 'txt' | 'json' = 'txt',
  listName?: string
) {
  const items: Record<string, ItemWithDishes> = {};

  // Filter schedule for the selected range
  const rangeSchedule = schedule.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate >= startDate && slotDate <= endDate;
  });

  rangeSchedule.forEach(slot => {
    slot.items.forEach(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      if (dish) {
        dish.ingredients.forEach(ing => {
          const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;
          if (!items[key]) {
            items[key] = {
              name: ing.name,
              amount: 0,
              unit: ing.unit,
              dishes: {}
            };
          }
          const val = typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount;
          if (!isNaN(val)) {
            items[key].amount += val * item.servings;
          }
          // Track which dishes use this ingredient and servings
          if (!items[key].dishes[dish.name]) {
            items[key].dishes[dish.name] = 0;
          }
          items[key].dishes[dish.name] += item.servings;
        });
      }
    });
  });

  const sortedItems = Object.values(items).sort((a, b) => a.name.localeCompare(b.name));

  if (exportFormat === 'json') {
    exportAsJSON(sortedItems, listName || 'Grocery List');
  } else {
    exportAsText(sortedItems, startDate, endDate);
  }
}

function exportAsText(items: ItemWithDishes[], startDate: Date, endDate: Date) {
  let content = `Grocery List\n`;
  content += `Range: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}\n`;
  content += `Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}\n\n`;
  content += `----------------------------------------\n\n`;

  if (items.length === 0) {
    content += "No items found for this period.\n";
  } else {
    items.forEach(item => {
      const amountStr = item.amount > 0 ? `${Number(item.amount.toFixed(2))} ${item.unit}` : '';
      const dishesStr = Object.entries(item.dishes)
        .map(([name, servings]) => `${name}(${servings})`)
        .join(', ');
      content += `[ ] ${amountStr} ${item.name} - ${dishesStr}\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `grocery-list-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.txt`);
}

function exportAsJSON(items: ItemWithDishes[], listName: string) {
  const groceryItems: GroceryItem[] = items.map(item => ({
    title: item.name,
    notes: `${item.amount > 0 ? Number(item.amount.toFixed(2)) + ' ' + item.unit : item.unit} - ${Object.entries(item.dishes)
      .map(([name, servings]) => `${name}(${servings})`)
      .join(', ')}`
  }));

  const jsonData = {
    listName,
    items: groceryItems
  };

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `grocery-list-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`);
}
