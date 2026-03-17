import { createIndex, StageConstraints } from "./rag.js";

function getStartPoint(days: number, level: string): string {
  if (days <= 5 && level === "beginner") {
    return "Sarria";
  }
  if (days <= 7) {
    return "Tui";
  }
  return "Saint-Jean-Pied-de-Port";
}

export async function askCamino(question: string, days: number = 4, level: string = "beginner") {
  const constraints: StageConstraints = {
    maxKm: 25,
    level: level === "beginner" ? "beginner" : "experienced"
  };

  const startPoint = getStartPoint(days, level);

  const index = await createIndex(constraints);

  const queryEngine = index.asQueryEngine({
    similarityTopK: 5
  });

  const prompt = `
You are a Camino de Santiago planner.

Rules:
- Recommend a route and stages
- Adapt to user constraints
- Be practical, not generic
- Justify your choices

Start from: ${startPoint}

CRITICAL: You MUST respond in this exact format:

Route: [route name]

Day 1: [start → end]
Day 2: [start → end]
Day 3: [start → end]
...

Why this route:
[2-3 sentences explaining why this route fits the user's request]

User question:
${question}
  `;

  const response = await queryEngine.query({ query: prompt });

  return response.toString();
}