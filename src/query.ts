import { createIndex } from "./rag.js";

export async function askCamino(question: string) {
  const index = await createIndex();

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

User question:
${question}
  `;

  const response = await queryEngine.query({ query: prompt });

  return response.toString();
}