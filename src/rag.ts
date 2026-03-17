import "dotenv/config";
import { Document, VectorStoreIndex, Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import fs from "fs";

Settings.llm = new OpenAI({ model: "gpt-4o-mini", temperature: 0 });
Settings.embedModel = new OpenAIEmbedding();

export interface StageConstraints {
  maxKm?: number;
  level?: "beginner" | "experienced";
}

function filterStages(stages: any[], constraints: StageConstraints): any[] {
  return stages.filter((stage) => {
    if (constraints.maxKm !== undefined && stage.distance_km > constraints.maxKm) {
      return false;
    }
    if (constraints.level === "beginner" && stage.difficulty === "hard") {
      return false;
    }
    return true;
  });
}

export async function createIndex(constraints?: StageConstraints, startFrom?: string, numStages?: number) {
  const raw = fs.readFileSync("data/stages.json", "utf-8");
  const stages = JSON.parse(raw);

  let filteredStages = constraints ? filterStages(stages, constraints) : stages;

  // Sort by route and stage_number for proper ordering
  filteredStages.sort((a: any, b: any) => {
    if (a.route !== b.route) return a.route.localeCompare(b.route);
    return a.stage_number - b.stage_number;
  });

  // If startFrom is specified, find consecutive stages from that point
  if (startFrom && numStages) {
    const startStageIndex = filteredStages.findIndex((s: any) => s.from === startFrom);
    if (startStageIndex >= 0) {
      // Get consecutive stages starting from the found stage
      const routeName = filteredStages[startStageIndex].route;
      const routeStages = filteredStages.filter((s: any) => s.route === routeName);
      const routeStartIndex = routeStages.findIndex((s: any) => s.from === startFrom);
      filteredStages = routeStages.slice(routeStartIndex, routeStartIndex + numStages);
    }
  }

  const documents = filteredStages.map((stage: any) => {
    return new Document({
      text: `
Route: ${stage.route}
Stage: ${stage.stage}
Distance: ${stage.distance_km} km
Difficulty: ${stage.difficulty}
Elevation gain: ${stage.elevation_gain} m

Description:
${stage.text}
      `,
      metadata: {
        route: stage.route,
        stage: stage.stage,
        distance_km: stage.distance_km,
        difficulty: stage.difficulty,
        elevation_gain: stage.elevation_gain
      }
    });
  });

  const index = await VectorStoreIndex.fromDocuments(documents);
  return index;
}