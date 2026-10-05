ALTER TABLE public.game_info ADD COLUMN apply_channel_id TEXT;
CREATE TABLE public.devs (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.devs TO anon, authenticated;
GRANT ALL ON public.devs TO service_role;
ALTER TABLE public.devs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read devs" ON public.devs FOR SELECT TO anon, authenticated USING (true);