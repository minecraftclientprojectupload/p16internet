import { createFileRoute } from "@tanstack/react-router";

// Discord application public key (public value, safe in code).
const DISCORD_PUBLIC_KEY = "c57d1175c9170aeccf96402b29a4dae4e3f526290c8e63d1e67989463ba03279";
const MANAGE_GUILD = 0x20n;

function hexToBytes(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function verify(signature: string, timestamp: string, body: string) {
  if (!/^[0-9a-f]+$/i.test(signature) || signature.length !== 128) return false;
  const key = await crypto.subtle.importKey("raw", hexToBytes(DISCORD_PUBLIC_KEY), { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify("Ed25519", key, hexToBytes(signature), new TextEncoder().encode(timestamp + body));
}

function reply(content: string) {
  return Response.json({ type: 4, data: { content, flags: 64 } });
}

export const Route = createFileRoute("/api/public/discord/interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-signature-ed25519") ?? "";
        const timestamp = request.headers.get("x-signature-timestamp") ?? "";
        const body = await request.text();
        if (!(await verify(signature, timestamp, body).catch(() => false))) {
          return new Response("Invalid signature", { status: 401 });
        }

        const interaction = JSON.parse(body);
        if (interaction.type === 1) return Response.json({ type: 1 });

        const cmd = interaction.type === 2 ? interaction.data?.name : null;
        if (cmd === "adddev" || cmd === "removedev" || cmd === "setapplychannel") {
          const perms = BigInt(interaction.member?.permissions ?? "0");
          if (!interaction.guild_id || (perms & MANAGE_GUILD) === 0n) {
            return reply("You need Manage Server permission in the server to use this.");
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (cmd === "setapplychannel") {
            const { error } = await supabaseAdmin
              .from("game_info")
              .update({ apply_channel_id: String(interaction.channel_id) })
              .eq("id", 1);
            if (error) return reply("Couldn't save, try again.");
            return reply("Tester applications will now be posted in this channel.");
          }

          const options: { name: string; value: string }[] = interaction.data.options ?? [];
          const userId = options.find((o) => o.name === "user")?.value;
          if (!userId || !/^\d{5,25}$/.test(userId)) return reply("Pick a user.");

          if (cmd === "removedev") {
            await supabaseAdmin.from("devs").delete().eq("discord_id", userId);
            return reply("Developer removed from the website.");
          }

          const user = interaction.data.resolved?.users?.[userId];
          const username: string = (user?.global_name || user?.username || "Developer").slice(0, 80);
          const avatar_url = user?.avatar
            ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(userId) >> 22n) % 6n)}.png`;
          const contact = options.find((o) => o.name === "contact")?.value?.trim().slice(0, 200);
          const row: { discord_id: string; username: string; avatar_url: string; contact?: string } = {
            discord_id: userId,
            username,
            avatar_url,
          };
          if (contact) row.contact = contact;
          const { error } = await supabaseAdmin.from("devs").upsert(row);
          if (error) {
            console.error("devs upsert failed", error);
            return reply("Couldn't save, try again.");
          }
          return reply(`${username} is now listed as a developer.`);
        }

        if (cmd === "setgame") {
          const perms = BigInt(interaction.member?.permissions ?? "0");
          if (!interaction.guild_id || (perms & MANAGE_GUILD) === 0n) {
            return reply("You need Manage Server permission in the server to use this.");
          }

          const opts: { status?: string; title?: string; about?: string; link?: string } = {};
          for (const o of interaction.data.options ?? []) (opts as Record<string, string>)[o.name] = String(o.value).trim();

          const update: { status?: string; title?: string; description?: string; game_link?: string } = {};
          if (opts.status) update.status = opts.status.slice(0, 60);
          if (opts.title) update.title = opts.title.slice(0, 80);
          if (opts.about) update.description = opts.about.slice(0, 1500);
          if (opts.link) {
            try {
              const u = new URL(opts.link);
              if (u.protocol !== "https:" || !/(^|\.)roblox\.com$/.test(u.hostname)) throw new Error();
              update.game_link = u.toString();
            } catch {
              return reply("Link must be an https roblox.com link.");
            }
          }
          if (Object.keys(update).length === 0) return reply("Give at least one option to change.");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("game_info")
            .update({ ...update, updated_at: new Date().toISOString() })
            .eq("id", 1);
          if (error) {
            console.error("game_info update failed", error);
            return reply("Couldn't save, try again.");
          }
          return reply(`Website updated: ${Object.keys(update).join(", ")}`);
        }

        return reply("Unknown command.");
      },
    },
  },
});
