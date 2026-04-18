import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ScheduleItem, Dish, MealType } from '../types';

interface ScheduledItem {
  title: string;
  notes: string;
  dueDate?: string;
}

const mealTypeMap: Record<MealType, string> = {
  breakfast: '早饭',
  lunch: '午饭',
  dinner: '晚饭',
  others: '其他'
};

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getDayOfWeekChinese(date: Date): string {
  return dayNames[date.getDay()];
}

function getCookReminderDate(slotDate: string, cookStartTime?: string): string | undefined {
  if (!cookStartTime) return undefined;

  const [hours, minutes] = cookStartTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;

  const date = new Date(slotDate);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function exportScheduledDishes(
  schedule: ScheduleItem[],
  dishes: Dish[],
  startDate: Date,
  endDate: Date,
  exportFormat: 'txt' | 'json' = 'txt',
  listName?: string
) {
  const items: ScheduledItem[] = [];

  // Filter schedule for the selected range
  // Compare as YYYY-MM-DD strings to avoid UTC vs. local time mismatches
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');
  const rangeSchedule = schedule.filter(slot => {
    return slot.date >= startStr && slot.date <= endStr;
  });

  // Sort by date and meal type
  rangeSchedule.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // Define meal order
    const mealOrder: Record<MealType, number> = { breakfast: 0, lunch: 1, others: 2, dinner: 3 };
    return mealOrder[a.mealType] - mealOrder[b.mealType];
  });

  rangeSchedule.forEach(slot => {
    slot.items.forEach(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      if (dish) {
        const slotDate = new Date(slot.date);
        const dayOfWeek = getDayOfWeekChinese(slotDate);
        const mealType = mealTypeMap[slot.mealType] || slot.mealType;
        const notes = `${dayOfWeek}${mealType}`;
        
        // Add dueDate for lunch and dinner
        let dueDate: string | undefined;
        if (slot.mealType === 'lunch') {
          const lunchTime = new Date(slot.date);
          lunchTime.setHours(11, 0, 0, 0);
          dueDate = lunchTime.toISOString();
        } else if (slot.mealType === 'dinner') {
          const dinnerTime = new Date(slot.date);
          dinnerTime.setHours(17, 0, 0, 0);
          dueDate = dinnerTime.toISOString();
        }
        
        items.push({
          title: dish.name,
          notes: notes,
          ...(dueDate && { dueDate })
        });

        const cookReminderDate = getCookReminderDate(slot.date, slot.cookStartTime);
        if (cookReminderDate) {
          items.push({
            title: `Start cooking ${dish.name}`,
            notes: `${notes} (cook reminder)`,
            dueDate: cookReminderDate
          });
        }
      }
    });
  });

  if (exportFormat === 'json') {
    exportAsJSON(items, listName || 'Scheduled Dishes');
  } else {
    exportAsText(items, startDate, endDate);
  }
}

function exportAsText(items: ScheduledItem[], startDate: Date, endDate: Date) {
  let content = `Scheduled Dishes\n`;
  content += `Range: ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}\n`;
  content += `Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}\n\n`;
  content += `----------------------------------------\n\n`;

  if (items.length === 0) {
    content += "No scheduled dishes found for this period.\n";
  } else {
    items.forEach(item => {
      content += `[ ] ${item.title} (${item.notes})\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `scheduled-dishes-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.txt`);
}

function exportAsJSON(items: ScheduledItem[], listName: string) {
  const jsonData = {
    listName,
    items
  };

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `scheduled-dishes-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`);
}
