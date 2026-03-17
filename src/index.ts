import { askCamino } from "./query.js";

async function main() {
  const question = "Plan a 4-day Camino route for a beginner starting from Sarria";

  const answer = await askCamino(question);
  console.log(answer);
}

main();