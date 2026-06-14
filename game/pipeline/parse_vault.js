// pipeline/parse_vault.js
// 掃描 wiki/ 目錄，回傳 level metadata 陣列 + wikilink edges
// 執行方式：由 build.mjs 呼叫（export function），也可直接 node parse_vault.js 測試

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';

// 資料夾名稱 → region 代碼
const REGION_MAP = {
  '01_modules':              'foundation',
  '02_air_cooling':          'air',
  '03_liquid_cooling':       'liquid',
  '04_cooling_sources':      'source',
  '05_power_systems':        'power',
  '06_standards_calculations':'calc',
  '07_design_safety':        'safety',
  '08_racks_platforms':      'rack',
  '09_chips_packaging':      'chip',
};

// Boss / 顏色預設（依 region）
const REGION_DEFAULTS = {
  foundation: { boss:'MistBoss',   c:'#3FA7FF' },
  air:        { boss:'MistBoss',   c:'#3DDC84' },
  liquid:     { boss:'MagmaBoss',  c:'#FF9F43' },
  source:     { boss:'MagmaBoss',  c:'#FF5A5F' },
  power:      { boss:'TwinBoss',   c:'#FFC93C' },
  calc:       { boss:'MagmaBoss',  c:'#B07CFF' },
  safety:     { boss:'TwinBoss',   c:'#FF5A5F' },
  rack:       { boss:'MistBoss',   c:'#3FA7FF' },
  chip:       { boss:'MagmaBoss',  c:'#FF9F43' },
  comparison: { boss:'TwinBoss',   c:'#B07CFF' },
  vendor:     { boss:'FixFairy',   c:'#3DDC84' },
};

function sha1(str) {
  return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

// 從檔名推導 level id（穩定、唯一）
function makeId(relPath) {
  const normPath = relPath.replace(/\\/g, '/');
  const base = path.basename(normPath, '.md');
  // Module XX 模式
  const mMatch = base.match(/^Module\s+(\d+)/i);
  if (mMatch) return `m${mMatch[1].padStart(2,'0')}`;
  
  const ascii = base.replace(/[^\x00-\x7F]/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g, '').slice(0,10);
  const hash = sha1(normPath).slice(0, 6);

  if (normPath.includes('comparisons')) {
    return `cmp_${hash}`;
  }
  if (normPath.includes('entities')) {
    return `ent_${ascii || 'vendor'}_${hash.slice(0, 4)}`;
  }
  return `${ascii || 'c'}_${hash.slice(0, 4)}`;
}

// 從 MD 內文提取 [[wikilinks]]
function extractLinks(content) {
  const links = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(content)) !== null) links.push(m[1].trim());
  return [...new Set(links)];
}

// 從 MD 提取第一個 # 標題
function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

// 掃描單一目錄（遞迴）
function scanDir(dir, relBase, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath  = path.join(relBase, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, relPath, results);
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md' && entry.name !== 'log.md') {
      results.push({ fullPath, relPath });
    }
  }
}

export function parseVault(wikiDir) {
  const files = [];
  scanDir(wikiDir, '', files);

  const levels = [];
  const linkEdges = [];   // { from: levelId, toTitle: string }

  for (const { fullPath, relPath } of files) {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data: fm, content } = matter(raw);
    const md_hash = sha1(raw);
    const id = makeId(relPath);

    // 決定 region + kind
    const parts = relPath.replace(/\\/g, '/').split('/');
    let region = 'foundation', kind = 'quiz';
    if (parts[0] === 'concepts' && parts[1]) {
      region = REGION_MAP[parts[1]] || 'foundation';
    } else if (parts[0] === 'comparisons') {
      region = 'comparison'; kind = 'comparison';
    } else if (parts[0] === 'entities') {
      region = 'vendor'; kind = 'vendor';
    }

    const title = extractTitle(content) || path.basename(relPath, '.md');
    const links = extractLinks(content);

    // wikilink 前置關係
    for (const link of links) linkEdges.push({ from: id, toTitle: link });

    const def = REGION_DEFAULTS[region] || REGION_DEFAULTS.foundation;
    levels.push({
      id,
      filePath: relPath.replace(/\\/g, '/'),
      name: title,
      sub: fm.module ? `Module ${fm.module}` : region,
      kind,
      region,
      boss: { n: getBossName(def.boss), key: def.boss },
      c: def.c,
      x: 0, y: 0,   // 座標由 build.mjs 自動排列
      req: null,     // 相依性由 graph.json 或 overrides.json 決定
      md_hash,
      tags: fm.tags || [],
    });
  }

  // 解析 linkEdges → graph edges（只保留同 vault 內的 link）
  const idByTitle = Object.fromEntries(levels.map(l => [l.name, l.id]));
  const edges = [];
  for (const e of linkEdges) {
    const toId = idByTitle[e.toTitle];
    if (toId && toId !== e.from) edges.push({ from: e.from, to: toId, reason: 'wikilink' });
  }

  return { levels, edges };
}

function getBossName(key) {
  return { MistBoss:'迷霧妖', MagmaBoss:'熱熱魔王', TwinBoss:'雙子守門員', FixFairy:'修補小精靈' }[key] || key;
}

// 自動排列座標（簡單的 region 分區格線）
export function assignCoords(levels) {
  const regionOrder = ['foundation','air','liquid','source','power','calc','safety','rack','chip','comparison','vendor'];
  const grouped = {};
  for (const lv of levels) {
    if (!grouped[lv.region]) grouped[lv.region] = [];
    grouped[lv.region].push(lv);
  }
  let yi = 0;
  for (const region of regionOrder) {
    const group = grouped[region] || [];
    group.forEach((lv, xi) => {
      lv.x = Math.round(10 + (xi % 5) * 18);
      lv.y = Math.round(15 + yi * 22 + (xi % 2) * 10);
    });
    if (group.length) yi += Math.ceil(group.length / 5);
  }
}

// CLI 測試
if (process.argv[1] && process.argv[1].endsWith('parse_vault.js')) {
  const wikiDir = process.env.WIKI_PATH || 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki';
  console.log(`掃描 ${wikiDir} ...`);
  const { levels, edges } = parseVault(wikiDir);
  assignCoords(levels);
  console.log(`找到 ${levels.length} 個關卡，${edges.length} 條 wikilink 邊`);
  console.log('前 3 個關卡:', JSON.stringify(levels.slice(0,3).map(l=>({id:l.id,name:l.name,region:l.region})), null, 2));
}
