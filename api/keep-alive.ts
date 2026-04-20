import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.PUBLIC_VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? process.env.PUBLIC_VITE_SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;
const keepAliveTable = process.env.KEEP_ALIVE_TABLE ?? 'allowed_users';

type KeepAliveRequest = {
  method?: string;
  headers?: {
    authorization?: string;
  };
};

type KeepAliveResponse = {
  status: (code: number) => {
    send: (body: string) => void;
    json: (body: unknown) => void;
  };
};

export default async function handler(req: KeepAliveRequest, res: KeepAliveResponse) {
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

  const { error } = await supabase.from(keepAliveTable).select('id', { head: true }).limit(1);

  if (error) {
    res.status(500).send(`Keep-alive query failed: ${error.message}`);
    return;
  }

  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}
