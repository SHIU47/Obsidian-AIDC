const fs = require('fs');
const data = fs.readFileSync('game-data.js', 'utf8');
const fn = new Function(data + '; return {QUIZ, LEVELS};');
const {QUIZ, LEVELS} = fn();

const levelIds = new Set(LEVELS.map(l => l.id));
const orphans = Object.keys(QUIZ).filter(k => !levelIds.has(k));
const FALLBACK_SIGS = ['常見的設計錯誤', 'PUE 的計算公式', 'CRAC（精密空調機）與 CRAH'];
let fallbackCount = 0, wikiCount = 0, latexCount = 0, dupCount = 0;
const seen = new Set();
let total = 0;

Object.entries(QUIZ).forEach(([k, qs]) => {
  qs.forEach(q => {
    total++;
    const allText = q.q + (q.opts||[]).join('') + (q.ex||'');
    if (FALLBACK_SIGS.some(s => allText.includes(s))) fallbackCount++;
    if (allText.includes('[[') || allText.includes(']]')) wikiCount++;
    const dollarSign = '$';
    if (allText.includes(dollarSign)) latexCount++;
    if (seen.has(q.q)) dupCount++;
    seen.add(q.q);
  });
});

console.log('=== FINAL QUALITY REPORT ===');
console.log('Total questions:', total);
console.log('Unique questions:', seen.size);
console.log('Runtime dups (handled by startExam):', dupCount);
console.log('Orphan QUIZ keys:', orphans.length);
console.log('Fallback questions:', fallbackCount);
console.log('Wikilinks:', wikiCount);
console.log('LaTeX:', latexCount);
console.log(orphans.length === 0 && fallbackCount === 0 && wikiCount === 0 && latexCount === 0 ? 'ALL CLEAR!' : 'Issues remain');
