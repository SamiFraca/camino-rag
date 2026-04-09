import "dotenv/config";
import { Document, VectorStoreIndex, Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import fs from "fs";

Settings.llm = new OpenAI({ model: "gpt-4o-mini", temperature: 0 });
Settings.embedModel = new OpenAIEmbedding();

export interface StageConstraints {
  maxKm: number;
  level: "beginner" | "experienced";
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

export async function createIndex(constraints: StageConstraints) {
  const raw = fs.readFileSync("../data/stages.json", "utf-8");
  const allStages = JSON.parse(raw);

  let filteredStages = filterStages(allStages, constraints);

  // Sort by route and stage_number for proper ordering
  filteredStages.sort((a: any, b: any) => {
    if (a.route !== b.route) return a.route.localeCompare(b.route);
    return a.stage_number - b.stage_number;
  });

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
        stage_number: stage.stage_number,
        from: stage.from,
        to: stage.to,
        distance_km: stage.distance_km,
        difficulty: stage.difficulty,
        elevation_gain: stage.elevation_gain
      }
    });
  });

  const index = await VectorStoreIndex.fromDocuments(documents);
  return index;
}