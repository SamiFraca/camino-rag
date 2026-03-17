import { createIndex, StageConstraints } from "./rag.js";
import { searchStages } from "./keywords.js";
import fs from "fs";

interface Stage {
  route: string;
  stage: string;
  stage_number: number;
  from: string;
  to: string;
  distance_km: number;
  difficulty: string;
  elevation_gain: number;
  text: string;
}

interface ParsedPlan {
  route: string;
  days: { day: number; from: string; to: string }[];
  why: string;
}

function parsePlan(response: string): ParsedPlan | null {
  const lines = response.trim().split("\n");
  const plan: ParsedPlan = { route: "", days: [], why: "" };
  
  let inWhySection = false;
  let whyLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Route:")) {
      plan.route = trimmed.replace("Route:", "").trim();
    } else if (trimmed.match(/^Day \d+:/i)) {
      const dayMatch = trimmed.match(/^Day (\d+):\s*(.+)/i);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1]);
        const stageText = dayMatch[2];
        // Remove parenthetical metadata like (~22 km, easy)
        const cleanStageText = stageText.replace(/\s*\(.*?\)\s*$/, "").trim();
        const arrowMatch = cleanStageText.match(/(.+?)\s*→\s*(.+)/);
        if (arrowMatch) {
          plan.days.push({
            day: dayNum,
            from: arrowMatch[1].trim(),
            to: arrowMatch[2].trim()
          });
        }
      }
    } else if (trimmed.startsWith("Why")) {
      inWhySection = true;
      whyLines.push(trimmed.replace(/^Why:?/, "").trim());
    } else if (inWhySection && trimmed && !trimmed.startsWith("User")) {
      whyLines.push(trimmed);
    }
  }
  
  plan.why = whyLines.join(" ").trim();
  return plan.days.length > 0 ? plan : null;
}

function loadAllStages(): Stage[] {
  const raw = fs.readFileSync("data/stages.json", "utf-8");
  return JSON.parse(raw);
}

function findStage(stages: Stage[], from: string, to: string): Stage | undefined {
  return stages.find(s => s.from === from && s.to === to);
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  totalDistance: number;
  avgDifficulty: string;
}

function validatePlan(plan: ParsedPlan, allStages: Stage[], maxKm: number, expectedDays: number): ValidationResult {
  const errors: string[] = [];
  let totalDistance = 0;
  const difficulties: string[] = [];
  
  // Check number of days matches
  if (plan.days.length !== expectedDays) {
    errors.push(`Expected ${expectedDays} days but got ${plan.days.length}`);
  }
  
  // Check each day and connections
  for (let i = 0; i < plan.days.length; i++) {
    const day = plan.days[i];
    const stage = findStage(allStages, day.from, day.to);
    
    if (!stage) {
      errors.push(`Day ${day.day}: Stage "${day.from} → ${day.to}" not found in data`);
      continue;
    }
    
    // Check distance constraint
    if (stage.distance_km > maxKm) {
      errors.push(`Day ${day.day}: Distance ${stage.distance_km}km exceeds max ${maxKm}km`);
    }
    
    totalDistance += stage.distance_km;
    difficulties.push(stage.difficulty);
    
    // Check continuity (end of day N should match start of day N+1)
    if (i < plan.days.length - 1) {
      const nextDay = plan.days[i + 1];
      if (day.to !== nextDay.from) {
        errors.push(`Gap detected: Day ${day.day} ends at "${day.to}" but Day ${nextDay.day} starts from "${nextDay.from}"`);
      }
    }
  }
  
  // Check difficulty consistency
  const hardCount = difficulties.filter(d => d === "hard").length;
  const easyCount = difficulties.filter(d => d === "easy").length;
  
  if (hardCount > difficulties.length / 2) {
    errors.push(`Too many hard stages (${hardCount}/${difficulties.length}) for beginner route`);
  }
  
  // Check total distance reasonableness (roughly 15-30km per day avg)
  const avgDistance = totalDistance / plan.days.length;
  if (avgDistance > 30) {
    errors.push(`Average distance ${avgDistance.toFixed(1)}km/day is too high`);
  }
  if (avgDistance < 10) {
    errors.push(`Average distance ${avgDistance.toFixed(1)}km/day is suspiciously low`);
  }
  
  const avgDifficulty = hardCount > easyCount ? "hard" : easyCount > hardCount ? "easy" : "medium";
  
  return {
    valid: errors.length === 0,
    errors,
    totalDistance,
    avgDifficulty
  };
}

export async function askCamino(question: string, maxRetries: number = 3): Promise<string> {
  // Parse days from question (e.g., "7-day" or "4 days")
  const daysMatch = question.match(/(\d+)-?\s*(?:day|days)/i);
  const days = daysMatch ? parseInt(daysMatch[1]) : 4;
  
  // Parse level from question
  const level = question.toLowerCase().includes("beginner") ? "beginner" : "experienced";

  const constraints: StageConstraints = {
    maxKm: 35,
    level: level === "beginner" ? "beginner" : "experienced"
  };

  const allStages = loadAllStages();
  
  let lastResponse = "";
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const index = await createIndex(constraints);

    const queryEngine = index.asQueryEngine({
      similarityTopK: 5
    });

    // Find relevant stages using keyword search
    const relevantStages = searchStages(question, 5);
    const stageHints = relevantStages.map(s => `- ${s.stage.route}: ${s.stage.from} → ${s.stage.to} (${s.stage.distance_km}km, ${s.stage.difficulty})`).join("\n");

    const retryHint = attempt > 0 
      ? `\n\nPREVIOUS ATTEMPT FAILED:\n${lastErrors.join("\n")}\n\nPlease fix these issues and try again.` 
      : "";

    const prompt = `
You are a Camino de Santiago planner.

RELEVANT STAGES FOR THIS QUERY:
${stageHints}

STRICT RULES:
- Use ONLY exact stage names from the provided data
- Stages MUST be consecutive (end of day N = start of day N+1)
- You MAY combine last 2 stages into final day if needed (e.g., Arzúa → Santiago)
- Respect max distance per day (${constraints.maxKm}km)
- If constraints are bad, say so

Example for beginner, 4 days from Sarria:
Route: Camino Francés
Start: Sarria (popular final stretch)
Day 1: Sarria → Portomarín (~22 km, easy)
Day 2: Portomarín → Palas de Rei (~25 km, medium)
Day 3: Palas de Rei → Arzúa (~29 km, medium)
Day 4: Arzúa → Santiago (~39 km, note: combines last 2 stages)

Why:
- avoids difficult mountain start
- fits 4-day constraint
- most popular final stretch

${retryHint}

CRITICAL: You MUST respond in this exact format:

Route: [route name]
Start: [location with reasoning]
Day 1: [from → to] (~[distance] km, [difficulty])
Day 2: [from → to] (~[distance] km, [difficulty])
...

Why:
[bullet points with reasoning, not vibes]

User question:
${question}
  `;

    const response = await queryEngine.query({ query: prompt });
    lastResponse = response.toString();

    // Reality check
    const plan = parsePlan(lastResponse);
    if (!plan) {
      lastErrors = ["Failed to parse plan format"];
      continue;
    }

    const validation = validatePlan(plan, allStages, constraints.maxKm!, days);
    
    if (validation.valid) {
      // Add validation summary to output
      return `${lastResponse}\n\n---\n✓ Plan validated: ${days} days, ${validation.totalDistance}km total, avg difficulty: ${validation.avgDifficulty}`;
    }
    
    lastErrors = validation.errors;
    console.log(`Attempt ${attempt + 1} failed:`, validation.errors);
  }

  // All retries exhausted
  return `${lastResponse}\n\n---\n⚠ Validation failed after ${maxRetries} attempts:\n${lastErrors.join("\n")}`;
}