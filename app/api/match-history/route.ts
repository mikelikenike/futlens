import { NextResponse } from "next/server";
import { generateTeamHistory, type HistorianContext } from "../../match/[id]/historian-agent";

function isHistorianContext(value: unknown): value is HistorianContext {
  if (!value || typeof value !== "object") return false;
  const context = value as Record<string, unknown>;
  return typeof context.homeTeam === "string"
    && typeof context.awayTeam === "string"
    && typeof context.competition === "string"
    && typeof context.season === "string"
    && typeof context.startTime === "string"
    && typeof context.venue === "string"
    && typeof context.city === "string"
    && Array.isArray(context.homeLineup)
    && context.homeLineup.every((name) => typeof name === "string")
    && Array.isArray(context.awayLineup)
    && context.awayLineup.every((name) => typeof name === "string");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isHistorianContext(body)) {
    return NextResponse.json({ error: "Match history context is incomplete." }, { status: 400 });
  }

  try {
    const history = await generateTeamHistory(body);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("Unable to generate team history", error);
    return NextResponse.json({ error: "Team history is unavailable." }, { status: 502 });
  }
}
