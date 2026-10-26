import { NextResponse } from "next/server";
import { generateMatchAnalysis, type MatchAnalysisContext } from "../../match/[id]/match-analysis-agent";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isMatchAnalysisContext(value: unknown): value is MatchAnalysisContext {
  if (!isRecord(value) || !isRecord(value.score)) return false;
  return (value.audience === "fan" || value.audience === "analyst")
    && typeof value.atSeconds === "number"
    && Number.isFinite(value.atSeconds)
    && typeof value.competition === "string"
    && typeof value.season === "string"
    && typeof value.homeTeam === "string"
    && typeof value.awayTeam === "string"
    && typeof value.score.home === "number"
    && typeof value.score.away === "number"
    && Array.isArray(value.events)
    && value.events.every((event) => isRecord(event)
      && typeof event.timeSeconds === "number"
      && typeof event.type === "string"
      && (event.team === undefined || typeof event.team === "string")
      && Array.isArray(event.participants)
      && event.participants.every((participant) => typeof participant === "string"))
    && Array.isArray(value.stats)
    && value.stats.every((stat) => isRecord(stat)
      && typeof stat.label === "string"
      && isNullableNumber(stat.home)
      && isNullableNumber(stat.away)
      && typeof stat.suffix === "string"
      && typeof stat.live === "boolean");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isMatchAnalysisContext(body)) {
    return NextResponse.json({ error: "Match analysis context is incomplete." }, { status: 400 });
  }

  const context: MatchAnalysisContext = {
    ...body,
    events: body.events.filter((event) => event.timeSeconds <= body.atSeconds),
  };

  try {
    const analysis = await generateMatchAnalysis(context);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Unable to generate match analysis", error);
    return NextResponse.json({ error: "Match analysis is unavailable." }, { status: 502 });
  }
}
