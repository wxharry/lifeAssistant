-- 1. Create dishes table
CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  seasonings TEXT[] DEFAULT '{}',
  videoLink TEXT,
  servings INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Create schedule_items table
CREATE TABLE public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  mealType TEXT NOT NULL CHECK (mealType IN ('breakfast', 'lunch', 'dinner', 'others')),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date, mealType)
);

-- 3. Create allowed_users table (for email whitelist)
CREATE TABLE public.allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for faster queries
CREATE INDEX idx_dishes_user_id ON public.dishes(user_id);
CREATE INDEX idx_schedule_items_user_id ON public.schedule_items(user_id);
CREATE INDEX idx_schedule_items_date ON public.schedule_items(date);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for dishes
CREATE POLICY "Users can view their own dishes" ON public.dishes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dishes" ON public.dishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dishes" ON public.dishes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dishes" ON public.dishes
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for schedule_items
CREATE POLICY "Users can view their own schedule" ON public.schedule_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule" ON public.schedule_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule" ON public.schedule_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule" ON public.schedule_items
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Public read access to allowed_users (for login verification)
CREATE POLICY "Anyone can read allowed_users" ON public.allowed_users
  FOR SELECT USING (true);