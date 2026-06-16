// fix_quiz_cache.js - Clean all quiz cache entries
import fs from 'fs';

const CACHE_FILE = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizbank_cache.json';

function cleanText(str) {
  if (!str) return '';
  let s = str;
  // Remove wikilinks [[Link|Text]] -> Text, or [[Link]] -> Link
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1');
  // Remove any stray [[ or ]] brackets
  s = s.replace(/\[\[/g, '');
  s = s.replace(/\]\]/g, '');
  // Clean LaTeX: $...$  or \(...\) or \[...\]
  // For simple symbols, convert to readable text
  s = s.replace(/\$\\le\s*/g, '≤');
  s = s.replace(/\$\\ge\s*/g, '≥');
  s = s.replace(/\$\\approx\s*/g, '≈');
  s = s.replace(/\$\\times\s*/g, '×');
  s = s.replace(/\$\\pm\s*/g, '±');
  s = s.replace(/\$\\to\s*/g, '→');
  s = s.replace(/\$\\rightarrow\s*/g, '→');
  s = s.replace(/\$\\mu/g, 'μ');
  s = s.replace(/\\mu/g, 'μ');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\le\b/g, '≤');
  s = s.replace(/\\ge\b/g, '≥');
  // Remove all remaining LaTeX delimiters and commands
  // Pattern: $...$
  s = s.replace(/\$([^$]+)\$/g, (m, inner) => {
    // Try to extract readable text from common LaTeX patterns
    let clean = inner
      .replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1')  // \cmd{text} -> text
      .replace(/\\[a-zA-Z]+/g, '')                 // \cmd -> ''
      .replace(/[{}_^\\]/g, '')                    // cleanup special chars
      .replace(/\s+/g, ' ')
      .trim();
    return clean || '';
  });
  // Remove lone $ signs
  s = s.replace(/\$/g, '');
  // Remove LaTeX \(...\) and \[...\]
  s = s.replace(/\\\(([^)]*)\\\)/g, '$1');
  s = s.replace(/\\\[([^\]]*)\\\]/g, '$1');
  // Clean up extra backslashes
  s = s.replace(/\\{2,}/g, '');
  s = s.replace(/\\/g, '');
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

let fixedEntries = 0;
let fixedQuestions = 0;

for (const [lid, entry] of Object.entries(cache)) {
  if (!entry.questions) continue;
  let changed = false;
  
  // De-duplicate questions within each level
  const seen = new Set();
  entry.questions = entry.questions.filter(q => {
    const key = q.q;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  for (const q of entry.questions) {
    const beforeQ = q.q;
    const beforeOpts = JSON.stringify(q.opts);
    const beforeEx = q.ex;
    
    q.q = cleanText(q.q);
    q.opts = q.opts.map(o => cleanText(o));
    if (q.ex) q.ex = cleanText(q.ex);
    
    // Also clean the question text that still has wikilink fragments in the question title itself
    // e.g. "「[[離心式 vs 螺桿式冷凍機」" -> "「離心式 vs 螺桿式冷凍機」"
    q.q = q.q.replace(/「[^「」]*」/g, (m) => m);  // keep as-is if already clean
    
    if (q.q !== beforeQ || JSON.stringify(q.opts) !== beforeOpts || q.ex !== beforeEx) {
      changed = true;
      fixedQuestions++;
    }
  }
  
  if (changed) fixedEntries++;
}

fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Fixed ${fixedQuestions} questions across ${fixedEntries} levels.`);
console.log('Cache updated successfully!');
