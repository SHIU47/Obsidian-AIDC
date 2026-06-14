// C:\Users\user\Obsidian\game\pipeline\generate_quizzes.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const WIKI_DIR = 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki';
const CACHE_OUT = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizbank_cache.json';

function sha1(str) {
  return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

function parseMarkdown(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const md_hash = sha1(raw);

  let content = raw;
  if (raw.startsWith('---')) {
    const parts = raw.split('---', 3);
    if (parts.length >= 3) {
      content = parts[2];
    }
  }

  // Extract Title
  let title = '';
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else {
    title = path.basename(filepath, '.md');
  }

  // Split into sections
  const sections = [];
  let currentSec = { title: '概述', text: '' };
  for (const line of content.split('\n')) {
    if (line.startsWith('## ')) {
      if (currentSec.text.trim()) {
        sections.push(currentSec);
      }
      currentSec = { title: line.slice(3).trim(), text: '' };
    } else {
      currentSec.text += line + '\n';
    }
  }
  if (currentSec.text.trim()) {
    sections.push(currentSec);
  }

  return { title, sections, md_hash };
}

function extractTables(sections) {
  const tables = [];
  for (const sec of sections) {
    const lines = sec.text.split('\n');
    let tableLines = [];
    for (const line of lines) {
      if (line.includes('|')) {
        tableLines.push(line);
      } else {
        if (tableLines.length >= 3) {
          tables.push(tableLines);
        }
        tableLines = [];
      }
    }
    if (tableLines.length >= 3) {
      tables.push(tableLines);
    }
  }
  return tables;
}

function parseTableKV(tableLines) {
  const kv = {};
  if (tableLines.length < 3) return kv;

  for (let i = 2; i < tableLines.length; i++) {
    const line = tableLines[i].trim();
    if (!line) continue;
    let cols = line.split('|').map(c => c.trim());
    if (line.startsWith('|')) {
      cols = cols.slice(1);
    }
    if (line.endsWith('|')) {
      cols = cols.slice(0, -1);
    }
    cols = cols.map(c => c.trim());
    if (cols.length >= 2) {
      const key = cols[0];
      const val = cols[1];
      if (key && val && !key.startsWith('---')) {
        kv[key] = val;
      }
    }
  }
  return kv;
}

function makeDistractors(val, key = '') {
  const valClean = val.replace(/[✔✘✅❌]/g, '').trim();
  if (['支援', '是', '支援（100%）'].includes(valClean)) {
    return ['不支援', '僅部分支援', '無法確定', '需外接設備'];
  }
  if (['不支援', '否'].includes(valClean)) {
    return ['支援', '僅在特定條件下支援', '由第三方提供', '不確定'];
  }

  // Check if number
  const numMatch = valClean.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const numStr = numMatch[1];
    const unit = valClean.replace(numStr, '').trim();
    const num = parseFloat(numStr);
    if (!isNaN(num)) {
      let d1, d2, d3;
      if (Number.isInteger(num)) {
        d1 = Math.round(num * 1.5);
        d2 = Math.max(0, Math.round(num * 0.5));
        d3 = Math.round(num * 2);
      } else {
        d1 = parseFloat((num * 1.5).toFixed(2));
        d2 = parseFloat(Math.max(0, num * 0.5).toFixed(2));
        d3 = parseFloat((num * 2.0).toFixed(2));
      }
      const distractors = Array.from(new Set([
        `${d1} ${unit}`.trim(),
        `${d2} ${unit}`.trim(),
        `${d3} ${unit}`.trim()
      ]));
      while (distractors.length < 3) {
        distractors.push(`${Math.round(num + distractors.length * 5)} ${unit}`.trim());
      }
      return distractors.slice(0, 3);
    }
  }

  return [
    `與 ${valClean} 無關的規格`,
    `低於標準的 ${valClean} 設定`,
    '視具體廠牌而定的其他參數'
  ];
}

function generateQuizForFile(filepath) {
  const { title, sections, md_hash } = parseMarkdown(filepath);

  // 1. Generate Intel Cards
  const intelCards = [];
  const validSections = sections.filter(s => !['Cross-References', 'Sources', '參考資料', '相關連結'].includes(s.title));

  for (const sec of validSections.slice(0, 4)) {
    let t = sec.title;
    if (t.length > 15) {
      t = t.slice(0, 12) + '...';
    }

    const lines = sec.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let intro = '';
    const points = [];

    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('|') || line.startsWith('- -')) {
        continue;
      }
      if (line.startsWith('-') || line.startsWith('*')) {
        const pt = line.replace(/^[-*\s]+/, '').replace(/\[\[/g, '').replace(/\]\]/g, '').trim();
        if (pt.length > 5) {
          points.push(pt.slice(0, 50));
        }
      } else if (!intro && line.length > 20) {
        intro = line.replace(/\[\[/g, '').replace(/\]\]/g, '').slice(0, 180);
      }
    }

    if (!intro) {
      intro = `本章節介紹關於 ${title} 的 ${sec.title} 相關工程技術與設計實務規範。`;
    }
    if (points.length === 0) {
      points.push(`掌握 ${sec.title} 的核心定義與應用場景`);
      points.push(`理解 ${sec.title} 對整體 AIDC 的工程影響`);
      points.push('注意相關規格在實務中的選型對策');
    }

    while (points.length < 3) {
      points.push('參考原廠技術規範進行設計與校核');
    }

    intelCards.push({
      t: t,
      intro: intro,
      points: points.slice(0, 4),
      f: `重點點位：${sec.title}`,
      note: `在進行 ${title} 相關設計時，應特別注意 ${sec.title} 的參數限制。`
    });
  }

  if (intelCards.length === 0) {
    intelCards.push({
      t: '基礎概念',
      intro: `本關卡探討 ${title} 的技術要點與 AIDC 設計實務。`,
      points: ['理解基礎運作原理', '掌握核心規格參數', '注意設計與選配細節'],
      f: `掌握 ${title} 的工程核心`,
      note: '這是 AIDC HVAC/電力系統中非常關鍵的知識點。'
    });
  }

  // 2. Generate Quiz Questions
  const questions = [];
  const tables = extractTables(sections);
  const kvPairs = {};
  for (const table of tables) {
    Object.assign(kvPairs, parseTableKV(table));
  }

  let qIdx = 1;
  for (const [key, val] of Object.entries(kvPairs)) {
    if (questions.length >= 6) break;

    const distractors = makeDistractors(val, key);
    const opts = [val, ...distractors];
    const shufIdx = key.length % 4;
    // swap
    const temp = opts[0];
    opts[0] = opts[shufIdx];
    opts[shufIdx] = temp;

    const qText = `根據筆記，關於 ${title} 的「${key}」，下列數值或描述何者正確？`;
    questions.push({
      id: `q${qIdx}`,
      type: 'choice',
      d: qIdx <= 2 ? 1 : (qIdx <= 4 ? 2 : 3),
      q: qText,
      opts: opts,
      ans: shufIdx,
      tag: key.slice(0, 10),
      ex: `正確答案為 ${val}，詳見筆記中有關 ${key} 的說明。`
    });
    qIdx++;
  }

  const fallbacks = [
    {
      q: '下列關於 {title} 的敘述，何者正確？',
      correct: 'DLC 為主流，傳統氣冷已無法支持超高密度機架',
      wrong: ['傳統氣冷完全足夠', '浸沒式為唯一方案', '不需要考慮冷卻問題'],
      ex: 'AIDC 中高密度機架必須使用液冷方案。'
    },
    {
      q: '對於 {title} 的工程實務，下列何者為常見的設計錯誤？',
      correct: '忽略未來擴展性與不同系統間的耦合設計',
      wrong: ['過度設計冗餘系統', '採用符合國際標準的組件', '定期進行防漏測試'],
      ex: '不同系統間的耦合設計非常關鍵。'
    },
    {
      q: '在 {title} 系統中，如何有效降低 PUE 指標？',
      correct: '提高冷凍水供水溫度並導入 Free Cooling 自然冷卻',
      wrong: ['調低送風溫度至 10°C 以下', '增加備用發電機組的容量', '完全關閉機房的通風系統'],
      ex: '提高供水溫度是降低 PUE 的最直接有效手段。'
    },
    {
      q: '下列關於 {title} 的備援設計，何者敘述正確？',
      correct: 'Tier III 要求可同時維護性（N+1），Tier IV 要求完全容錯（2N）',
      wrong: ['Tier III 必須具備 2N 備援', '所有備援設計都是越複雜越好', 'Tier IV 可以容忍長達數小時的計畫停機'],
      ex: 'Tier III 為可並行維護，Tier IV 為完全容錯。'
    },
    {
      q: '在 AIDC 設計中，PUE 的計算公式為？',
      correct: '設施總用電 ÷ IT 設備用電',
      wrong: ['IT 用電 ÷ 設施總用電', '冷卻用電 ÷ 總用電', '總用電 − IT 用電'],
      ex: 'PUE = 設施總用電 ÷ IT 用電，理想值為 1.0。'
    },
    {
      q: '當進行 {title} 相關設備選型時，首要考慮的因素是？',
      correct: '系統的可靠度、交期以及與原廠生態的相容性',
      wrong: ['設備的最低採購價格', '外觀的美觀程度', '單一廠商的獨家綁定'],
      ex: '可靠度、交期與原廠認證是 AIDC 設備選型的核心。'
    }
  ];

  for (const f of fallbacks) {
    if (questions.length >= 6) break;

    const qText = f.q.replace(/{title}/g, title);
    const opts = [f.correct, ...f.wrong];
    const shufIdx = (qText.length + qIdx) % 4;
    const temp = opts[0];
    opts[0] = opts[shufIdx];
    opts[shufIdx] = temp;

    questions.push({
      id: `q${qIdx}`,
      type: 'choice',
      d: qIdx <= 2 ? 1 : (qIdx <= 4 ? 2 : 3),
      q: qText,
      opts: opts,
      ans: shufIdx,
      tag: '基本觀念',
      ex: f.ex
    });
    qIdx++;
  }

  return {
    md_hash: md_hash,
    reviewed: false,
    intel: intelCards,
    questions: questions
  };
}

function makeId(relPath) {
  const base = path.basename(relPath, '.md');
  const mMatch = base.match(/^Module\s+(\d+)/i);
  if (mMatch) return `m${mMatch[1].padStart(2, '0')}`;
  
  const ascii = base.replace(/[^\x00-\x7F]/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g, '').slice(0,10);
  const hash = sha1(relPath).slice(0, 6);

  if (relPath.includes('comparisons')) {
    return `cmp_${hash}`;
  }
  if (relPath.includes('entities')) {
    return `ent_${ascii || 'vendor'}_${hash.slice(0, 4)}`;
  }
  return `${ascii || 'c'}_${hash.slice(0, 4)}`;
}

function main() {
  console.log(`Scanning wiki dir: ${WIKI_DIR}`);
  const cache = {};

  const subdirs = [
    'concepts/01_modules',
    'concepts/02_air_cooling',
    'concepts/03_liquid_cooling',
    'concepts/04_cooling_sources',
    'concepts/05_power_systems',
    'concepts/06_standards_calculations',
    'concepts/07_design_safety',
    'concepts/08_racks_platforms',
    'concepts/09_chips_packaging',
    'comparisons',
    'entities'
  ];

  let totalFiles = 0;
  for (const subdir of subdirs) {
    const fullSubdir = path.join(WIKI_DIR, subdir.replace(/\//g, path.sep));
    if (!fs.existsSync(fullSubdir)) {
      console.log(`Subdir not found: ${fullSubdir}`);
      continue;
    }

    const files = fs.readdirSync(fullSubdir);
    for (const file of files) {
      if (file.endswith ? file.endsWith('.md') : file.endsWith('.md') && file !== 'index.md' && file !== 'log.md') {
        const fullPath = path.join(fullSubdir, file);
        const relPath = path.relative(WIKI_DIR, fullPath);
        const levelId = makeId(relPath);

        try {
          const levelData = generateQuizForFile(fullPath);
          cache[levelId] = levelData;
          totalFiles++;
        } catch (e) {
          console.log(`Error processing ${relPath}: ${e}`);
        }
      }
    }
  }

  // Ensure directory exists
  const outDir = path.dirname(CACHE_OUT);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(CACHE_OUT, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`Success! Generated quizzes for ${totalFiles} files.`);
  console.log(`Cache written to ${CACHE_OUT}`);
}

main();
