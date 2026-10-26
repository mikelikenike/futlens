"use client";

import { useState, type FormEvent } from "react";
import type { HistorianContext } from "./historian-agent";
import MatchStudio from "./match-studio";
import type { MatchData } from "./types";

export default function MatchExperience({ match, historianContext }: { match: MatchData; historianContext: HistorianContext }) {
  const [step, setStep] = useState<"personalize" | "history" | "studio">("personalize");
  const [fanLevel, setFanLevel] = useState<"casual" | "hardcore" | "">("");
  const [teamSupport, setTeamSupport] = useState<"home" | "away" | "neutral" | "">("");
  const [history, setHistory] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function requestHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fanLevel || !teamSupport) return;

    setStep("history");
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/match-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...historianContext, fanLevel, teamSupport }),
      });
      if (!response.ok) throw new Error("History request failed.");
      const result = await response.json() as { history?: string };
      setHistory(result.history || null);
    } catch (error) {
      console.error("Unable to generate team history", error);
      setHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  }

  if (step === "studio") return <MatchStudio match={match} />;

  return (
    <main className="min-h-screen bg-[#f1f3ed] font-sans text-[#1c3028]">
      <header className="flex h-14 items-center bg-[#17372d] px-6 text-xs font-bold tracking-[.1em] text-[#edf3e8] max-sm:h-12 max-sm:px-3">
        <span className="mr-2 grid size-6 place-items-center bg-[#d3ed64] text-base text-[#17372d]">F</span> FUTLENS
      </header>
      <div className="mx-auto w-[min(900px,calc(100%-48px))] py-8 max-sm:w-[calc(100%-24px)] max-sm:py-5">
        <p className="m-0 text-[9px] font-bold uppercase tracking-[.14em] text-[#367254]">Pre-match briefing · {match.competition} · {match.season}</p>
        <h1 className="mb-2 mt-3 text-3xl font-bold uppercase leading-tight max-sm:text-2xl">{step === "personalize" ? "Make this briefing yours" : "The history behind the fixture"}</h1>
        <p className="mb-6 mt-0 text-sm text-[#748078]">{match.teams.home.name} <span aria-hidden="true">vs</span> {match.teams.away.name}</p>
        {step === "personalize" ? (
          <form className="grid gap-4 rounded-[3px] border border-[#dfe4dc] bg-[#fcfdf9] p-6 max-sm:p-4" onSubmit={requestHistory}>
            <fieldset className="m-0 border-0 border-b border-[#e1e6df] p-0 pb-4">
              <legend className="mb-3 text-sm font-bold">1. What kind of fan are you?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {([{ value: "casual", label: "Casual fan", detail: "Keep the story easy to follow." }, { value: "hardcore", label: "Hardcore fan", detail: "Give me more depth and detail." }] as const).map((option) => (
                  <label key={option.value} className={`flex cursor-pointer items-start gap-2 border p-3 text-sm ${fanLevel === option.value ? "border-[#286248] bg-[#edf4e9]" : "border-[#dfe4dc]"}`}>
                    <input className="mt-1 accent-[#286248]" type="radio" name="fan-level" value={option.value} checked={fanLevel === option.value} onChange={() => setFanLevel(option.value)} />
                    <span><strong className="block">{option.label}</strong><span className="mt-1 block text-xs text-[#748078]">{option.detail}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-3 text-sm font-bold">2. Who are you supporting?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {([{ value: "home", label: match.teams.home.name }, { value: "away", label: match.teams.away.name }, { value: "neutral", label: "Neutral" }] as const).map((option) => (
                  <label key={option.value} className={`flex cursor-pointer items-center gap-2 border p-3 text-sm ${teamSupport === option.value ? "border-[#286248] bg-[#edf4e9]" : "border-[#dfe4dc]"}`}>
                    <input className="accent-[#286248]" type="radio" name="team-support" value={option.value} checked={teamSupport === option.value} onChange={() => setTeamSupport(option.value)} />
                    <span className="truncate">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end border-t border-[#e1e6df] pt-4">
              <button className="bg-[#17372d] px-5 py-3 text-sm font-bold text-white enabled:hover:bg-[#286248] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!fanLevel || !teamSupport}>
                Show team history <span aria-hidden="true" className="ml-2 text-[#d3ed64]">→</span>
              </button>
            </div>
          </form>
        ) : (
          <>
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
              <button className="bg-[#17372d] px-5 py-3 text-sm font-bold text-white hover:bg-[#286248]" type="button" onClick={() => setStep("studio")}>
                Continue to match <span aria-hidden="true" className="ml-2 text-[#d3ed64]">→</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
