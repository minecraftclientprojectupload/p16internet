import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/discord/interactions")({
  server: {
    handlers: {
      POST: async () => {
        return new Response("Discord integration disabled - using local JSON files", { status: 503 });
      },
    },
  },
});
