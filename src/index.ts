import { askCamino } from "./query.js";

async function main() {
  const question = "Plan a 7-day Camino route for a beginner";
  const answer = await askCamino(question);
  console.log(answer);
}

main();