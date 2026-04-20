import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_VITE_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  if (cronSecret) {
    const authorization = req.headers?.authorization;

    if (authorization !== `Bearer ${cronSecret}`) {
      res.status(401).send('Unauthorized');
      return;
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).send('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('allowed_users').select('id', { head: true, count: 'exact' });

  if (error) {
    res.status(500).send(`Keep-alive query failed: ${error.message}`);
    return;
  }

  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}
