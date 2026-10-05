import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Dev = { discord_id: string; username: string; avatar_url: string | null; contact: string | null };

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getDevs = createServerFn({ method: "GET" }).handler(async (): Promise<Dev[]> => {
  try {
    const db = await adminClient();
    const { data, error } = await db
      .from("devs")
      .select("discord_id, username, avatar_url, contact")
      .order("created_at");
    if (error) {
      console.error(error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error(e);
    return [];
  }
});

const applySchema = z.object({
  discord: z.string().trim().min(2).max(40),
  age: z.number().int().min(5).max(99),
  why: z.string().trim().min(10).max(1000),
  experience: z.string().trim().min(2).max(1000),
});

export const applyTester = createServerFn({ method: "POST" })
  .inputValidator((d) => applySchema.parse(d))
  .handler(async ({ data }) => {
    const db = await adminClient();
    const { data: info } = await db.from("game_info").select("apply_channel_id").eq("id", 1).maybeSingle();
    const channel = info?.apply_channel_id;
    if (!channel) return { ok: false, error: "Applications aren't open yet." };

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const discordKey = process.env["DISCORD_API_KEY"];
    if (!lovableKey || !discordKey) return { ok: false, error: "Applications aren't open yet." };

    const clean = (s: string) => s.replace(/@/g, "@\u200b");
    const res = await fetch(`https://connector-gateway.lovable.dev/discord/channels/${channel}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": discordKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "New tester application",
            color: 0x8b5cf6,
            fields: [
              { name: "Discord", value: clean(data.discord) },
              { name: "Age", value: String(data.age) },
              { name: "Why do you want to test?", value: clean(data.why) },
              { name: "Previous experience", value: clean(data.experience) },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`Discord post failed [${res.status}]: ${await res.text()}`);
      return { ok: false, error: "Couldn't send your application, try again later." };
    }
    return { ok: true, error: null };
  });
