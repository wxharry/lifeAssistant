-- 1. Create checklist_items table for regular (non-meal) grocery reminders
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Index for faster per-user queries
CREATE INDEX idx_checklist_items_user_id ON public.checklist_items(user_id);

-- 3. Enable RLS
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can view their own checklist items" ON public.checklist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist items" ON public.checklist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist items" ON public.checklist_items
  FOR DELETE USING (auth.uid() = user_id);
