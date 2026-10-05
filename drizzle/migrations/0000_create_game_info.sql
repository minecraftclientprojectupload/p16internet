CREATE TABLE public.game_info (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title TEXT NOT NULL DEFAULT 'Project 16',
  status TEXT NOT NULL DEFAULT 'In development',
  game_link TEXT,
  description TEXT NOT NULL DEFAULT 'More info coming soon.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_info TO anon, authenticated;
GRANT ALL ON public.game_info TO service_role;
ALTER TABLE public.game_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read game info" ON public.game_info FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.game_info (id) VALUES (1);