import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ScheduleItem, Dish } from '../types';

export function exportGroceryList(schedule: ScheduleItem[], dishes: Dish[], startDate: Date, endDate: Date) {
  const items: Record<string, { name: string; amount: number; unit: string }> = {};

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
              unit: ing.unit
            };
          }
          const val = typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount;
          if (!isNaN(val)) {
            items[key].amount += val * item.servings;
          }
        });
      }
    });
  });

  const sortedItems = Object.values(items).sort((a, b) => a.name.localeCompare(b.name));

  let content = `Grocery List\n`;
  content += `Range: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}\n`;
  content += `Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}\n\n`;
  content += `----------------------------------------\n\n`;

  if (sortedItems.length === 0) {
    content += "No items found for this period.\n";
  } else {
    sortedItems.forEach(item => {
      const amountStr = item.amount > 0 ? `${Number(item.amount.toFixed(2))} ${item.unit}` : '';
      content += `[ ] ${amountStr} ${item.name}\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `grocery-list-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.txt`);
}
