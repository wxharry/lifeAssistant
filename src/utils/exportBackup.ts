import { Dish, ScheduleItem } from '../types';

export interface BackupData {
  version: string;
  exportedAt: string;
  dishes: Dish[];
  schedule: ScheduleItem[];
}

export function exportBackup(dishes: Dish[], schedule: ScheduleItem[]): void {
  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    dishes,
    schedule
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  link.href = url;
  link.download = `lifeAssistant-backup-${timestamp}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as BackupData;
        
        if (!data.version || !Array.isArray(data.dishes) || !Array.isArray(data.schedule)) {
          throw new Error('Invalid backup file format');
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse backup file: ' + (error instanceof Error ? error.message : 'Unknown error')));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
