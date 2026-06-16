// final_cleanup.js - Final cleanup of all remaining quiz issues in quizbank_cache.json
import fs from 'fs';

const CACHE_FILE = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizbank_cache.json';

function cleanText(str) {
  if (!str) return '';
  let s = str;
  // Wikilinks
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/\[\[/g, '').replace(/\]\]/g, '');
  // LaTeX symbols -> Unicode
  s = s.replace(/\\le\b/g, '≤').replace(/\\ge\b/g, '≥');
  s = s.replace(/\\approx\b/g, '≈').replace(/\\times\b/g, '×');
  s = s.replace(/\\pm\b/g, '±').replace(/\\to\b/g, '→');
  s = s.replace(/\\rightarrow\b/g, '→').replace(/\\mu\b/g, 'μ');
  s = s.replace(/\\rho\b/g, 'ρ').replace(/\\cdot\b/g, '·');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+/g, '');
  // LaTeX delimiters
  s = s.replace(/\$([^$]*)\$/g, (m, inner) => inner.replace(/[{}_^\\]/g, '').trim());
  s = s.replace(/\$/g, '');
  s = s.replace(/[{}_^\\]/g, '');
  // Emoji-only options
  s = s.replace(/^[🌟🔧❌⚠️✅—–\s]+$/, (m) => {
    if (m.includes('🌟')) return '首選推薦';
    if (m.includes('🔧')) return '專業安裝';
    if (m.includes('❌')) return '不適用';
    return '待確認';
  });
  s = s.replace(/\*\*+/g, '');
  s = s.replace(/[*_#`>\-\+]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// For the c_dbde level (vendor matrix) - the questions use [[Vendor]] which is wikilink name
// Fix by cleaning the question text
function fixVendorQuestion(q) {
  // Question: "...「[[Vertiv]]」規格描述..." -> "...「Vertiv」規格描述..."
  q.q = cleanText(q.q);
  q.opts = q.opts.map(o => {
    // Fix options that are emoji-only (like 🌟 首選, 🔧 專家, —)
    const cleaned = o.trim();
    if (cleaned === '🌟 首選' || cleaned === '🌟首選') return '🌟 首選（首推廠商）';
    if (cleaned === '🔧 專家' || cleaned === '🔧專家') return '🔧 專家（技術整合）';
    if (cleaned === '—' || cleaned === '-' || cleaned === '—') return '備選方案';
    return cleanText(o);
  });
  if (q.ex) q.ex = cleanText(q.ex);
  return q;
}

// For 800vdc questions with LaTeX $I^2R$ in question text
function fixLatexQuestion(q) {
  q.q = cleanText(q.q);
  // Also clean question title that says "傳輸損耗 (I^2R)" 
  q.q = q.q.replace('傳輸損耗 (I2R)', '傳輸損耗 (I²R)');
  q.q = q.q.replace('傳輸損耗 (I2R)', '傳輸損耗 (I²R)');
  q.opts = q.opts.map(o => cleanText(o));
  if (q.ex) q.ex = cleanText(q.ex);
  return q;
}

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

// For c_dbde (vendor matrix) - fix wikilink questions
if (cache['c_dbde']) {
  cache['c_dbde'].questions = cache['c_dbde'].questions.map(q => {
    if (q.q.includes('[[') || q.q.includes(']]')) return fixVendorQuestion(q);
    return q;
  });
}

// For 800vdc_ff62 - fix LaTeX in questions
if (cache['800vdc_ff62']) {
  cache['800vdc_ff62'].questions = cache['800vdc_ff62'].questions.map(q => {
    const hasLatex = (q.q + q.opts.join('') + (q.ex||'')).includes('$');
    if (hasLatex) return fixLatexQuestion(q);
    return q;
  });
  // Deduplicate
  const seen = new Set();
  cache['800vdc_ff62'].questions = cache['800vdc_ff62'].questions.filter(q => {
    if (seen.has(q.q)) return false;
    seen.add(q.q);
    return true;
  });
}

// For cmp_f9f290 - fix LaTeX in column headers used in questions
if (cache['cmp_f9f290']) {
  cache['cmp_f9f290'].questions = cache['cmp_f9f290'].questions.map(q => {
    const hasLatex = (q.q + q.opts.join('') + (q.ex||'')).includes('$');
    if (hasLatex) {
      q.q = cleanText(q.q);
      // Fix question text: "密度 $\rho$ ($\text{kg/m}^3$)" -> "密度 ρ (kg/m³)"
      q.q = q.q.replace(/密度 ([^」]*?)」/, (m, inner) => '密度 ρ (kg/m³)」');
      q.q = q.q.replace(/比熱容 ([^」]*?)」/, (m, inner) => '比熱容 Cp (kJ/kg·K)」');
      q.q = q.q.replace(/體積熱容量 ([^」]*?)」/, (m, inner) => '體積熱容量 (kJ/m³·K)」');
      q.opts = q.opts.map(o => cleanText(o));
      if (q.ex) q.ex = cleanText(q.ex);
    }
    return q;
  });
  // Deduplicate
  const seen = new Set();
  cache['cmp_f9f290'].questions = cache['cmp_f9f290'].questions.filter(q => {
    if (seen.has(q.q)) return false;
    seen.add(q.q);
    return true;
  });
}

// Global final pass - clean ALL entries
for (const [lid, entry] of Object.entries(cache)) {
  if (!entry.questions) continue;
  
  // Deduplicate within level
  const seen = new Set();
  entry.questions = entry.questions.filter(q => {
    if (seen.has(q.q)) return false;
    seen.add(q.q);
    return true;
  });
  
  // Clean all text
  entry.questions.forEach(q => {
    q.q = cleanText(q.q);
    q.opts = q.opts.map(o => cleanText(o) || '待確認');
    if (q.ex) q.ex = cleanText(q.ex);
    // Validate ans index
    if (q.ans < 0 || q.ans >= q.opts.length) q.ans = 0;
    // Ensure exactly 4 options
    while (q.opts.length < 4) q.opts.push('其他選項' + q.opts.length);
    if (q.opts.length > 4) q.opts = q.opts.slice(0, 4);
  });
}

fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
console.log('Final cleanup complete!');

// Verification
let issues = 0;
for (const [lid, entry] of Object.entries(cache)) {
  if (!entry.questions) continue;
  entry.questions.forEach(q => {
    const allText = q.q + q.opts.join('') + (q.ex||'');
    if (allText.includes('[[') || allText.includes(']]')) { issues++; console.log('WIKI:', lid, q.q.slice(0,60)); }
    if (allText.includes('$')) { issues++; console.log('LATEX:', lid, q.q.slice(0,60)); }
  });
}
console.log('Remaining issues:', issues);
