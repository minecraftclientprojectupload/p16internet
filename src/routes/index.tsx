import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getGameInfo } from "@/lib/game-info.functions";
import { getDevs } from "@/lib/community.functions";
import { DevsSection, ApplySection } from "@/components/CommunitySections";

const devsQuery = queryOptions({ queryKey: ["devs"], queryFn: () => getDevs() });

const gameInfoQuery = queryOptions({
  queryKey: ["game-info"],
  queryFn: () => getGameInfo(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project 16 — Roblox Game" },
      { name: "description", content: "Project 16: live game status, info and the link to play on Roblox." },
      { property: "og:title", content: "Project 16 — Roblox Game" },
      { property: "og:description", content: "Live game status, info and the link to play on Roblox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(gameInfoQuery), context.queryClient.ensureQueryData(devsQuery)]),
  component: Index,
});

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (/(online|live|open|up)/.test(s)) return "bg-accent";
  if (/(offline|down|closed)/.test(s)) return "bg-destructive";
  return "bg-primary";
}

function Index() {
  const { data: game } = useSuspenseQuery(gameInfoQuery);
  const { data: devs } = useSuspenseQuery(devsQuery);

  return (
    <>
      <main className="project-stage relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <div className="project-grid pointer-events-none absolute inset-0" aria-hidden="true" />

        <section className="reveal-up relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
          <button
            type="button"
            onClick={() => document.getElementById("game")?.scrollIntoView({ behavior: "smooth" })}
            className="project-button mb-9 min-w-40 rounded-md border border-primary/60 bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-primary-foreground transition-all duration-300 hover:-translate-y-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background active:translate-y-0 sm:mb-11"
          >
            Enter Project
          </button>

          <h1 className="text-[clamp(3.5rem,13vw,9rem)] font-bold leading-[0.82] tracking-normal text-foreground">
            Project <span className="text-primary">16</span>
          </h1>
          <div className="mt-8 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-12 bg-border sm:w-20" />
            <span className="pulse-line h-1 w-1 rounded-full bg-accent shadow-[0_0_14px_var(--glow)]" />
            <span className="h-px w-12 bg-border sm:w-20" />
          </div>
        </section>
      </main>

      <section id="game" className="project-stage flex min-h-screen items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl rounded-lg border border-border bg-card/70 p-8 sm:p-10">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">Roblox game</p>
          <h2 className="mt-3 text-4xl font-bold text-foreground sm:text-5xl">{game?.title ?? "Project 16"}</h2>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
            <span className={`h-2 w-2 rounded-full ${statusTone(game?.status ?? "")}`} />
            {game?.status ?? "Unknown"}
          </div>

          <h3 className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">About the game</h3>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-card-foreground">
            {game?.description ?? "More info coming soon."}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            {game?.game_link ? (
              <a
                href={game.game_link}
                target="_blank"
                rel="noopener noreferrer"
                className="project-button rounded-md bg-primary px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-accent"
              >
                Play on Roblox
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">Game link coming soon</span>
            )}
            {game?.updated_at && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(game.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </section>

      <DevsSection devs={devs} />
      <ApplySection />
    </>
  );
}
