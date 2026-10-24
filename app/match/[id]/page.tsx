import { Suspense } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import MatchExperience from "./match-experience";
import type { HistorianContext } from "./historian-agent";
import type { MatchData, MatchEvent, MatchPlayer, MatchQualifier, MatchStat } from "./types";

type FixtureEvent = {
  id: string | number;
  type: string;
  match_clock?: string;
  match_time?: number;
  competitor?: MatchQualifier;
  players?: { id?: string; name: string; type?: string }[];
  home_score?: number;
  away_score?: number;
  period?: number;
  period_name?: string;
  period_type?: string;
  stoppage_time?: number;
  stoppage_time_clock?: string;
  injury_time_announced?: number;
  outcome?: string;
  break_name?: string;
  x?: number;
  y?: number;
};

type Fixture = {
  sport_event: {
    id: string;
    start_time: string;
    sport_event_context: { competition: { name: string }; season: { name: string } };
    competitors: { id: string; name: string; abbreviation: string; qualifier: MatchQualifier }[];
    venue?: { name?: string; city_name?: string };
  };
  sport_event_status: { home_score: number; away_score: number };
  statistics?: { totals?: { competitors?: FixtureCompetitorStats[] } };
  timeline: FixtureEvent[];
};

type FixtureCompetitorStats = {
  qualifier: MatchQualifier;
  statistics: Record<string, number>;
  players?: { id: string; name: string; starter?: boolean }[];
};

const statDefinitions = [
  { key: "ball_possession", label: "Possession", suffix: "%" },
  { key: "shots_total", label: "Shots", suffix: "" },
  { key: "shots_on_target", label: "On target", suffix: "" },
  { key: "corner_kicks", label: "Corners", suffix: "" },
  { key: "yellow_cards", label: "Yellow cards", suffix: "" },
];

function clockSeconds(event: FixtureEvent, previousSeconds: number) {
  if (event.match_clock) {
    const [minutes, seconds] = event.match_clock.split(":").map(Number);
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) return minutes * 60 + seconds;
  }
  if (typeof event.match_time === "number") return event.match_time * 60;
  if (event.type === "period_score") return (event.period ?? 1) * 45 * 60;
  if (event.type === "period_start" && event.period && event.period > 1) return (event.period - 1) * 45 * 60;
  return previousSeconds;
}

function normalizeFixture(id: string, fixture: Fixture): MatchData {
  const home = fixture.sport_event.competitors.find((team) => team.qualifier === "home");
  const away = fixture.sport_event.competitors.find((team) => team.qualifier === "away");
  const homeStats = fixture.statistics?.totals?.competitors?.find((team) => team.qualifier === "home");
  const awayStats = fixture.statistics?.totals?.competitors?.find((team) => team.qualifier === "away");
  const homeTotals = homeStats?.statistics;
  const awayTotals = awayStats?.statistics;

  if (!home || !away || !homeTotals || !awayTotals) notFound();

  let previousSeconds = 0;
  const events: MatchEvent[] = fixture.timeline.map((event) => {
    const players = event.players ?? [];
    const timeSeconds = clockSeconds(event, previousSeconds);
    previousSeconds = Math.max(previousSeconds, timeSeconds);
    return {
      id: String(event.id),
      type: event.type,
      timeSeconds,
      clock: event.match_clock ?? `${event.match_time ?? 0}:00`,
      competitor: event.competitor,
      participants: players.map((player) => ({ id: player.id, name: player.name, role: player.type })),
      scorer: players.find((player) => player.type === "scorer")?.name,
      assist: players.find((player) => player.type === "assist")?.name,
      homeScore: event.home_score,
      awayScore: event.away_score,
      period: event.period,
      periodName: event.period_name,
      periodType: event.period_type,
      stoppageTime: event.stoppage_time,
      stoppageTimeClock: event.stoppage_time_clock,
      announcedInjuryTime: event.injury_time_announced,
      outcome: event.outcome,
      breakName: event.break_name,
      location: typeof event.x === "number" && typeof event.y === "number"
        ? { x: event.x, y: event.y }
        : undefined,
    };
  });

  const stats: MatchStat[] = statDefinitions.flatMap((definition) => {
    const homeValue = homeTotals[definition.key];
    const awayValue = awayTotals[definition.key];
    return typeof homeValue === "number" && typeof awayValue === "number"
      ? [{ ...definition, home: homeValue, away: awayValue }]
      : [];
  });

  const endEvent = events.find((event) => event.type === "match_ended");
  const durationSeconds = endEvent?.timeSeconds || Math.max(...events.map((event) => event.timeSeconds));

  return {
    id,
    competition: fixture.sport_event.sport_event_context.competition.name,
    season: fixture.sport_event.sport_event_context.season.name,
    startTime: fixture.sport_event.start_time,
    venue: fixture.sport_event.venue?.name ?? "",
    city: fixture.sport_event.venue?.city_name ?? "",
    teams: {
      home: { id: home.id, name: home.name, abbreviation: home.abbreviation },
      away: { id: away.id, name: away.name, abbreviation: away.abbreviation },
    },
    squads: {
      home: (homeStats?.players ?? []).map((player): MatchPlayer => ({ id: player.id, name: player.name, starter: player.starter })),
      away: (awayStats?.players ?? []).map((player): MatchPlayer => ({ id: player.id, name: player.name, starter: player.starter })),
    },
    startingLineups: {
      home: (homeStats?.players ?? []).filter((player) => player.starter).map((player): MatchPlayer => ({ id: player.id, name: player.name })),
      away: (awayStats?.players ?? []).filter((player) => player.starter).map((player): MatchPlayer => ({ id: player.id, name: player.name })),
    },
    finalScore: {
      home: fixture.sport_event_status.home_score,
      away: fixture.sport_event_status.away_score,
    },
    durationSeconds,
    events,
    stats,
  };
}

async function loadMatch(id: string) {
  if (!/^\d+$/.test(id)) notFound();

  try {
    const filePath = path.join(process.cwd(), "public", "data", `${id}.json`);
    const fixture = JSON.parse(await readFile(filePath, "utf8")) as Fixture;
    const fixtureId = fixture.sport_event.id.split(":").at(-1);
    if (fixtureId !== id) notFound();
    const match: MatchData = normalizeFixture(id, fixture);
    const historianContext: HistorianContext = {
      competition: match.competition,
      season: match.season,
      startTime: match.startTime,
      venue: match.venue,
      city: match.city,
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeLineup: match.startingLineups.home.map((player) => player.name),
      awayLineup: match.startingLineups.away.map((player) => player.name),
    };

    return <MatchExperience match={match} historianContext={historianContext} />;
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_NOT_FOUND") throw error;
    notFound();
  }
}

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f1f3ed] p-8 font-sans text-[#1c3028]">Preparing the team history...</main>}>
      {params.then(({ id }) => loadMatch(id))}
    </Suspense>
  );
}
