import { askCamino } from "./query.js";

async function main() {
  const question = "Give me a north route";

  const answer = await askCamino(question);
  console.log(answer);
}

main();