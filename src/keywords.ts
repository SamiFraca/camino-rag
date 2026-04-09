import BM25 from "wink-bm25-text-search";
import fs from "fs";

let keywordIndex: { engine: any; stages: any[] } | null = null;

export function buildKeywordIndex() {
  const raw = fs.readFileSync("../data/stages.json", "utf-8");
  const stages = JSON.parse(raw);

  const engine = BM25();
  
  engine.defineConfig({ 
    fldWeights: { text: 1, route: 0.5, from: 0.3, to: 0.3 } 
  });
  
  engine.definePrepTasks([
    (text: string) => text.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2)
  ]);

  stages.forEach((stage: any, i: number) => {
    engine.addDoc({ 
      text: stage.text,
      route: stage.route,
      from: stage.from,
      to: stage.to
    }, i);
  });

  engine.consolidate();
  return { engine, stages };
}

export function getKeywordIndex() {
  if (!keywordIndex) {
    keywordIndex = buildKeywordIndex();
  }
  return keywordIndex;
}

export function searchStages(query: string, limit: number = 10): any[] {
  const { engine, stages } = getKeywordIndex();
  const results = engine.search(query);
  
  return results
    .slice(0, limit)
    .map((result: any) => ({
      stage: stages[result[0]],
      score: result[1]
    }));
}
