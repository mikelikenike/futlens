"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MatchData, MatchEvent, MatchPlayer, MatchQualifier } from "./types";

type Audience = "fan" | "analyst";
type Language = "en";

const text = {
  en: {
    replay: "Match replay", matchMoments: "Match moments", kickOff: "Kick-off", goal: "Goal", fullTime: "Full time",
    pause: "Pause", play: "Play", insight: "Match intelligence", fan: "Fan", analyst: "Analyst", evidence: "Inspect evidence",
    headline: "Shot volume comparison", insufficient: "Comparable shot totals are unavailable for this match.",
    caution: "Aggregate totals do not establish tactical cause", totals: "Match statistics", totalsHint: "Counts update with replay events; possession is available at full time", overlay: "Broadcast overlay", recap: "Full-time recap",
    copy: "Copy JSON", copied: "Copied", generate: "Generate recap", source: "Supplied match totals",
    replayView: "REPLAY SIMULATION", reference: "MATCH REFERENCE", loading: "Loading match...", matchClock: "MATCH CLOCK", measure: "MEASURE", supported: "SUPPORTED", template: "Template generated · no model request", goalFor: "scores for", fanShot: "recorded {awayShots} {shotUnit} compared with {homeShots} for {homeTeam}.", fanTarget: "{awayTarget} {targetUnit} for {awayTeam}, compared with {homeTarget} for {homeTeam}.", analystShot: "{awayTeam}: {awayShots} {shotUnit} ({awayTarget} {targetUnit}); {homeTeam}: {homeShots} ({homeTarget} {targetUnit}). Difference: {shotDifference} shots and {targetDifference} on target.", recapIntro: "Final score:", shotsLabel: "shots", targetLabel: "on target",
  },
} as const;

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

function eventClock(event: MatchEvent) {
  if (event.clock !== "0:00" || event.type === "match_started") return event.clock || formatClock(event.timeSeconds);
  if (event.type === "period_score" || event.type === "break_start") return `${(event.period ?? 1) * 45}:00`;
  if (event.type === "period_start" && event.period && event.period > 1) return `${(event.period - 1) * 45}:00`;
  return event.clock || formatClock(event.timeSeconds);
}

function replayEventLabel(event: MatchEvent, language: Language) {
  if (event.type === "match_started") return text[language].kickOff;
  if (event.type === "match_ended") return text[language].fullTime;
  if (event.type === "score_change") {
    const scorer = event.scorer?.replace(/,\s*/, " ");
    return scorer ? `${text[language].goal} · ${scorer}` : text[language].goal;
  }
  const labels: Record<string, string> = {
    break_start: "Break started",
    corner_kick: "Corner kick",
    free_kick: "Free kick",
    goal_kick: "Goal kick",
    injury: "Injury",
    injury_return: "Return from injury",
    injury_time_shown: "Stoppage time announced",
    match_started: "Kick-off",
    match_ended: "Full time",
    offside: "Offside",
    period_start: "Period started",
    period_score: "Period ended",
    possible_goal: "Possible goal",
    score_change: "Goal",
    shot_off_target: "Shot off target",
    shot_on_target: "Shot on target",
    shot_saved: "Shot saved",
    substitution: "Substitution",
    throw_in: "Throw-in",
    yellow_card: "Yellow card",
  };
  return labels[event.type] ?? event.type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function eventDetails(event: MatchEvent, match: MatchData) {
  const team = event.competitor ? match.teams[event.competitor].name : undefined;
  const participants = event.participants.map(({ name, role }) => {
    const normalizedName = name.replace(/,\s*/, " ");
    if (role === "scorer") return `Scorer: ${normalizedName}`;
    if (role === "assist") return `Assist: ${normalizedName}`;
    if (role === "substituted_in") return `On: ${normalizedName}`;
    if (role === "substituted_out") return `Off: ${normalizedName}`;
    return normalizedName;
  });
  const details = [
    team,
    ...participants,
    event.outcome ? `Outcome: ${event.outcome.replaceAll("_", " ")}` : undefined,
    event.homeScore !== undefined && event.awayScore !== undefined ? `Score ${event.homeScore}–${event.awayScore}` : undefined,
    event.period ? `Period ${event.period}` : event.periodName?.replaceAll("_", " "),
    event.periodType && event.periodType !== "regular_period" ? event.periodType.replaceAll("_", " ") : undefined,
    event.stoppageTimeClock ? `Added time ${event.stoppageTimeClock}` : undefined,
    event.announcedInjuryTime !== undefined ? `${event.announcedInjuryTime} min added` : undefined,
    event.breakName ? event.breakName.replaceAll("_", " ") : undefined,
  ];
  return details.filter(Boolean).join(" · ");
}

function displayPlayerName(name: string) {
  const [surname, givenName] = name.split(/,\s*/, 2);
  return givenName ? `${givenName} ${surname}` : name;
}

function playerMatches(player: MatchPlayer, participant: { id?: string; name: string }) {
  return participant.id ? player.id === participant.id : player.name === participant.name;
}

function lineupAtTime(match: MatchData, team: MatchQualifier, seconds: number) {
  const active = match.squads[team].filter((player) => player.starter);
  const bench = match.squads[team]
    .filter((player) => !player.starter)
    .map((player) => ({ player, substitutedOff: false }));
  const substitutions = [...match.events]
    .filter((event) => event.type === "substitution" && event.competitor === team && event.timeSeconds <= seconds)
    .sort((first, second) => first.timeSeconds - second.timeSeconds || first.id.localeCompare(second.id));

  for (const substitution of substitutions) {
    for (const participant of substitution.participants) {
      if (participant.role !== "substituted_out") continue;
      const index = active.findIndex((player) => playerMatches(player, participant));
      if (index === -1) continue;
      const [player] = active.splice(index, 1);
      const benchIndex = bench.findIndex((entry) => playerMatches(entry.player, participant));
      if (benchIndex === -1) bench.push({ player, substitutedOff: true });
      else bench[benchIndex] = { player, substitutedOff: true };
    }
    for (const participant of substitution.participants) {
      if (participant.role !== "substituted_in") continue;
      const benchIndex = bench.findIndex((entry) => playerMatches(entry.player, participant));
      const player = benchIndex === -1
        ? { id: participant.id ?? participant.name, name: participant.name }
        : bench.splice(benchIndex, 1)[0].player;
      if (!active.some((activePlayer) => playerMatches(activePlayer, participant))) active.push(player);
    }
  }

  return { active, bench };
}

type PlayerEventMarks = {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  substitutedOn: number;
  injuries: number;
};

function playerEventMarks(match: MatchData, seconds: number) {
  const marks: Record<string, PlayerEventMarks> = {};
  const events = match.events.filter((event) => event.timeSeconds <= seconds);

  for (const event of events) {
    for (const participant of event.participants) {
      const playerKey = participant.id ?? participant.name;
      const mark = marks[playerKey] ??= { goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutedOn: 0, injuries: 0 };
      if (event.type === "score_change" && ["scorer", "own_goal", "goal"].includes(participant.role ?? "")) mark.goals += 1;
      if (event.type === "score_change" && participant.role === "assist") mark.assists += 1;
      if (event.type === "yellow_card") mark.yellowCards += 1;
      if (["red_card", "yellow_red_card", "dismissal"].includes(event.type)) mark.redCards += 1;
      if (event.type === "substitution" && participant.role === "substituted_in") mark.substitutedOn += 1;
      if (event.type === "injury") mark.injuries += 1;
    }
  }

  return marks;
}

function PlayerBadges({ player, marks }: { player: MatchPlayer; marks: Record<string, PlayerEventMarks> }) {
  const playerMarks = marks[player.id] ?? marks[player.name];
  if (!playerMarks) return null;

  return <span className="ml-1 inline-flex align-middle" aria-label={`${playerMarks.goals} goals, ${playerMarks.assists} assists, ${playerMarks.yellowCards} yellow cards, ${playerMarks.redCards} red cards, ${playerMarks.substitutedOn} substitutions on, ${playerMarks.injuries} injuries`}>
    {Array.from({ length: playerMarks.goals }, (_, index) => <span key={`goal-${index}`} title="Goal">&#9917;</span>)}
    {Array.from({ length: playerMarks.assists }, (_, index) => <span key={`assist-${index}`} title="Assist">&#129309;</span>)}
    {Array.from({ length: playerMarks.yellowCards }, (_, index) => <span key={`yellow-${index}`} title="Yellow card">&#129000;</span>)}
    {Array.from({ length: playerMarks.redCards }, (_, index) => <span key={`red-${index}`} title="Red card">&#128997;</span>)}
    {Array.from({ length: playerMarks.substitutedOn }, (_, index) => <span key={`sub-on-${index}`} title="Substituted on">&#128257;</span>)}
    {Array.from({ length: playerMarks.injuries }, (_, index) => <span key={`injury-${index}`} title="Injury">&#129301;</span>)}
  </span>;
}

function getReplayStats(match: MatchData, seconds: number) {
  const isFullTime = seconds >= match.durationSeconds;
  const processedEvents = match.events.filter((event) => event.timeSeconds <= seconds);

  return match.stats.map((stat) => {
    if (isFullTime) return { ...stat, live: false, label: stat.label };
    if (stat.key === "ball_possession") {
      return { ...stat, home: null, away: null, live: true, label: "Possession (full time)" };
    }

    const eventTypesByStat: Record<string, string[]> = {
      shots_total: ["shot_off_target", "shot_on_target", "score_change"],
      shots_on_target: ["shot_on_target", "score_change"],
      corner_kicks: ["corner_kick"],
      yellow_cards: ["yellow_card"],
    };
    const eventTypes = eventTypesByStat[stat.key];
    if (!eventTypes) return { ...stat, home: null, away: null, live: true, label: `${stat.label} (full time)` };

    const totals = { home: 0, away: 0 };
    for (const event of processedEvents) {
      if (!eventTypes.includes(event.type) || !event.competitor) continue;
      totals[event.competitor] += 1;
    }

    return {
      ...stat,
      ...totals,
      live: true,
      label: stat.key === "shots_total" ? "Recorded shot events" : stat.label,
    };
  });
}

export default function MatchStudio({ match }: { match: MatchData }) {
  const scoreEvent = match.events.find((event) => event.type === "score_change");
  const startTime = scoreEvent?.timeSeconds ?? 0;
  const [seconds, setSeconds] = useState(startTime);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audience, setAudience] = useState<Audience>("fan");
  const [language, setLanguage] = useState<Language>("en");
  const [showEvidence, setShowEvidence] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const words = text[language];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(match.durationSeconds, seconds + playbackSpeed);
      setSeconds(next);
      if (next === match.durationSeconds) setPlaying(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [match.durationSeconds, playbackSpeed, playing, seconds]);

  const replayEvents = [...match.events].sort((first, second) => first.timeSeconds - second.timeSeconds || first.id.localeCompare(second.id));
  const eventTypes = [...new Set(replayEvents.map((event) => event.type))].sort();
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const visibleEvents = eventTypeFilter === "all"
    ? replayEvents
    : replayEvents.filter((event) => event.type === eventTypeFilter);
  const activeEvent = replayEvents.filter((event) => event.timeSeconds <= seconds).at(-1);
  const homeLineup = lineupAtTime(match, "home", seconds);
  const awayLineup = lineupAtTime(match, "away", seconds);
  const playerMarks = playerEventMarks(match, seconds);
  const activeGoals = match.events.filter((event) => event.type === "score_change" && event.timeSeconds <= seconds);
  const currentScore = activeGoals.reduce((score, event) => ({
    home: event.homeScore ?? score.home + Number(event.competitor === "home"),
    away: event.awayScore ?? score.away + Number(event.competitor === "away"),
  }), { home: 0, away: 0 });
  const replayStats = getReplayStats(match, seconds);
  const shots = replayStats.find((stat) => stat.key === "shots_total");
  const shotsOnTarget = replayStats.find((stat) => stat.key === "shots_on_target");
  const teamsByQualifier = { home: match.teams.home, away: match.teams.away };
  const scorerTeam = scoreEvent?.competitor ? teamsByQualifier[scoreEvent.competitor] : match.teams.away;
  const scorer = scoreEvent?.scorer;
  const scorerName = scorer?.replace(/,\s*/, " ") ?? "";
  const evidenceSources = [
    ...(shots && shots.home !== null && shots.away !== null ? [{ label: "STAT / SHOTS", value: `${match.teams.home.name} ${shots.home} · ${match.teams.away.name} ${shots.away}` }] : []),
    ...(shotsOnTarget && shotsOnTarget.home !== null && shotsOnTarget.away !== null ? [{ label: "STAT / ON TARGET", value: `${match.teams.home.name} ${shotsOnTarget.home} · ${match.teams.away.name} ${shotsOnTarget.away}` }] : []),
    ...(scoreEvent ? [{ label: "EVENT / SCORE", value: [scorerName, scorerTeam?.name, eventClock(scoreEvent), scoreEvent.assist].filter(Boolean).join(" · ") }] : []),
  ];
  const sourceGoalId = scoreEvent?.id ?? "";
  const finalShots = match.stats.find((stat) => stat.key === "shots_total");
  const finalShotsOnTarget = match.stats.find((stat) => stat.key === "shots_on_target");
  const isFullTime = seconds >= match.durationSeconds;
  const shotUnit = isFullTime ? words.shotsLabel : "shot events";
  const targetUnit = isFullTime ? words.targetLabel : "on-target events";

  const overlay = {
    matchId: match.id,
    match: `${match.teams.home.name} vs ${match.teams.away.name}`,
    eventTime: scoreEvent ? eventClock(scoreEvent) : "",
    headline: scorer && scorerTeam ? `${scorerName} ${words.goalFor} ${scorerTeam.name}` : words.goal,
    copy: [scorer && scorerName, scorerTeam?.name, scoreEvent?.assist].filter(Boolean).join(" · "),
    durationSeconds: 8,
    evidenceReferences: sourceGoalId ? [`event.${sourceGoalId}`] : [],
    reviewStatus: "template-generated",
  };

  async function copyOverlay() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(overlay, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setShowOverlay(true);
    }
  }

  const insight = shots && shotsOnTarget && shots.home !== null && shots.away !== null && shotsOnTarget.home !== null && shotsOnTarget.away !== null
    ? audience === "fan"
      ? `${match.teams.away.name} ${words.fanShot.replace("{awayShots}", String(shots.away)).replace("{shotUnit}", shotUnit).replace("{homeShots}", String(shots.home)).replace("{homeTeam}", match.teams.home.name)} ${words.fanTarget.replace("{awayTarget}", String(shotsOnTarget.away)).replace("{targetUnit}", targetUnit).replace("{awayTeam}", match.teams.away.name).replace("{homeTarget}", String(shotsOnTarget.home)).replace("{homeTeam}", match.teams.home.name)}`
      : words.analystShot.replace("{awayTeam}", match.teams.away.name).replace("{awayShots}", String(shots.away)).replace("{shotUnit}", shotUnit).replace("{awayTarget}", String(shotsOnTarget.away)).replaceAll("{targetUnit}", targetUnit).replace("{homeTeam}", match.teams.home.name).replace("{homeShots}", String(shots.home)).replace("{homeTarget}", String(shotsOnTarget.home)).replace("{shotDifference}", String(Math.abs(shots.away - shots.home))).replace("{targetDifference}", String(Math.abs(shotsOnTarget.away - shotsOnTarget.home)))
    : words.insufficient;

  const recap = `${words.recapIntro} ${match.teams.home.name} ${match.finalScore.home}–${match.finalScore.away} ${match.teams.away.name}.${scoreEvent && scorer ? ` ${scorerName} ${words.goalFor} ${scorerTeam?.name ?? ""} at ${eventClock(scoreEvent)}${scoreEvent.assist ? ` (${scoreEvent.assist})` : ""}.` : ""}${finalShots && finalShotsOnTarget ? ` ${match.teams.home.name}: ${finalShots.home} ${words.shotsLabel}, ${finalShotsOnTarget.home} ${words.targetLabel}. ${match.teams.away.name}: ${finalShots.away} ${words.shotsLabel}, ${finalShotsOnTarget.away} ${words.targetLabel}.` : ""}`;

  return (
    <main className="min-h-screen bg-[#f1f3ed] font-sans text-[#1c3028] [&_p]:!text-xs [&_.insight-copy]:!text-sm [&_span]:!text-xs [&_li>span:first-child]:!text-[10px] [&_button]:!text-xs [&_label]:!text-xs [&_select]:!text-xs [&_time]:!text-xs [&_small]:!text-xs">
      <header className="flex h-14 items-center justify-between bg-[#17372d] px-6 text-[9px] font-bold tracking-[.1em] text-[#edf3e8] max-sm:h-12 max-sm:px-3">
        <Link className="inline-flex items-center gap-2 text-xs text-inherit no-underline" href="/" aria-label="Futlens home"><span className="grid size-6 place-items-center bg-[#d3ed64] text-base text-[#17372d]">F</span> FUTLENS</Link>
        <div className="flex items-center gap-2 max-sm:text-[0px]"><i className="size-1.5 rounded-full bg-[#d3ed64]" /> MATCH STORYLINE STUDIO</div>
        <label className="flex items-center gap-2 text-[8px] text-[#d1ded4]">
          <span>Language</span>
          <select className="rounded-sm border border-[#456054] bg-[#23483a] p-1 text-[9px] text-white max-sm:[&+span]:hidden" aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="en">EN</option>
          </select>
        </label>
      </header>

      <div className="mx-auto w-[min(1280px,calc(100%-48px))] pb-6 max-sm:w-[calc(100%-24px)]">
        <section className="border-b border-[#d9dfd5] py-[23px] pb-5 max-[480px]:py-[18px] max-[480px]:pb-[15px]">
          <div>
            <p className="m-0 text-[8px] font-bold tracking-[.12em] text-[#367254]">{match.competition} · {formatDate(match.startTime)}</p>
            <p className="mt-1.5 text-[9px] text-[#748078]">{[match.venue, match.city].filter(Boolean).join(" · ")}</p>
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(350px,.8fr)] gap-[13px] pt-3.5 max-[850px]:grid-cols-1 max-[850px]:gap-2.5 max-[850px]:pt-2.5">
          <section className="min-w-0 rounded-[3px] border border-[#dfe4dc] bg-[#fcfdf9] p-4 max-sm:p-3.5" aria-labelledby="replay-title">
            <div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-[8px] font-bold tracking-[.12em] text-[#367254]">01 / REPLAY</p><h1 id="replay-title" className="m-0 text-lg font-bold uppercase">{words.replay}</h1></div><span className="bg-[#edf2e8] px-2 py-1 text-[7px] font-bold tracking-wide text-[#5c7461]">{words.replayView}</span></div>
            <div className="mt-2 flex items-baseline justify-center gap-2 border-t border-[#e1e6df] pt-2"><span className="text-[8px] font-bold tracking-[.1em] text-[#738078]">{words.matchClock}</span><strong className="text-base tabular-nums">{formatClock(seconds)}<small className="text-[10px] text-[#367254]">{seconds === match.durationSeconds ? " FT" : "′"}</small></strong></div>
            <div className="relative isolate mt-3 min-h-[440px] overflow-hidden bg-[repeating-linear-gradient(90deg,#a0c378_0_10%,#4b865d_10%_20%)] text-[#eff5e4] max-[480px]:min-h-[500px]">
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0d3222]/30 via-transparent to-[#0d3222]/50" />
              <div className="absolute inset-[38px_9%_32px] border border-[#eaf2db]/50"><div className="absolute inset-y-0 left-1/2 border-l border-[#eaf2db]/40" /><div className="absolute left-1/2 top-1/2 size-[58px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#eaf2db]/40" /><span className="absolute inset-y-1/4 left-0 w-[12%] border-y border-r border-[#eaf2db]/40" /><span className="absolute inset-y-1/4 right-0 w-[12%] border-y border-l border-[#eaf2db]/40" /><i className="absolute left-[32%] top-1/2 size-1 -translate-y-1/2 rounded-full bg-[#eaf2db]" /></div>
              <div className="absolute left-4 right-4 top-3 flex justify-between gap-2 text-[7px] font-bold tracking-[.1em] text-[#eff5e4]/75"><span className="max-w-[35%] truncate">{match.teams.home.name}</span><span className="truncate text-center">{match.competition} · {match.season}</span><span className="max-w-[35%] truncate text-right">{match.teams.away.name}</span></div>
              <div className="absolute bottom-3 left-3 top-11 z-10 w-[29%] overflow-y-hidden bg-[#17372d]/85 p-2 max-[480px]:bottom-2 max-[480px]:left-1 max-[480px]:top-[76px] max-[480px]:w-[48%]">
                <h2 className="mb-1 border-b border-white/20 pb-1 text-[9px] font-bold uppercase tracking-wide text-white/80">On pitch</h2>
                <ul className="m-0 grid list-none gap-0.5 p-0">{homeLineup.active.map((player) => <li className="truncate text-[10px] leading-[1.25] text-white/90" key={player.id}><span className="text-[10px]">{displayPlayerName(player.name)}</span><PlayerBadges player={player} marks={playerMarks} /></li>)}</ul>
                <h2 className="mb-1 mt-2 border-b border-white/20 pb-1 text-[9px] font-bold uppercase tracking-wide text-white/70">Bench</h2>
                <ul className="m-0 grid list-none gap-0.5 p-0">{homeLineup.bench.map(({ player, substitutedOff }) => <li className="truncate text-[10px] leading-[1.25] text-white/75" key={player.id}><span className={`text-[10px] ${substitutedOff ? "line-through" : ""}`}>{displayPlayerName(player.name)}</span><PlayerBadges player={player} marks={playerMarks} /></li>)}</ul>
              </div>
              <div className="absolute bottom-3 right-3 top-11 z-10 w-[29%] overflow-y-hidden bg-[#17372d]/85 p-2 max-[480px]:bottom-2 max-[480px]:right-1 max-[480px]:top-[76px] max-[480px]:w-[48%]">
                <h2 className="mb-1 border-b border-white/20 pb-1 text-[9px] font-bold uppercase tracking-wide text-white/80">On pitch</h2>
                <ul className="m-0 grid list-none gap-0.5 p-0">{awayLineup.active.map((player) => <li className="truncate text-[10px] leading-[1.25] text-white/90" key={player.id}><span className="text-[10px]">{displayPlayerName(player.name)}</span><PlayerBadges player={player} marks={playerMarks} /></li>)}</ul>
                <h2 className="mb-1 mt-2 border-b border-white/20 pb-1 text-[9px] font-bold uppercase tracking-wide text-white/70">Bench</h2>
                <ul className="m-0 grid list-none gap-0.5 p-0">{awayLineup.bench.map(({ player, substitutedOff }) => <li className="truncate text-[10px] leading-[1.25] text-white/75" key={player.id}><span className={`text-[10px] ${substitutedOff ? "line-through" : ""}`}>{displayPlayerName(player.name)}</span><PlayerBadges player={player} marks={playerMarks} /></li>)}</ul>
              </div>
              <div className="absolute left-1/2 top-1/2 z-10 flex w-[38%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center [text-shadow:0_2px_12px_#10291e66] max-[480px]:top-3 max-[480px]:w-[90%] max-[480px]:-translate-y-0">
                <span className="bg-[#d3ed64] px-2 py-1 text-[9px] font-bold tracking-wide text-[#18372d] [text-shadow:none]">{activeEvent ? `${eventClock(activeEvent)} · ${replayEventLabel(activeEvent, language)}` : words.replayView}</span>
                <strong className="text-2xl font-bold tabular-nums leading-none max-[480px]:text-xl">{currentScore.home} <i className="text-lg not-italic text-white/75">:</i> {currentScore.away}</strong>
                <strong className="text-base font-bold leading-tight max-[480px]:text-sm">{activeEvent ? (activeEvent.scorer ? displayPlayerName(activeEvent.scorer) : activeEvent.participants[0] ? displayPlayerName(activeEvent.participants[0].name) : (activeEvent.competitor ? match.teams[activeEvent.competitor].name : replayEventLabel(activeEvent, language))) : `${match.teams.home.name} · ${match.teams.away.name}`}</strong>
                <span className="max-w-full text-[10px] leading-tight">{activeEvent ? eventDetails(activeEvent, match) : match.competition}</span>
              </div>
              <span className="absolute bottom-2 right-3 text-[11px] font-bold">{formatClock(seconds)} <small className="font-normal text-[#eff5e4]/75">/ {formatClock(match.durationSeconds)}</small></span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 max-[480px]:gap-2">
              <button className="flex h-[31px] min-w-[102px] items-center gap-2 bg-[#17372d] px-2.5 text-[9px] text-white max-[480px]:min-w-[89px] max-[480px]:px-2 max-[480px]:text-[8px]" type="button" onClick={() => setPlaying((value) => !value)}><span className="text-[#d3ed64]">{playing ? "Ⅱ" : "▶"}</span>{playing ? words.pause : words.play}</button>
              <div className="min-w-[50px]"><input className="mb-1 block h-1 w-full cursor-pointer appearance-none bg-[linear-gradient(to_right,#286248_var(--progress),#dfe4dc_var(--progress))] [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#286248]" aria-label="Replay time" type="range" min="0" max={match.durationSeconds} value={seconds} onChange={(event) => { setSeconds(Number(event.target.value)); setPlaying(false); }} style={{ "--progress": `${seconds / match.durationSeconds * 100}%` } as React.CSSProperties} /><div className="flex justify-between text-[7px] text-[#89938b]"><span>00:00</span><span>{formatClock(match.durationSeconds / 2)}</span><span>{formatClock(match.durationSeconds)}</span></div></div>
              <select className="border border-[#dfe4dc] bg-white p-1 text-[8px] text-[#21392e]" aria-label="Playback speed" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))}><option value={1}>1×</option><option value={5}>5×</option><option value={10}>10×</option></select>
            </div>
            <div className="border-t border-[#e1e6df] pt-2.5"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 text-[8px] tracking-[.1em] text-[#69786d]">{words.matchMoments} <span className="text-[#738078]">({visibleEvents.length}/{replayEvents.length})</span></h2><select className="border border-[#dfe4dc] bg-white px-2 py-1 text-xs" aria-label="Filter events by type" value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value)}><option value="all">All event types</option>{eventTypes.map((type) => <option key={type} value={type}>{replayEventLabel({ id: "", type, timeSeconds: 0, clock: "", participants: [] }, language)}</option>)}</select></div>
              <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto pr-1">
                {visibleEvents.map((event) => <button key={event.id} className={`grid min-w-0 grid-cols-[48px_15px_minmax(0,1fr)] items-start gap-2 border border-transparent px-2 py-1.5 text-left hover:border-[#bed4c2] hover:bg-[#e8f0e6] ${activeEvent?.id === event.id ? "bg-[#e8f0e6]" : "bg-[#f0f3ed]"}`} type="button" onClick={() => { setSeconds(event.timeSeconds); setPlaying(false); }}><time className="pt-0.5 text-[9px] tabular-nums text-[#67776c]">{eventClock(event)}</time><i className={`mt-1 grid size-3.5 place-items-center rounded-full text-[6px] not-italic text-white ${event.type === "score_change" ? "bg-[#e77b50]" : event.type === "match_ended" ? "bg-[#17372d]" : "border border-[#286248]"}`}>{event.type === "score_change" ? "G" : event.type === "match_ended" ? "FT" : ""}</i><span className="min-w-0"><strong className="block font-semibold">{replayEventLabel(event, language)}</strong><span className="block truncate text-[10px] font-normal text-[#6b786f]">{eventDetails(event, match) || event.id}</span></span></button>)}
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-[3px] border border-[#dfe4dc] bg-[#fcfdf9] p-4 max-sm:p-3.5" aria-labelledby="insight-title">
            <div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-[8px] font-bold tracking-[.12em] text-[#367254]">02 / INTERPRET</p><h2 id="insight-title" className="m-0 text-lg font-bold uppercase">{words.insight}</h2></div><span className="bg-[#edf2e8] px-2 py-1 text-[7px] font-bold text-[#287247]">✓ {words.supported}</span></div>
            <div className="my-3 inline-flex gap-0.5 bg-[#edf0e9] p-0.5" role="group" aria-label="Audience wording"><button className={`min-w-[65px] px-2 py-1.5 text-[8px] ${audience === "fan" ? "bg-white font-bold text-[#1c3028] shadow-sm" : "text-[#6c796f]"}`} type="button" onClick={() => setAudience("fan")}>{words.fan}</button><button className={`min-w-[65px] px-2 py-1.5 text-[8px] ${audience === "analyst" ? "bg-white font-bold text-[#1c3028] shadow-sm" : "text-[#6c796f]"}`} type="button" onClick={() => setAudience("analyst")}>{words.analyst}</button></div>
            <article className="border-l-[3px] border-[#286248] bg-[#f0f3ed] p-[13px]"><span className="text-[7px] font-bold tracking-[.08em] text-[#728076]">{words.insight} · {words.totals}</span><h2 className="my-2 text-[17px] font-bold leading-tight">{words.headline}</h2><p className="insight-copy m-0 leading-[1.7] text-[#48594e]">{insight}</p><div className="mt-2 flex items-center gap-1.5 border-t border-[#dfe5db] pt-2 text-[7px] text-[#718075]"><b className="grid size-3 place-items-center rounded-full border border-[#a0afa2] text-[8px]">i</b>{words.caution}</div></article>
            <div className="border-b border-[#e1e6df]"><button className="flex w-full items-center gap-2 py-3 text-left text-[8px] font-bold" type="button" aria-expanded={showEvidence} onClick={() => setShowEvidence((value) => !value)}>{words.evidence}<span className="ml-auto text-[7px] text-[#879188]">{evidenceSources.length}</span><b className="text-xs text-[#286248]">{showEvidence ? "−" : "+"}</b></button>{showEvidence && <div className="grid gap-2 pb-2.5">{evidenceSources.map(({ label, value }) => <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-0.5 text-[8px]" key={label}><strong className="row-span-2 text-[7px] text-[#367254]">{label}</strong><span>{value}</span><small className="text-[7px] text-[#7b877d]">{words.source}</small></div>)}</div>}</div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[7px] text-[#7b877d]"><i className="size-[5px] rounded-full bg-[#c6a346]" /> {words.template}</p>
          </section>
        </div>

        <div className="mt-[13px] grid grid-cols-[minmax(0,1.2fr)_minmax(350px,.8fr)] gap-[13px] max-[850px]:mt-2.5 max-[850px]:grid-cols-1 max-[850px]:gap-2.5">
          <section className="min-w-0 rounded-[3px] border border-[#dfe4dc] bg-[#fcfdf9] p-4 max-sm:p-3.5" aria-labelledby="totals-title">
            <div className="mb-2.5 flex items-center justify-between gap-4">
              <div className="shrink-0"><p className="mb-1 text-[8px] font-bold tracking-[.12em] text-[#367254]">03 / MATCH DATA</p><h2 id="totals-title" className="m-0 text-base font-bold uppercase">{words.totals}</h2></div>
              <span className="max-w-[50%] text-right text-xs leading-snug text-[#7a867d]">{words.totalsHint}</span>
            </div>
            <div className="border-t border-[#e1e6df]">
              <div className="grid min-h-9 grid-cols-[minmax(32px,.55fr)_minmax(24px,.7fr)_minmax(100px,1.2fr)_minmax(24px,.7fr)_minmax(32px,.55fr)] items-center text-xs font-bold text-[#78847b] max-sm:grid-cols-[minmax(28px,.45fr)_minmax(18px,.55fr)_minmax(96px,1.4fr)_minmax(18px,.55fr)_minmax(28px,.45fr)]">
                <span className="col-span-2 truncate">{match.teams.home.name}</span><span className="text-center text-[10px] tracking-[.1em]">{words.measure}</span><span className="col-span-2 truncate text-right">{match.teams.away.name}</span>
              </div>
              {replayStats.map((stat) => {
                const max = Math.max(stat.home ?? 0, stat.away ?? 0, 1);
                const homeWidth = stat.home === null ? 0 : stat.home / max * 100;
                const awayWidth = stat.away === null ? 0 : stat.away / max * 100;
                return <div className="grid min-h-10 grid-cols-[minmax(32px,.55fr)_minmax(24px,.7fr)_minmax(100px,1.2fr)_minmax(24px,.7fr)_minmax(32px,.55fr)] items-center border-t border-[#edf0e9] max-sm:grid-cols-[minmax(28px,.45fr)_minmax(18px,.55fr)_minmax(96px,1.4fr)_minmax(18px,.55fr)_minmax(28px,.45fr)]" key={stat.key}>
                  <strong className="text-xs tabular-nums">{stat.home === null ? "—" : `${stat.home}${stat.suffix}`}</strong>
                  <span className="h-1.5 min-w-0 bg-[#e5ebe4]" aria-hidden="true"><i className="ml-auto block h-full bg-[#7ea492]" style={{ width: `${homeWidth}%` }} /></span>
                  <span className="whitespace-nowrap text-center text-xs text-[#65746a]">{stat.label}</span>
                  <span className="h-1.5 min-w-0 bg-[#e5ebe4]" aria-hidden="true"><i className="block h-full bg-[#355f91]" style={{ width: `${awayWidth}%` }} /></span>
                  <strong className="text-right text-xs tabular-nums">{stat.away === null ? "—" : `${stat.away}${stat.suffix}`}</strong>
                </div>;
              })}
            </div>
          </section>
          <section className="min-w-0 rounded-[3px] border border-[#dfe4dc] bg-[#fcfdf9] p-4 max-sm:p-3.5" aria-labelledby="outputs-title"><div className="mb-2.5 flex items-center justify-between gap-3"><div><p className="mb-1 text-[8px] font-bold tracking-[.12em] text-[#367254]">04 / PUBLISH</p><h2 id="outputs-title" className="m-0 text-base font-bold uppercase">Studio outputs</h2></div><span className="flex items-center gap-1 text-[7px] font-bold text-[#367254]"><i className="size-[5px] rounded-full bg-[#4f9d62]" /> READY</span></div>
            <div className="flex min-h-[47px] items-center gap-2 border-t border-[#edf0e9]"><span className="grid size-7 flex-none place-content-center bg-[#17372d] text-center text-[7px] font-bold leading-none text-[#d3ed64]">ON<br />AIR</span><div className="min-w-0 flex-1"><h3 className="mb-0.5 text-[10px] font-bold uppercase">{words.overlay}</h3><p className="truncate text-[7px] text-[#77847b]">8 sec · evidence references · review status</p></div><button className="border border-[#d5dfd4] px-2 py-1.5 text-[7px] font-bold text-[#286248] hover:bg-[#edf4e9]" type="button" onClick={() => setShowOverlay((value) => !value)}>{showOverlay ? "Close" : "Preview"}</button></div>
            {showOverlay && <div className="relative border-t border-[#e1e6df] bg-[#f0f3ed] p-2"><pre className="max-h-[145px] overflow-auto text-[7px] leading-relaxed text-[#34493c]">{JSON.stringify(overlay, null, 2)}</pre><button className="absolute bottom-2 right-2 border border-[#d5dfd4] bg-white px-2 py-1.5 text-[7px] font-bold text-[#286248] hover:bg-[#edf4e9]" type="button" onClick={copyOverlay}>{copied ? words.copied : words.copy}</button></div>}
            <div className="flex min-h-[47px] items-center gap-2 border-t border-[#edf0e9]"><span className="grid size-7 flex-none place-content-center bg-[#eee8d8] text-center text-[7px] font-bold leading-none text-[#8d7040]">90<br />MIN</span><div className="min-w-0 flex-1"><h3 className="mb-0.5 text-[10px] font-bold uppercase">{words.recap}</h3><p className="truncate text-[7px] text-[#77847b]">{showRecap ? "Verified events and final statistics" : "Ready from supported match data"}</p></div><button className="border border-[#d5dfd4] px-2 py-1.5 text-[7px] font-bold text-[#286248] hover:bg-[#edf4e9]" type="button" onClick={() => setShowRecap((value) => !value)}>{showRecap ? "Close" : words.generate}</button></div>
            {showRecap && <p className="insight-copy m-0 pl-[37px] pt-2 leading-relaxed text-[#55665a]">{recap}</p>}
          </section>
        </div>
        <footer className="flex justify-between gap-3 pt-4 text-[7px] font-bold tracking-[.08em] text-[#78847b] max-[480px]:text-[6px]"><span>FUTLENS · MATCH STORYLINE STUDIO</span><span>{words.reference}: {match.id}</span></footer>
      </div>
    </main>
  );
}