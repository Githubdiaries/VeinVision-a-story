import { createFileRoute } from "@tanstack/react-router";
import { FilmPlayer } from "@/components/film-player";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-paper text-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(31,138,98,0.08),transparent_60%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M7.5 13.2c1.6-2.4 2.7-2.4 4.2 0 1.5 2.3 2.7 2.3 4.3 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <p className="font-display text-lg leading-none tracking-tight">VeinVision</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">SIA Community Voting</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/video/veinvision.mp4" download="VeinVision-SIA.mp4">
            <Download />
            Download
          </a>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-6 pt-2 md:px-8 md:pt-4">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-vein">A 50-second film</p>
          <h1 className="mt-3 font-display text-[2.05rem] leading-[1.12] tracking-[-0.03em] text-balance md:text-5xl">
            When you can see better,
            <span className="italic text-ink/80"> you can care better.</span>
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg">
            A nurse. A patient. A long wait. Then a quieter way to find a vein —
            and a calmer moment between two people.
          </p>
        </div>
        <FilmPlayer />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 md:grid-cols-3 md:px-8 md:py-12">
        <StoryCard
          k="01"
          title="The human cost"
          body="Finding a vein can be routine for a nurse. For a patient, it can feel like a long wait — sometimes painful."
        />
        <StoryCard
          k="02"
          title="A different way"
          body="A colleague offers VeinVision: a compact, pocket-friendly handheld that maps veins onto the skin. No phone. No laptop."
        />
        <StoryCard
          k="03"
          title="Care, restored"
          body="The nurse sees clearly, looks back into the patient’s eyes, and finds relief there. Technology in service of trust."
        />
      </section>

      <footer className="mx-auto w-full max-w-6xl border-t border-line px-5 py-8 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md font-display text-lg italic leading-snug text-ink/80">
            The device is not the protagonist. The nurse and the patient are.
          </p>
          <p className="text-xs text-muted">
            Original stickman film for SIA Community Voting. Original score and narration.
          </p>
        </div>
      </footer>
    </main>
  );
}

function StoryCard({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <article className="rounded-[calc(var(--radius-xl)+4px)] border border-line bg-paper-2/50 p-5 md:p-6">
      <p className="font-sans text-xs tabular-nums tracking-[0.16em] text-vein">{k}</p>
      <h2 className="mt-3 font-display text-xl tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted">{body}</p>
    </article>
  );
}
