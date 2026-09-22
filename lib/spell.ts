// Real job keywords (single words and phrases)
const KNOWN_KEYWORDS = [
  'python', 'javascript', 'typescript', 'java', 'golang', 'rust', 'react', 'node',
  'nextjs', 'vue', 'angular', 'swift', 'kotlin', 'sql', 'aws', 'docker', 'kubernetes',
  'engineer', 'engineering', 'developer', 'software', 'backend', 'frontend', 'fullstack',
  'devops', 'data', 'analyst', 'scientist', 'machine learning', 'ai', 'ml',
  'designer', 'design', 'product', 'manager', 'marketing', 'sales', 'growth', 'support',
  'operations', 'finance', 'content', 'writer', 'recruiter',
  'intern', 'internship', 'junior', 'senior', 'founding', 'new grad', 'entry level',
  'remote', 'hybrid', 'onsite', 'contract', 'part-time', 'full-time',
  'teacher', 'tutor', 'nurse', 'chef', 'accountant', 'lawyer', 'driver', 'cashier',
];

// Every single word we know, including words inside phrases
// ("machine learning" → also adds "machine" and "learning")
const KNOWN_WORDS = [
  ...new Set([...KNOWN_KEYWORDS, ...KNOWN_KEYWORDS.flatMap((k) => k.split(' '))]),
];

// Keyboard layout (for "keys next to each other")
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const OFFSET = [0, 0.25, 0.75];

function keyPos(ch: string) {
  for (let r = 0; r < ROWS.length; r++) {
    const i = ROWS[r].indexOf(ch);
    if (i >= 0) return { r, x: i + OFFSET[r] };
  }
  return null;
}

function areNeighbors(a: string, b: string): boolean {
  const p = keyPos(a);
  const q = keyPos(b);
  if (!p || !q) return false;
  return Math.abs(p.r - q.r) <= 1 && Math.abs(p.x - q.x) <= 1;
}

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
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

// Fix ONE word
function correctWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (KNOWN_WORDS.includes(w)) return w;

  let best = w;
  let bestDist = Infinity;

  for (const known of KNOWN_WORDS) {
    const d = levenshtein(w, known);

    // First letter different? Only allow a keyboard slip
    if (known[0] !== w[0]) {
      const keyboardSlip =
        d === 1 && known.length === w.length && areNeighbors(known[0], w[0]);
      if (!keyboardSlip) continue;
    }

    if (d < bestDist) {
      bestDist = d;
      best = known;
    }
  }

  const maxAllowed = w.length <= 4 ? 1 : 2;
  return bestDist <= maxAllowed ? best : w;
}

// Fix ONE keyword (can be a phrase): fix each word inside it
export function correctKeyword(phrase: string): string {
  return phrase
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // "software   engineer" → "software engineer"
    .split(' ')
    .map(correctWord)
    .join(' ');
}

// Fix the whole list like "pyhton, software engibeer, remote"
export function correctKeywords(input: string) {
  const changes: { from: string; to: string }[] = [];

  const fixed = input
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .map((k) => {
      const c = correctKeyword(k);
      const original = k.toLowerCase().replace(/\s+/g, ' ');
      if (c !== original) changes.push({ from: k, to: c });
      return c;
    });

  return { corrected: fixed.join(', '), changes };
}