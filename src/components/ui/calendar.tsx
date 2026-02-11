import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        caption: 'flex justify-between pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-gray-500 rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day: 'h-8 w-8 p-0 font-normal rounded-md hover:bg-gray-100',
        day_selected: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white',
        day_today: 'bg-gray-100 text-gray-900',
        day_outside: 'text-gray-400 opacity-50',
        day_disabled: 'text-gray-400 opacity-50',
        day_range_middle: 'bg-blue-50 text-gray-900',
        day_range_end: 'bg-blue-600 text-white',
        day_range_start: 'bg-blue-600 text-white',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
