import "server-only";

import { DefaultAzureCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

export type MatchAnalysisContext = {
  audience: "fan" | "analyst";
  atSeconds: number;
  competition: string;
  season: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number };
  events: { timeSeconds: number; type: string; team?: string; participants: string[] }[];
  stats: { label: string; home: number | null; away: number | null; suffix: string; live: boolean }[];
};

export async function generateMatchAnalysis(context: MatchAnalysisContext) {
  if (!Number.isFinite(context.atSeconds) || !context.homeTeam || !context.awayTeam) {
    throw new Error("Match analysis context is incomplete.");
  }

  const endpoint = process.env.AZURE_AI_PROJECT_ENDPOINT;
  const agentName = process.env.AZURE_AI_AGENT_NAME;
  if (!endpoint || !agentName) {
    throw new Error("AZURE_AI_PROJECT_ENDPOINT and AZURE_AI_AGENT_NAME must be configured.");
  }

  const openAIClient = new AIProjectClient(endpoint, new DefaultAzureCredential()).getOpenAIClient({
    azureConfig: { allowPreview: true, agentName },
  });
  const prompt = [
    `Analyze ${context.homeTeam} vs ${context.awayTeam} only through ${Math.floor(context.atSeconds / 60)}:${String(context.atSeconds % 60).padStart(2, "0")} of the match.`,
    `Audience level: ${context.audience}. For a fan, explain the match in clear, accessible language. For an analyst, give a more detailed evidence-led assessment. Only give one assessment.`,
    "Use only the supplied events, current score, and statistics. Do not infer or mention anything that happens after the stated match time.",
    "Separate observed facts from interpretation. Do not claim tactical causes unless the supplied evidence supports them.",
    "Keep the response concise and use a short heading followed by a few paragraphs or bullets.",
    `Competition: ${context.competition}`,
    `Season: ${context.season}`,
    `Score at this time: ${context.homeTeam} ${context.score.home}–${context.score.away} ${context.awayTeam}`,
    `Statistics available at this time: ${JSON.stringify(context.stats)}`,
    `Match events through this time: ${JSON.stringify(context.events)}`,
    'Never repeat the name of the event that was used in your analysis.'
  ].join("\n");

  const conversation = await openAIClient.conversations.create({
    items: [{ type: "message", role: "user", content: prompt }],
  });
  const response = await openAIClient.responses.create({ conversation: conversation.id });
  return response.output_text.trim();
}
