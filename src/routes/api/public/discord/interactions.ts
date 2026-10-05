import { createFileRoute } from "@tanstack/react-router";

// Discord application public key (public value, safe in code).
const DISCORD_PUBLIC_KEY = "c57d1175c9170aeccf96402b29a4dae4e3f526290c8e63d1e67989463ba03279";
const MANAGE_GUILD = 0x20n;
const GITHUB_REPO = "minecraftclientprojectupload/p16internet";

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

async function updateGitHubFile(path: string, content: string, message: string) {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) return { ok: false, error: "GitHub token not configured" };

  // Get current file SHA
  const getFileRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!getFileRes.ok) return { ok: false, error: "Failed to get file" };
  const fileData = await getFileRes.json();
  const sha = fileData.sha;

  // Update file
  const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
    }),
  });

  if (!updateRes.ok) return { ok: false, error: "Failed to update file" };
  return { ok: true, error: null };
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

        if (cmd === "setgame") {
          const perms = BigInt(interaction.member?.permissions ?? "0");
          if (!interaction.guild_id || (perms & MANAGE_GUILD) === 0n) {
            return reply("You need Manage Server permission in the server to use this.");
          }

          const opts: { status?: string; title?: string; about?: string; link?: string } = {};
          for (const o of interaction.data.options ?? []) (opts as Record<string, string>)[o.name] = String(o.value).trim();

          // Read current game info
          const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/src/data/game-info.json`, {
            headers: { Accept: "application/vnd.github.v3+json" },
          });
          if (!getRes.ok) return reply("Failed to read game info");
          const fileData = await getRes.json();
          const currentContent = JSON.parse(atob(fileData.content));

          // Update fields
          if (opts.status) currentContent.status = opts.status.slice(0, 60);
          if (opts.title) currentContent.title = opts.title.slice(0, 80);
          if (opts.about) currentContent.description = opts.about.slice(0, 1500);
          if (opts.link) {
            try {
              const u = new URL(opts.link);
              if (u.protocol !== "https:" || !/(^|\.)roblox\.com$/.test(u.hostname)) throw new Error();
              currentContent.game_link = u.toString();
            } catch {
              return reply("Link must be an https roblox.com link.");
            }
          }
          currentContent.updated_at = new Date().toISOString();

          if (Object.keys(opts).length === 0) return reply("Give at least one option to change.");

          const result = await updateGitHubFile("src/data/game-info.json", JSON.stringify(currentContent, null, 2), `Update game info via Discord`);
          if (!result.ok) return reply(result.error || "Couldn't save, try again.");
          return reply(`Website updated: ${Object.keys(opts).join(", ")}`);
        }

        return reply("Unknown command.");
      },
    },
  },
});
