import { TruckShowroom } from "@/components/truck-showroom";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-canvas text-ink">
      <div className="page-glow" />
      <div className="page-grid mx-auto flex min-h-screen w-full max-w-[90rem] flex-col gap-6 px-4 py-4 md:px-5 md:py-5 lg:grid lg:grid-cols-[2fr_3fr] lg:gap-5 lg:px-6 lg:py-6">
        <section className="relative z-10 flex min-h-[16rem] items-start rounded-[2rem] border border-black/5 bg-white/55 p-5 shadow-panel backdrop-blur md:p-6 lg:p-7">
          <h1 className="font-serif text-4xl leading-none md:text-5xl lg:text-6xl">
            Playground for your own fancy automobile
          </h1>
          <p className="absolute bottom-5 right-5 text-xl text-ink/60 md:bottom-6 md:right-6 lg:bottom-7 lg:right-7">
            Built by Ray Hsu
          </p>
        </section>

        <section className="relative z-10 min-h-[68vh] rounded-[2rem] border border-black/5 bg-[#f8f4ec]/85 p-2 shadow-panel backdrop-blur md:min-h-[76vh] md:p-3">
          <TruckShowroom />
        </section>
      </div>
    </main>
  );
}
