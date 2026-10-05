import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type GameInfo = {
  title: string;
  status: string;
  game_link: string | null;
  description: string;
  updated_at: string;
};

export const getGameInfo = createServerFn({ method: "GET" }).handler(async (): Promise<GameInfo> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  const client = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("game_info")
    .select("title, status, game_link, description, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error(error);
    return {
      title: "Project 16",
      status: "In development",
      game_link: null,
      description: "More info coming soon.",
      updated_at: new Date().toISOString(),
    };
  }
  if (!data) {
    return {
      title: "Project 16",
      status: "In development",
      game_link: null,
      description: "More info coming soon.",
      updated_at: new Date().toISOString(),
    };
  }
  return data;
});
