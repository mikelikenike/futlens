export type MatchQualifier = "home" | "away";

export type MatchPlayer = {
  id: string;
  name: string;
  starter?: boolean;
};

export type MatchEvent = {
  id: string;
  type: string;
  timeSeconds: number;
  clock: string;
  competitor?: MatchQualifier;
  participants: { id?: string; name: string; role?: string }[];
  scorer?: string;
  assist?: string;
  homeScore?: number;
  awayScore?: number;
  period?: number;
  periodName?: string;
  periodType?: string;
  stoppageTime?: number;
  stoppageTimeClock?: string;
  announcedInjuryTime?: number;
  outcome?: string;
  breakName?: string;
  location?: { x: number; y: number };
};

export type MatchStat = {
  key: string;
  label: string;
  home: number;
  away: number;
  suffix: string;
};

export type MatchData = {
  id: string;
  competition: string;
  season: string;
  startTime: string;
  venue: string;
  city: string;
  teams: {
    home: { id: string; name: string; abbreviation: string };
    away: { id: string; name: string; abbreviation: string };
  };
  squads: Record<MatchQualifier, MatchPlayer[]>;
  startingLineups: Record<MatchQualifier, MatchPlayer[]>;
  finalScore: { home: number; away: number };
  durationSeconds: number;
  events: MatchEvent[];
  stats: MatchStat[];
};