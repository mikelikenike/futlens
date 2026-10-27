import Image from "next/image";
import Link from "next/link";

const productScreens = [
  {
    number: "01",
    title: "See every moment in context",
    description: "Replay the match minute by minute. Shot and goal markers appear as the clock reaches them, and a click takes you straight to the matching timeline event.",
    image: "/screenshots/field.png",
    alt: "Match replay field with shot markers and the current score",
    imageClass: "object-cover object-top",
    width: 781,
    height: 669,
  },
  {
    number: "02",
    title: "Find the moments that matter",
    description: "Filter the event timeline by team or event type, jump to a moment, and follow how the match changed from kickoff to full time.",
    image: "/screenshots/event-timeline.png",
    alt: "Match event timeline with team and event type filters",
    imageClass: "object-contain",
    width: 787,
    height: 386,
  },
  {
    number: "03",
    title: "Ask for evidence-led analysis",
    description: "Request an AI analysis through the current match clock. Choose a fan-friendly or analyst-level explanation, grounded in recorded events and stats.",
    image: "/screenshots/match-ai.png",
    alt: "Match intelligence panel showing an analyst-level AI analysis",
    imageClass: "object-contain object-top",
    width: 520,
    height: 912,
  },
  {
    number: "04",
    title: "Keep the numbers tied to the clock",
    description: "Compare shots, shots on target, corners, cards, and possession. Live event counts build as the replay advances; final totals remain available at full time.",
    image: "/screenshots/match-facts.png",
    alt: "Match statistics showing possession, shots, shots on target, corners, and cards",
    imageClass: "object-contain",
    width: 415,
    height: 337,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3f5ef] font-sans text-[#19352b]">
      <header className="sticky top-0 z-30 border-b border-[#dce3d9] bg-[#f3f5ef]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] w-[min(1240px,calc(100%-48px))] items-center justify-between max-sm:h-16 max-sm:w-[calc(100%-28px)]">
          <Link className="inline-flex items-center gap-2.5 text-[13px] font-black tracking-[.12em] text-[#19352b] no-underline" href="/" aria-label="Futlens home">
            <span className="grid size-8 place-items-center bg-[#d3ed64] text-lg">F</span> FUTLENS
          </Link>
          <nav className="flex items-center gap-7 text-[11px] font-semibold text-[#5e7166] max-sm:gap-3">
            <a className="hover:text-[#19352b] max-[420px]:hidden" href="#how-it-works">How it works</a>
            <a className="hover:text-[#19352b] max-[520px]:hidden" href="#features">Features</a>
            <Link className="bg-[#19352b] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white no-underline transition-colors hover:bg-[#286248] max-sm:px-3" href="/match/61300703">Explore a match <span aria-hidden="true" className="ml-1 text-[#d3ed64]">↗</span></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#dce3d9]">
        <div className="pointer-events-none absolute -right-32 -top-28 size-[520px] rounded-full border border-[#dce3d9] max-sm:hidden" />
        <div className="pointer-events-none absolute -right-16 -top-12 size-[390px] rounded-full border border-[#dce3d9] max-sm:hidden" />
        <div className="relative mx-auto grid w-[min(1240px,calc(100%-48px))] grid-cols-[.9fr_1.1fr] items-center gap-12 py-16 md:py-20 max-[850px]:grid-cols-1 max-[850px]:gap-10 max-sm:w-[calc(100%-28px)] max-sm:py-10">
          <div className="relative z-10 max-w-[520px]">
            <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#367254]"><span className="h-px w-7 bg-[#367254]" /> Football, with the full picture</p>
            <h1 className="m-0 text-[clamp(42px,6vw,78px)] font-black uppercase leading-[.94] tracking-[-.055em]">Every match has a <span className="text-[#477c5a]">story.</span></h1>
            <p className="mb-0 mt-6 max-w-[440px] text-[15px] leading-7 text-[#64746a]">Go beyond the scoreline. Replay the key moments, understand the numbers, and get the history and analysis that make a fixture mean more.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link className="inline-flex items-center gap-3 bg-[#19352b] px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-white no-underline transition-colors hover:bg-[#286248]" href="/match/61300703">Explore the match <span className="text-base text-[#d3ed64]">→</span></Link>
              <a className="text-[11px] font-bold text-[#367254] underline decoration-[#a8b9a8] underline-offset-4 hover:text-[#19352b]" href="#features">See what you can do</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#dce3d9] pt-5 text-[9px] font-bold uppercase tracking-[.12em] text-[#75847a]">
              <span><b className="mr-2 text-[#367254]">01</b> Interactive replay</span>
              <span><b className="mr-2 text-[#367254]">02</b> AI match analysis</span>
              <span><b className="mr-2 text-[#367254]">03</b> Team history</span>
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute -left-5 -top-5 z-10 hidden border border-[#cfd9cf] bg-[#f3f5ef] px-3 py-2 text-[8px] font-bold uppercase tracking-[.12em] text-[#367254] sm:block">Match replay · 48:03</div>
            <div className="relative overflow-hidden border border-[#d1dbd0] bg-[#fcfdf9] p-2 shadow-[0_24px_70px_-38px_rgba(25,53,43,.42)]">
              <Image className="block h-auto max-h-[580px] w-full object-cover object-top" src="/screenshots/field.png" alt="Futlens interactive match replay showing shot locations and the match clock" width={781} height={669} priority unoptimized />
            </div>
            <div className="absolute -bottom-5 right-5 flex items-center gap-3 border border-[#d1dbd0] bg-[#fcfdf9] px-4 py-3 shadow-lg max-sm:right-2">
              <span className="grid size-8 place-items-center bg-[#edf4e9] text-lg text-[#286248]">✳</span>
              <span><b className="block text-[10px]">One match. More meaning.</b><small className="mt-0.5 block text-[9px] text-[#75847a]">Events, context, and evidence together</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce3d9] bg-[#e9eee6]" id="how-it-works">
        <div className="mx-auto grid w-[min(1240px,calc(100%-48px))] grid-cols-[.75fr_1.25fr] gap-10 py-8 max-[700px]:grid-cols-1 max-[700px]:gap-5 max-sm:w-[calc(100%-28px)]">
          <div><p className="m-0 text-[9px] font-bold uppercase tracking-[.15em] text-[#367254]">A clearer way to follow</p><h2 className="mb-0 mt-2 text-xl font-bold uppercase tracking-[-.025em]">From kickoff to context</h2></div>
          <div className="grid grid-cols-3 gap-5 max-sm:grid-cols-1 max-sm:gap-3">
            {["Set your perspective", "Follow the match clock", "Explore the evidence"].map((title, index) => (
              <div className="flex gap-3 border-l border-[#bdcbbd] pl-3" key={title}><span className="pt-0.5 font-mono text-[10px] text-[#367254]">0{index + 1}</span><div><h3 className="m-0 text-[11px] font-bold">{title}</h3><p className="mb-0 mt-1.5 text-[10px] leading-5 text-[#6b7b70]">{[
                "Choose casual or hardcore detail and tell the historian who you support.",
                "See shots, goals, stats, and lineups update as the replay progresses.",
                "Jump between team events and ask for analysis through any moment.",
              ][index]}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1240px,calc(100%-48px))] py-20 max-sm:w-[calc(100%-28px)] max-sm:py-12" id="features">
        <div className="mb-10 flex items-end justify-between gap-6 max-sm:mb-7 max-sm:block">
          <div><p className="mb-3 text-[9px] font-bold uppercase tracking-[.15em] text-[#367254]">The Match Storyline Studio</p><h2 className="m-0 max-w-[600px] text-[clamp(30px,4vw,48px)] font-black uppercase leading-[.98] tracking-[-.045em]">A match is more than the final whistle.</h2></div>
          <p className="mb-1 max-w-[300px] text-xs leading-6 text-[#6b7b70] max-sm:mt-4">Every view is connected to the same fixture timeline, so the details stay grounded in what happened and when.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
          {productScreens.map((item, index) => (
            <article className="group overflow-hidden border border-[#d9e1d7] bg-[#fcfdf9]" key={item.number}>
              <div className="flex items-start justify-between gap-5 p-5 pb-3 max-sm:p-4 max-sm:pb-3">
                <div className="flex gap-3"><span className="pt-1 font-mono text-[10px] text-[#367254]">{item.number}</span><div><h3 className="m-0 text-sm font-bold uppercase tracking-[-.02em]">{item.title}</h3><p className="mb-0 mt-2 max-w-[460px] text-[11px] leading-5 text-[#6b7b70]">{item.description}</p></div></div>
                <span className="text-lg text-[#90a291] transition-transform group-hover:translate-x-1">↗</span>
              </div>
              <div className={`overflow-hidden border-t border-[#e1e6df] bg-[#f0f3ed] ${index === 0 ? "h-[340px]" : index === 2 ? "h-[360px]" : "h-[210px]"}`}>
                <Image className={`h-full w-full ${item.imageClass} ${index === 2 ? "object-[top_center]" : ""}`} src={item.image} alt={item.alt} width={item.width} height={item.height} sizes="(max-width: 720px) 100vw, 50vw" unoptimized />
              </div>
            </article>
          ))}
        </div>

        <article className="mt-3 grid grid-cols-[.78fr_1.22fr] overflow-hidden border border-[#d9e1d7] bg-[#fcfdf9] max-[720px]:grid-cols-1">
          <div className="flex flex-col justify-center p-7 max-sm:p-5"><p className="mb-3 text-[9px] font-bold uppercase tracking-[.15em] text-[#367254]">05 / The story behind the fixture</p><h3 className="m-0 text-xl font-bold uppercase leading-tight">Know the teams before the first whistle.</h3><p className="mb-0 mt-3 text-[11px] leading-5 text-[#6b7b70]">Get a tailored team history before entering the studio. Your fan level and team preference shape the briefing, and you can update them whenever you like.</p></div>
          <div className="max-h-[420px] overflow-hidden border-l border-[#e1e6df] bg-[#f0f3ed] max-[720px]:border-l-0 max-[720px]:border-t"><Image className="h-auto w-full object-cover object-top" src="/screenshots/match-history.png" alt="AI-generated pre-match history briefing for the two teams" width={977} height={814} sizes="(max-width: 720px) 100vw, 60vw" unoptimized /></div>
        </article>
      </section>

      <section className="bg-[#19352b] text-[#edf3e8]">
        <div className="mx-auto flex w-[min(1240px,calc(100%-48px))] items-center justify-between gap-8 py-12 max-[650px]:flex-col max-[650px]:items-start max-sm:w-[calc(100%-28px)] max-sm:py-9">
          <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[.15em] text-[#c1d987]">Your next match, seen differently</p><h2 className="m-0 max-w-[600px] text-3xl font-black uppercase leading-tight tracking-[-.04em]">Open the studio. Follow the whole story.</h2></div>
          <Link className="shrink-0 bg-[#d3ed64] px-5 py-3.5 text-[10px] font-black uppercase tracking-wide text-[#19352b] no-underline transition-colors hover:bg-white" href="/match/61300703">Explore a match<span aria-hidden="true" className="ml-2">→</span></Link>
        </div>
      </section>

      <footer className="bg-[#19352b] text-[#b8c8bc]">
        <div className="mx-auto flex w-[min(1240px,calc(100%-48px))] justify-between border-t border-[#3a594a] py-5 text-[9px] max-sm:w-[calc(100%-28px)]">
          <span className="font-bold tracking-[.12em]">FUTLENS</span><span>Match data, context, and intelligence.</span><Link className="text-[#d3ed64] no-underline hover:underline" href="/match/61300703">Open sample match ↗</Link>
        </div>
      </footer>
    </main>
  );
}
