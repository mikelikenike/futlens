import "server-only";

import { DefaultAzureCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

export type HistorianContext = {
  competition: string;
  season: string;
  startTime: string;
  venue: string;
  city: string;
  homeTeam: string;
  awayTeam: string;
  homeLineup: string[];
  awayLineup: string[];
};

export async function generateTeamHistory(context: HistorianContext) {
  if (!context?.homeTeam || !context.awayTeam) {
    throw new Error("Historian context must include both team names.");
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
    `Prepare a concise pre-match history briefing about ${context.homeTeam} and ${context.awayTeam}.`,
    "Cover each club's background briefly and rivalry or historical connection.",
    "Add a paragraph about the significance of the match in the context of the competition and season.",
    "Do not reveal, infer, or hint at this match's result or any events that happened during it.",
    "Never include any information about context and whether it was used in your analysis in the response.",
    "When a detail is uncertain, omit it.",
    "Return readable prose with short headings.",
    "Fixture context:",
    `Competition: ${context.competition}`,
    `Season: ${context.season}`,
    `Date: ${context.startTime}`,
    `Venue: ${[context.venue, context.city].filter(Boolean).join(", ") || "not supplied"}`,
    `Home team: ${context.homeTeam}`,
    `Away team: ${context.awayTeam}`,
    `Home lineup: ${context.homeLineup.join(", ") || "not supplied"}`,
    `Away lineup: ${context.awayLineup.join(", ") || "not supplied"}`,
  ].join("\n");

  const conversation = await openAIClient.conversations.create({
    items: [{ type: "message", role: "user", content: prompt }],
  });
  const response = await openAIClient.responses.create({ conversation: conversation.id });
  return response.output_text.trim();
}
