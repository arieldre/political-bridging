export interface PoliticalVector {
  security: number;   // -1.0 to 1.0
  religion: number;   // -1.0 to 1.0
  economics: number;  // -1.0 to 1.0
}

export interface MatchCandidate {
  userId: string;
  vector: PoliticalVector;
  hobbies: string[];
  level: number;
  avgRating: number;
}

// Returns political opposition score (higher = more opposing)
export function politicalOppositionScore(a: PoliticalVector, b: PoliticalVector): number {
  // max possible diff per axis = 2.0 (from -1 to +1)
  const secDiff = Math.abs(a.security - b.security);
  const relDiff = Math.abs(a.religion - b.religion);
  const ecoDiff = Math.abs(a.economics - b.economics);
  return (secDiff + relDiff + ecoDiff) / 3;  // 0 to 2 normalized
}

// Hard filter: at least one axis must differ by >= 0.6
export function meetsOppositionFilter(a: PoliticalVector, b: PoliticalVector): boolean {
  return (
    Math.abs(a.security - b.security) >= 0.6 ||
    Math.abs(a.religion - b.religion) >= 0.6 ||
    Math.abs(a.economics - b.economics) >= 0.6
  );
}

// Time-based relaxation of the opposition threshold
// After 30s: still requires full 0.6 diff
// After 2min: reduces to 0.4 diff
// After 5min: reduces to 0.2 diff (almost anyone)
export function relaxedThreshold(waitSeconds: number): number {
  if (waitSeconds < 30) return 0.6;
  if (waitSeconds < 120) return 0.5;
  if (waitSeconds < 300) return 0.35;
  return 0.2;
}

// Time-relaxed version of meetsOppositionFilter
export function meetsOppositionFilterRelaxed(
  a: PoliticalVector,
  b: PoliticalVector,
  waitSeconds: number
): boolean {
  const threshold = relaxedThreshold(waitSeconds);
  return (
    Math.abs(a.security - b.security) >= threshold ||
    Math.abs(a.religion - b.religion) >= threshold ||
    Math.abs(a.economics - b.economics) >= threshold
  );
}

// Hobby overlap count
export function hobbyOverlap(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter(h => setB.has(h));
}

// Rank candidates: higher score = better match
// NOTE: opposition filter is the caller's responsibility (use meetsOppositionFilterRelaxed).
// scoreCandidate does NOT re-apply the strict threshold so time-based relaxation works.
export function scoreCandidate(
  user: MatchCandidate,
  candidate: MatchCandidate
): number {
  const overlap = hobbyOverlap(user.hobbies, candidate.hobbies);
  const hobbyScore = overlap.length * 2;
  // Value similarity would go here, simplified for MVP
  const ratingBonus = candidate.avgRating >= 4 ? 1 : 0;
  return hobbyScore + ratingBonus;
}

// Calculate political axis score from a set of answers
// answers: array of {value: number, weight: number} where value is 0-4 (Likert)
export function calcAxisScore(answers: Array<{value: number; weight: number}>): number {
  if (!answers.length) return 0;
  const total = answers.reduce((sum, a) => sum + a.value * a.weight, 0);
  const maxPossible = answers.reduce((sum, a) => sum + 4 * a.weight, 0);
  // Normalize to -1..+1 (0 = center, -1 = left/secular/socialist, +1 = right/religious/free-market)
  return (total / maxPossible) * 2 - 1;
}
