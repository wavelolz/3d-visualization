import { TruckShowroom } from "@/components/truck-showroom";

const checkpoints = [
  "Lighting controls now update shared backend state through REST endpoints",
  "Frontend polls API state so refreshes and multiple viewers stay in sync",
  "Truck rendering remains the same while control logic moves out of local UI state",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-canvas text-ink">
      <div className="page-glow" />
      <div className="page-grid mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-8 lg:px-12 lg:py-10">
        <section className="relative z-10 flex flex-col justify-between gap-8 rounded-[2rem] border border-black/5 bg-white/55 p-7 shadow-panel backdrop-blur md:p-9">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-accent">
              MVP5 API-Driven Controls
            </span>
            <div className="space-y-4">
              <p className="font-serif text-4xl leading-none md:text-5xl">
                Long-haul truck,
                <br />
                now wired for
                <br />
                shared control state.
              </p>
              <p className="max-w-md text-sm leading-7 text-ink/72 md:text-base">
                This stage moves the lighting system out of local React state and into
                an API-driven control loop, so the UI triggers backend updates and the
                scene stays synced by polling shared state.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-ink/78">
            {checkpoints.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/5 bg-white/65 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 min-h-[60vh] rounded-[2rem] border border-black/5 bg-[#f8f4ec]/85 p-3 shadow-panel backdrop-blur md:min-h-[70vh] md:p-4">
          <TruckShowroom />
        </section>
      </div>
    </main>
  );
}
