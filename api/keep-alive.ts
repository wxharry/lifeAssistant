import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
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

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).send('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
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
