// deep_fix_quiz.js - Comprehensive quiz quality fix
// Replaces all low-quality fallback questions with topic-specific ones derived from the wiki content
import fs from 'fs';
import path from 'path';

const CACHE_FILE = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizbank_cache.json';
const WIKI_DIR = 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki';

// ---- Helpers ----
function cleanText(str) {
  if (!str) return '';
  let s = str;
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/\[\[/g, '').replace(/\]\]/g, '');
  s = s.replace(/\\le\b/g, '≤').replace(/\\ge\b/g, '≥');
  s = s.replace(/\\approx\b/g, '≈').replace(/\\times\b/g, '×');
  s = s.replace(/\\pm\b/g, '±').replace(/\\to\b/g, '→');
  s = s.replace(/\\rightarrow\b/g, '→').replace(/\\mu\b/g, 'μ');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+/g, '');
  s = s.replace(/\$([^$]*)\$/g, (m, inner) => inner.replace(/[{}_^\\]/g, '').trim());
  s = s.replace(/\$/g, '');
  s = s.replace(/[{}_^\\]/g, '');
  s = s.replace(/\*\*+/g, '');
  s = s.replace(/[*_#`>\-\+]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Detect fallback-quality questions that should be replaced
const FALLBACK_SIGNATURES = [
  '下列何者為常見的設計錯誤？',
  '在 AIDC 設計中，PUE 的計算公式為？',
  '在 AIDC 設計中，PUE（電力使用效率）',
  '在機房精密空調中，CRAC（精密空調機）與 CRAH',
  '在空冷氣流管理中，實施冷通道遏制',
  '在進行機電系統 FMEA（故障模式與效應分析）',
  '在晶片散熱中，TIM（熱介面材料',
  '針對 NVIDIA GB200 NVL72 機架',
  '根據 Uptime Institute 標準，以下關於 Tier III',
  '在資料中心空間架構中，哪一個區域（Space）主要放置 IT 設備',
  'CFD 模擬（計算流體力學）最主要用途',
  'CFD 能模擬',
];

function isFallbackQuestion(q) {
  return FALLBACK_SIGNATURES.some(sig => q.q.includes(sig));
}

// Read wiki file for a level and extract key content
function extractWikiContent(sourcePath) {
  if (!sourcePath) return null;
  
  const fullPath = path.join(WIKI_DIR, sourcePath);
  if (!fs.existsSync(fullPath)) return null;
  
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return raw;
  } catch {
    return null;
  }
}

// Generate smart replacement questions from wiki content
function generateSmartQuestions(entry, title, levelId) {
  const wikiRaw = extractWikiContent(entry.source);
  const newQuestions = [];
  
  if (!wikiRaw) return [];
  
  // Extract bullet points, key facts
  const lines = wikiRaw.split('\n').map(l => l.trim());
  
  // Extract bold terms with definitions
  const boldTermDefs = [];
  for (const line of lines) {
    const m = line.match(/^\s*[-*+\d.]*\s*\*\*([^*]+)\*\*\s*[:：\-]\s*(.+)/);
    if (m) {
      const term = cleanText(m[1]);
      const def = cleanText(m[2]);
      if (term.length > 2 && term.length < 40 && def.length > 10 && def.length < 150) {
        boldTermDefs.push({ term, def });
      }
    }
  }
  
  // Extract table data
  const tableLines = lines.filter(l => l.includes('|') && l.length > 5);
  const tables = [];
  if (tableLines.length >= 3) {
    let currentTable = [];
    for (const line of lines) {
      if (line.includes('|')) {
        currentTable.push(line);
      } else if (currentTable.length >= 3) {
        tables.push(currentTable);
        currentTable = [];
      } else {
        currentTable = [];
      }
    }
    if (currentTable.length >= 3) tables.push(currentTable);
  }

  // Generate term-definition questions from bold terms
  for (const bt of boldTermDefs.slice(0, 3)) {
    if (newQuestions.length >= 3) break;
    
    // Get distractors from other terms
    const otherDefs = boldTermDefs
      .filter(x => x.term !== bt.term && x.def !== bt.def)
      .map(x => x.def);
    
    // Add generic distractors if needed
    const genericDistractors = [
      '減少系統備援層級以降低建置成本',
      '增加機架密度但不調整冷卻容量',
      '忽略負載均衡與動態調整機制',
      '採用單電源設計省略 UPS 備援',
    ];
    
    const allDistractors = [...otherDefs, ...genericDistractors]
      .filter(d => d !== bt.def && d.length > 8);
    
    if (allDistractors.length < 3) continue;
    
    const opts = shuffle([bt.def, ...allDistractors.slice(0, 3)]);
    const ansIdx = opts.indexOf(bt.def);
    
    newQuestions.push({
      id: `q_rep_${newQuestions.length + 1}`,
      type: 'choice',
      d: 2,
      q: `在「${title}」的技術規格中，「${bt.term}」的正確定義或技術角色是？`,
      opts,
      ans: ansIdx,
      tag: bt.term.slice(0, 10),
      ex: `「${bt.term}」的關鍵特性：${bt.def}`,
    });
  }
  
  // Generate table-based questions
  for (const tableRawLines of tables) {
    if (newQuestions.length >= 5) break;
    
    const headers = tableRawLines[0].split('|').map(c => cleanText(c)).filter(c => c);
    const rows = [];
    for (let i = 2; i < tableRawLines.length; i++) {
      if (tableRawLines[i].includes('---')) continue;
      const cells = tableRawLines[i].split('|').map(c => cleanText(c)).filter(c => c);
      if (cells.length >= 2) rows.push(cells);
    }
    
    if (rows.length < 2 || headers.length < 2) continue;
    
    for (let colIdx = 1; colIdx < Math.min(headers.length, 4); colIdx++) {
      if (newQuestions.length >= 5) break;
      
      for (let rIdx = 0; rIdx < Math.min(rows.length, 4); rIdx++) {
        if (newQuestions.length >= 5) break;
        
        const subject = rows[rIdx][0];
        const correctVal = rows[rIdx][colIdx];
        const attrName = headers[colIdx];
        
        if (!subject || !correctVal || subject.length < 2 || correctVal.length < 2 || correctVal.length > 80) continue;
        
        // Distractors from other rows (same column)
        const distractors = rows
          .filter((_, idx) => idx !== rIdx)
          .map(r => r[colIdx])
          .filter(v => v && v !== correctVal && v.length > 2 && v.length < 80)
          .slice(0, 3);
        
        if (distractors.length < 2) continue;
        
        // Pad to 3 distractors
        const fallbackDistractors = ['不適用此配置', '視廠商規格而定', '依現場條件調整'];
        while (distractors.length < 3) {
          distractors.push(fallbackDistractors[distractors.length]);
        }
        
        const opts = shuffle([correctVal, ...distractors.slice(0, 3)]);
        const ansIdx = opts.indexOf(correctVal);
        
        // Check for numeric (harder question) or categorical (easier question)
        const isNumeric = /^\d/.test(correctVal) || /\d+[.]\d+/.test(correctVal);
        
        newQuestions.push({
          id: `q_tab_${newQuestions.length + 1}`,
          type: 'choice',
          d: isNumeric ? 3 : 2,
          q: `依照「${title}」的工程規格，「${subject}」的「${attrName}」為何？`,
          opts,
          ans: ansIdx,
          tag: attrName.slice(0, 10),
          ex: `「${subject}」的${attrName}標準值為「${correctVal}」，在 AIDC 設計實務中屬於重要的工程參數。`,
        });
      }
    }
  }
  
  return newQuestions;
}

// ---- Main ----
const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

let totalFixed = 0;
let totalLevels = 0;

for (const [lid, entry] of Object.entries(cache)) {
  if (!entry.questions) continue;
  
  // Find fallback questions to replace
  const keepQuestions = entry.questions.filter(q => !isFallbackQuestion(q));
  const fallbackCount = entry.questions.length - keepQuestions.length;
  
  if (fallbackCount === 0) continue;
  
  // Get title from source path
  const sourcePath = entry.source || '';
  const title = path.basename(sourcePath, '.md').replace(/-/g, ' ').replace(/_/g, ' ');
  
  // Generate smart replacement questions
  const smartQs = generateSmartQuestions(entry, title, lid);
  
  // Use smart questions first, then fallback to generic unique ones
  const replacements = smartQs.slice(0, fallbackCount);
  
  // If we couldn't generate enough smart questions, use unique category-specific ones
  const uniqueFallbacks = [
    {
      q: `在「${title}」的設計實務中，下列哪一個是最關鍵的工程考量？`,
      opts: shuffle(['確保 N+1 備援設計與容錯能力', '優化液冷流量控制與水質管理', '精確計算熱負荷與冷卻需求匹配', '監控 PUE 並持續優化能源效率']),
      ans: 0,
      tag: '設計考量',
      ex: `${title}的設計核心是確保備援可靠性、散熱效率與能源優化三者的平衡。`,
    },
  ];
  
  while (replacements.length < fallbackCount) {
    const fb = uniqueFallbacks[replacements.length % uniqueFallbacks.length];
    replacements.push({
      ...fb,
      id: `q_uniq_${replacements.length + 1}`,
      type: 'choice',
      d: 2,
    });
  }
  
  // Fix answer index if needed
  replacements.forEach(r => {
    if (r.ans < 0 || r.ans >= r.opts.length) {
      r.ans = 0;
    }
  });
  
  // Replace in the questions array
  let repIdx = 0;
  entry.questions = entry.questions.map(q => {
    if (isFallbackQuestion(q) && repIdx < replacements.length) {
      return { ...replacements[repIdx++], d: q.d }; // keep original difficulty slot
    }
    return q;
  });
  
  // Clean all text
  entry.questions.forEach(q => {
    q.q = cleanText(q.q);
    q.opts = q.opts.map(o => cleanText(o));
    if (q.ex) q.ex = cleanText(q.ex);
  });
  
  // Dedup
  const seenQs = new Set();
  entry.questions = entry.questions.filter(q => {
    if (seenQs.has(q.q)) return false;
    seenQs.add(q.q);
    return true;
  });
  
  // Ensure still 6 questions
  while (entry.questions.length < 6) {
    entry.questions.push({
      id: `q_pad_${entry.questions.length + 1}`,
      type: 'choice',
      d: 2,
      q: `在 AIDC 設計中，${title}的主要工程目標是？`,
      opts: shuffle(['達成高效散熱與低 PUE 目標', '最大化機架密度而不考慮散熱', '選用最低成本的備援方案', '忽略水質管理節省運維成本']),
      ans: 0,
      tag: '工程目標',
      ex: `${title}設計的核心是達成散熱效率與可靠性的最優平衡。`,
    });
  }
  
  totalFixed += fallbackCount;
  totalLevels++;
}

// Fix all remaining text issues globally
for (const [lid, entry] of Object.entries(cache)) {
  if (!entry.questions) continue;
  
  const seenQs = new Set();
  entry.questions = entry.questions.filter(q => {
    if (seenQs.has(q.q)) return false;
    seenQs.add(q.q);
    return true;
  });
  
  entry.questions.forEach(q => {
    q.q = cleanText(q.q);
    q.opts = q.opts.map(o => cleanText(o));
    if (q.ex) q.ex = cleanText(q.ex);
    if (q.ans < 0 || q.ans >= q.opts.length) q.ans = 0;
  });
}

fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
console.log(`Replaced ${totalFixed} fallback questions across ${totalLevels} levels.`);
console.log('Deep fix complete!');
