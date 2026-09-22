// Real job keywords we know are spelled correctly
const KNOWN_KEYWORDS = [
  'python', 'javascript', 'typescript', 'java', 'golang', 'rust', 'react', 'node',
  'nextjs', 'vue', 'angular', 'swift', 'kotlin', 'sql', 'aws', 'docker', 'kubernetes',
  'engineer', 'engineering', 'developer', 'backend', 'frontend', 'fullstack', 'devops',
  'data', 'analyst', 'scientist', 'machine learning', 'ai', 'ml',
  'designer', 'design', 'product', 'manager', 'marketing', 'sales', 'growth', 'support',
  'operations', 'finance', 'content', 'writer', 'recruiter',
  'intern', 'internship', 'junior', 'senior', 'founding', 'new grad', 'entry level',
  'remote', 'hybrid', 'onsite', 'contract', 'part-time', 'full-time',
];

// Levenshtein: how many edits to turn word a into word b
export function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // remove a letter
        dp[i][j - 1] + 1,        // add a letter
        dp[i - 1][j - 1] + cost  // replace a letter (or keep if same)
      );
    }
  }
  return dp[a.length][b.length];
}

// Fix one keyword
export function correctKeyword(word: string): string {
  const w = word.toLowerCase().trim();
  if (KNOWN_KEYWORDS.includes(w)) return w;

  let best = w;
  let bestDist = Infinity;
  for (const known of KNOWN_KEYWORDS) {
    const d = levenshtein(w, known);
    if (d < bestDist) {
      bestDist = d;
      best = known;
    }
  }

  // Short words: allow 1 mistake. Longer words: allow 2.
  const maxAllowed = w.length <= 4 ? 1 : 2;
  return bestDist <= maxAllowed ? best : w;
}

// Fix a whole list like "pyhton, raect, remote"
export function correctKeywords(input: string) {
  const changes: { from: string; to: string }[] = [];

  const fixed = input
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .map((k) => {
      const c = correctKeyword(k);
      if (c !== k.toLowerCase()) changes.push({ from: k, to: c });
      return c;
    });

  return { corrected: fixed.join(', '), changes };
}