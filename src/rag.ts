import "dotenv/config";
import { Document, VectorStoreIndex, Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import fs from "fs";

Settings.llm = new OpenAI({ model: "gpt-4o-mini", temperature: 0 });
Settings.embedModel = new OpenAIEmbedding();

export async function createIndex() {
  const raw = fs.readFileSync("data/stages.json", "utf-8");
  const stages = JSON.parse(raw);

  const documents = stages.map((stage: any) => {
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