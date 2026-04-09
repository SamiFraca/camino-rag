import { askCamino } from "./query.js";

async function main() {
  const question = "What is the best way to start the Camino in Galicia?";
  const answer = await askCamino(question);
  console.log(answer);
}

main();