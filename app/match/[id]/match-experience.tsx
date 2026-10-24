"use client";

import { useEffect, useState } from "react";
import type { HistorianContext } from "./historian-agent";
import MatchStudio from "./match-studio";
import type { MatchData } from "./types";

export default function MatchExperience({ match, historianContext }: { match: MatchData; historianContext: HistorianContext }) {
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/match-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(historianContext),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("History request failed.");
        const result = await response.json() as { history?: string };
        if (active) setHistory(result.history || null);
      })
      .catch((error: unknown) => {
        console.error("Unable to generate team history", error);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [historianContext]);

  if (started) return <MatchStudio match={match} />;

  return (
    <main className="min-h-screen bg-[#f1f3ed] font-sans text-[#1c3028]">
      <header className="flex h-14 items-center bg-[#17372d] px-6 text-xs font-bold tracking-[.1em] text-[#edf3e8] max-sm:h-12 max-sm:px-3">
        <span className="mr-2 grid size-6 place-items-center bg-[#d3ed64] text-base text-[#17372d]">F</span> FUTLENS
      </header>
      <div className="mx-auto w-[min(900px,calc(100%-48px))] py-8 max-sm:w-[calc(100%-24px)] max-sm:py-5">
        <p className="m-0 text-[9px] font-bold uppercase tracking-[.14em] text-[#367254]">Pre-match briefing · {match.competition} · {match.season}</p>
        <h1 className="mb-2 mt-3 text-3xl font-bold uppercase leading-tight max-sm:text-2xl">The history behind the fixture</h1>
        <p className="mb-6 mt-0 text-sm text-[#748078]">{match.teams.home.name} <span aria-hidden="true">vs</span> {match.teams.away.name}</p>
        <article className="rounded-[3px] border border-[#dfe4dc] bg-[#fcfdf9] p-6 max-sm:p-4" aria-live="polite">
          <div className="mb-4 flex items-center gap-2 border-b border-[#e1e6df] pb-3 text-[9px] font-bold uppercase tracking-[.1em] text-[#367254]">
            <span className="grid size-6 place-items-center bg-[#edf2e8]">H</span> Team historian
          </div>
          {loadingHistory ? (
            <div className="flex min-h-24 items-center gap-3 text-sm text-[#65746a]" role="status" aria-live="polite">
              <span className="size-5 animate-spin rounded-full border-2 border-[#dfe4dc] border-t-[#286248]" aria-hidden="true" />
              <span>Gathering the teams’ history…</span>
            </div>
          ) : history ? (
            <div className="whitespace-pre-wrap text-sm leading-7 text-[#48594e]">{history}</div>
          ) : (
            <p className="m-0 text-sm leading-7 text-[#65746a]">The team historian is unavailable right now. You can continue to the match replay.</p>
          )}
          <div className="mt-5 border-t border-[#e1e6df] pt-3 text-xs text-[#748078]">
            {[match.venue, match.city].filter(Boolean).join(" · ") || match.teams.home.name + " vs " + match.teams.away.name}
          </div>
        </article>
        <div className="mt-5 flex justify-end">
          <button className="bg-[#17372d] px-5 py-3 text-sm font-bold text-white hover:bg-[#286248]" type="button" onClick={() => setStarted(true)}>
            Continue to match <span aria-hidden="true" className="ml-2 text-[#d3ed64]">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
