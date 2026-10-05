import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { applyTester, type Dev } from "@/lib/community.functions";

export function DevsSection({ devs }: { devs: Dev[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const selected = devs.find((d) => d.discord_id === open);

  return (
    <section id="devs" className="project-stage flex justify-center px-6 py-20">
      <div className="w-full max-w-3xl text-center">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">The team</p>
        <h2 className="mt-3 text-4xl font-bold text-foreground">Current devs</h2>
        {devs.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No devs listed yet.</p>
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {devs.map((d) => (
              <button
                key={d.discord_id}
                type="button"
                onClick={() => setOpen(open === d.discord_id ? null : d.discord_id)}
                aria-pressed={open === d.discord_id}
                aria-label={`${d.username} contact info`}
                className="group flex flex-col items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={d.avatar_url ?? ""}
                  alt={d.username}
                  className={`h-20 w-20 rounded-full border-2 object-cover transition-all group-hover:-translate-y-1 ${open === d.discord_id ? "border-primary shadow-[0_0_24px_var(--glow)]" : "border-border"}`}
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground">{d.username}</span>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="mx-auto mt-8 max-w-sm rounded-lg border border-border bg-card/80 p-5 text-left">
            <p className="font-semibold text-foreground">{selected.username}</p>
            <p className="mt-2 break-words text-sm text-card-foreground">
              {selected.contact ?? "No contact info added."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

const field =
  "mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function ApplySection() {
  const send = useServerFn(applyTester);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    if (state !== "sending") {
      setState("idle");
      setError(null);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const age = Number(f.get("age"));
    if (Number.isFinite(age) && age < 11) {
      setState("denied");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await send({
        data: {
          discord: String(f.get("discord") ?? ""),
          age: Number(f.get("age")),
          why: String(f.get("why") ?? ""),
          experience: String(f.get("experience") ?? ""),
        },
      });
      if (res.ok) setState("sent");
      else {
        setError(res.error);
        setState("idle");
      }
    } catch {
      setError("Please fill in every field (reason at least 10 characters).");
      setState("idle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="project-button fixed bottom-6 right-6 z-40 rounded-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_0_28px_var(--glow)] transition-all hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Apply as tester
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Apply to be a tester"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-8 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">Join us</p>
                <h2 className="mt-3 text-3xl font-bold text-foreground">Apply to be a tester</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-md px-2 py-1 text-xl leading-none text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ×
              </button>
            </div>
            {state === "sent" ? (
              <p className="mt-6 text-card-foreground">Application sent! The team will reach out on Discord.</p>
            ) : state === "denied" ? (
              <div className="mt-6">
                <p className="text-destructive">Sorry, you must be at least 11 years old to apply as a tester.</p>
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Go back
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <label className="block text-sm text-card-foreground">
                  Discord username
                  <input name="discord" required maxLength={40} className={field} />
                </label>
                <label className="block text-sm text-card-foreground">
                  How old are you?
                  <input name="age" type="number" required min={1} max={99} className={field} />
                </label>
                <label className="block text-sm text-card-foreground">
                  Why do you want to be a tester?
                  <textarea name="why" required minLength={10} maxLength={1000} rows={3} className={field} />
                </label>
                <label className="block text-sm text-card-foreground">
                  Do you have previous experience?
                  <textarea name="experience" required maxLength={1000} rows={3} className={field} />
                </label>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="project-button w-full rounded-md bg-primary px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {state === "sending" ? "Sending..." : "Send application"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
