/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BirkmanComponentId, BirkmanResult } from "./schemas";
import { BIRKMAN_QUESTIONS } from "../data/questions";

/**
 * Pure function to calculate scores from raw answers
 */
export function analyzeBirkman(
  name: string,
  role: string,
  answers: Record<number, number>,
  responseTimes?: Record<number, number>
): BirkmanResult {
  const components: BirkmanComponentId[] = ["SE", "PE", "EE", "AS", "IN", "TH", "RE", "AU", "IC"];
  
  const scores: any = {};
  
  // Normalized answers (mapping reversed questions)
  const normalizedAnswers: Record<number, number> = {};
  BIRKMAN_QUESTIONS.forEach((q, i) => {
    const val = answers[i] || 3;
    normalizedAnswers[i] = q[1] ? (6 - val) : val;
  });

  components.forEach((comp) => {
    // 1. Calculate Usual (0-124)
    const usualQs = BIRKMAN_QUESTIONS.slice(0, 125)
      .map((q, i) => ({ q, i }))
      .filter((x) => x.q[0] === comp);
      
    const usualSum = usualQs.reduce((acc, x) => acc + normalizedAnswers[x.i], 0);

    // 2. Calculate Need (125-249)
    const needQs = BIRKMAN_QUESTIONS.slice(125, 250)
      .map((q, i) => ({ q, i: i + 125 }))
      .filter((x) => x.q[0] === comp);
      
    const needSum = needQs.reduce((acc, x) => acc + normalizedAnswers[x.i], 0);

    // Dynamic Normalization to 0-100 scale
    const usualMax = usualQs.length * 5;
    const needMax = needQs.length * 5;
    
    scores[comp] = {
      usual: Math.round((usualSum / usualMax) * 100),
      need: Math.round((needSum / needMax) * 100),
    };
  });

  // Reliability Logic
  let reliabilityScore = 100;

  // 1. Consistency Checks (Trap Questions)
  const trapPairs = [
    [7, 16],   // SE Usual
    [11, 29],  // IN Usual
    [8, 17],   // PE Usual
    [133, 142],// SE Need
    [137, 164],// IN Need
    [138, 147],// TH Need
  ];

  let inconsistencyCount = 0;
  trapPairs.forEach(([i1, i2]) => {
    const diff = Math.abs(normalizedAnswers[i1] - (normalizedAnswers[i2] || 0));
    if (diff >= 3) inconsistencyCount++; // Major divergence
    else if (diff >= 2) inconsistencyCount += 0.5; // Slight divergence
  });
  
  reliabilityScore -= (inconsistencyCount / trapPairs.length) * 40;

  // 2. Speed Checks
  if (responseTimes) {
    const timesArray = Object.values(responseTimes);
    const fastCount = timesArray.filter(t => t < 800).length; // < 0.8s is suspicious
    const fastRatio = fastCount / Math.max(1, timesArray.length);
    reliabilityScore -= fastRatio * 60;
  }

  reliabilityScore = Math.max(0, Math.round(reliabilityScore));

  // Simplified color logic based on high/low social and assertive energy
  const se = scores.SE.usual;
  const as = scores.AS.usual;
  
  let primaryColor: "red" | "green" | "yellow" | "blue" = "blue";
  if (se >= 50 && as >= 50) primaryColor = "red";
  else if (se >= 50 && as < 50) primaryColor = "green";
  else if (se < 50 && as >= 50) primaryColor = "yellow";
  else primaryColor = "blue";

  return {
    name,
    role,
    scores,
    primaryColor,
    timestamp: Date.now(),
    responseTimes: responseTimes ? Object.fromEntries(Object.entries(responseTimes).map(([k, v]) => [k, v])) : undefined,
    reliabilityScore
  };
}

/**
 * Validates data integrity of the result
 */
export function validateResult(result: BirkmanResult): boolean {
  // Check if all 9 components exist
  const components = ["SE", "PE", "EE", "AS", "IN", "TH", "RE", "AU", "IC"];
  const hasAll = components.every(c => !!result.scores[c as BirkmanComponentId]);
  
  // Check score bounds
  const withinBounds = Object.values(result.scores).every(
    s => s.usual >= 0 && s.usual <= 100 && s.need >= 0 && s.need <= 100
  );

  return hasAll && withinBounds && !!result.name;
}
