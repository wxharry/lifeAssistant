ALTER TABLE public.schedule_items
ADD COLUMN IF NOT EXISTS cookStartTime TEXT;
