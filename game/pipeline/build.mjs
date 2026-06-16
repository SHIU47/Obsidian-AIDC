// pipeline/build.mjs
// 主入口：parse → gen_quiz → 寫 game-data.js
// 用法：node pipeline/build.mjs
//        WIKI_PATH=... MAX_NEW=10 node pipeline/build.mjs
//        FORCE_ALL=1 node pipeline/build.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { parseVault, assignCoords } from './parse_vault.js';
import { genQuiz } from './gen_quiz.js';

// 讀取 game/.env（若存在）
const __dirname0 = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname0, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_DIR   = path.resolve(__dirname, '..');
const GAME_DATA  = path.join(GAME_DIR, 'game-data.js');

// 預設 wiki 路徑（Windows）
const WIKI_DIR = process.env.WIKI_PATH
  || path.resolve(GAME_DIR, '../../wiki')  // 若 wiki/ 放在 vault 根目錄
  || 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki';

const MAX_NEW  = parseInt(process.env.MAX_NEW  || '5', 10);
const FORCE_ALL = !!process.env.FORCE_ALL;

// ---- prototype 保留資料（已驗過的關卡，不被覆寫） ----
// 從現有 game-data.js 讀取舊資料
function readExistingData() {
  try {
    const code = fs.readFileSync(GAME_DATA, 'utf8');
    // 用 Function 沙箱執行，取出變數
    const fn = new Function(`
      ${code}
      return { INTEL, QUIZ, LEVELS, CARDS, genCalc: typeof genCalc !== 'undefined' ? genCalc.toString() : null };
    `);
    return fn();
  } catch { return null; }
}

// 把舊關卡中「已驗證」的資料標記起來
// 規則：出現在舊 LEVELS 且無 md_hash 的關卡視為 human-curated，永不覆寫
function getProtectedIds(oldData) {
  if (!oldData?.LEVELS) return new Set();
  const protected_ = new Set();
  for (const lv of oldData.LEVELS) {
    if (!lv.md_hash) protected_.add(lv.id);
  }
  return protected_;
}

// ---- 自動排座標（避免關卡重疊） ----
function layoutRegion(levels, cols = 4) {
  const count = levels.length;
  if (count === 0) return;
  const rows = Math.ceil(count / cols);
  levels.forEach((lv, i) => {
    const row = Math.floor(i / cols);
    let col = i % cols;
    // Reverse columns on odd rows for a snake path
    if (row % 2 === 1) {
      col = cols - 1 - col;
    }
    // Map to percentage coordinates relative to the panel
    const x = Math.round(15 + col * (70 / (cols - 1 || 1)));
    const y = Math.round(20 + row * (60 / (rows - 1 || 1)));
    lv.x = x;
    lv.y = y;
  });
}

function assignAllCoords(levels) {
  const regionOrder = ['foundation','air','liquid','source','power','calc','safety','rack','chip','comparison','vendor'];
  const grouped = {};
  for (const lv of levels) {
    if (!grouped[lv.region]) grouped[lv.region] = [];
    grouped[lv.region].push(lv);
  }
  // 修復站永遠排在右上角
  const repair = { id:'repair', kind:'repair', name:'修復小屋', sub:'弱點補強',
    boss:{n:'修補小精靈',key:'FixFairy'}, c:'#3DDC84', x:88, y:8, req:null, region:'repair' };

  const placed = [];
  for (const region of regionOrder) {
    const group = (grouped[region] || []).filter(lv => lv.id !== 'repair');
    if (!group.length) continue;
    layoutRegion(group, 4);
    placed.push(...group);
  }
  placed.push(repair);
  return placed;
}

// ---- 生成前置相依（簡單線性：foundation → air → liquid → ...） ----
function inferRequirements(levels) {
  const chainOrder = ['foundation','air','liquid','source','power','calc','safety','rack','chip'];
  const regionLevels = {};
  for (const lv of levels) {
    if (!regionLevels[lv.region]) regionLevels[lv.region] = [];
    regionLevels[lv.region].push(lv);
  }
  // 每個 region 的第一關，require 前一個 region 的最後一關
  for (let i = 1; i < chainOrder.length; i++) {
    const cur  = regionLevels[chainOrder[i]];
    const prev = regionLevels[chainOrder[i-1]];
    if (cur?.length && prev?.length) {
      cur[0].req = prev[prev.length-1].id;
    }
  }
  // region 內部：每關 require 前一關
  for (const region of Object.keys(regionLevels)) {
    const group = regionLevels[region];
    for (let i = 1; i < group.length; i++) {
      if (!group[i].req) group[i].req = group[i-1].id;
    }
  }
}

// ---- 將 quizbank_cache + levels 合併成 game-data.js 的資料 ----
function buildGameData(levels, cache, oldData, protectedIds) {
  const INTEL = oldData?.INTEL ? { ...oldData.INTEL } : {};
  // Only preserve QUIZ for protected (human-curated) levels; pipeline levels always get rebuilt from cache
  const QUIZ  = {};
  if (oldData?.QUIZ) {
    const protectedArr = oldData?.LEVELS?.filter(lv => !lv.md_hash).map(lv => lv.id) || [];
    for (const id of protectedArr) {
      if (oldData.QUIZ[id]) QUIZ[id] = oldData.QUIZ[id];
    }
  }
  const CARDS = oldData?.CARDS ? { ...oldData.CARDS } : {};

  const WIKI  = {};
  const LEVELS_OUT = [];

  // 先加入 human-curated 的舊關卡
  if (oldData?.LEVELS) {
    for (const lv of oldData.LEVELS) {
      if (protectedIds.has(lv.id) && lv.id !== 'repair') {
        const region = lv.id === 'm01' ? 'foundation' : lv.id === 'cdu' ? 'calc' : lv.id === 'vs' ? 'comparison' : lv.region;
        const match = levels.find(l => l.id === lv.id);
        LEVELS_OUT.push({
          ...lv,
          region,
          x: match ? match.x : lv.x,
          y: match ? match.y : lv.y
        });
        if (match) {
          WIKI[lv.id] = match._content || '';
        }
      }
    }
  }

  // 再加入 pipeline 發現的關卡
  for (const lv of levels) {
    if (protectedIds.has(lv.id)) continue;   // 保護舊資料
    if (lv.kind === 'repair') continue;       // 修復站特殊處理

    const entry = cache[lv.id];
    if (!entry) continue;                     // 尚未生成，跳過

    // 填入 INTEL + QUIZ
    INTEL[lv.id] = entry.intel || [];
    QUIZ[lv.id]  = entry.questions || [];
    WIKI[lv.id]  = lv._content || '';

    // 產生通用 CARD
    if (!CARDS[lv.id]) {
      CARDS[lv.id] = { name:`${lv.name} 徽章`, r:'R', c: lv.c, f: entry.intel?.[0]?.f || '', icon:'BookIcon' };
    }

    LEVELS_OUT.push({
      id: lv.id, kind: lv.kind,
      name: lv.name.length > 12 ? lv.name.slice(0,12) + '…' : lv.name,
      sub: lv.sub, boss: lv.boss,
      x: lv.x, y: lv.y, c: lv.c, req: lv.req,
      region: lv.region,
      md_hash: lv.md_hash,
    });
  }

  // 修復站
  const repair = { id:'repair', kind:'repair', name:'修復小屋', sub:'弱點補強',
    boss:{n:'修補小精靈',key:'FixFairy'}, x:88, y:8, c:'#3DDC84', req:null };
  LEVELS_OUT.push(repair);

  return { INTEL, QUIZ, LEVELS: LEVELS_OUT, CARDS, WIKI };
}

// ---- 寫 game-data.js ----
function writeGameData({ INTEL, QUIZ, LEVELS, CARDS, WIKI }, genCalcSrc) {
  const ts = new Date().toISOString();
  const out = `// game-data.js
// 由 pipeline/build.mjs 於 ${ts} 自動生成
// 手動修改的關卡請在 game/pipeline/quizzes/<region>/<levelId>.json 中設定 "reviewed": true

const INTEL = ${JSON.stringify(INTEL, null, 2)};

const QUIZ = ${JSON.stringify(QUIZ, null, 2)};

const WIKI = ${JSON.stringify(WIKI, null, 2)};

${genCalcSrc || DEFAULT_GEN_CALC}

const LEVELS = ${JSON.stringify(LEVELS, null, 2)};

const CARDS = ${JSON.stringify(CARDS, null, 2)};
`;
  fs.writeFileSync(GAME_DATA, out, 'utf8');
  console.log(`\nWritten → ${GAME_DATA}`);
}

// genCalc 函式原始碼（hardcoded CDU 計算，pipeline 不會覆寫）
const DEFAULT_GEN_CALC = `function genCalc(stage) {
  if (stage === 0) {
    const Q = [100,110,120,130,140][Math.floor(Math.random()*5)];
    const dT = [8,10,12][Math.floor(Math.random()*3)];
    return {d:1,Q,dT,label:"基礎流量",ask:\`機架熱負荷 Q = \${Q} kW、供回水溫差 ΔT = \${dT}°C（水：Cp=4.186、ρ≈1 kg/L）。求二次側體積流量（L/min）\`,
      answer:Q/(4.186*dT)*60,steps:[\`ṁ = Q ÷ (Cp×ΔT) = \${Q} ÷ (4.186×\${dT}) = \${(Q/(4.186*dT)).toFixed(3)} kg/s\`,\`V = ṁ × 60 ≈ \${(Q/(4.186*dT)*60).toFixed(1)} L/min\`]};
  }
  if (stage === 1) {
    const Q = [120,130,140][Math.floor(Math.random()*3)];
    const flow = Q/(4.186*10)*60;
    return {d:2,Q,dT:10,label:"TBE 設計流量",ask:\`同一機架 Q = \${Q} kW、ΔT = 10°C。理論流量算出後，依業界常規 ×1.2 裕度，求「TBE 設計流量」（L/min）\`,
      answer:flow*1.2,steps:[\`理論 V = \${Q}÷(4.186×10)×60 = \${flow.toFixed(1)} L/min\`,\`設計流量 = \${flow.toFixed(1)} × 1.2 ≈ \${(flow*1.2).toFixed(1)} L/min\`]};
  }
  const Q = [120,140][Math.floor(Math.random()*2)];
  const flowPG = Q/(3.9*10)*60/0.96;
  return {d:3,Q,dT:10,label:"PG25 工質",ask:\`改用 PG25 工質（Cp≈3.9 kJ/kg·K、密度≈0.96 kg/L）、Q = \${Q} kW、ΔT = 10°C。求體積流量（L/min）\`,
    answer:flowPG,steps:[\`ṁ = \${Q}÷(3.9×10) = \${(Q/39).toFixed(3)} kg/s\`,\`V = ṁ÷0.96×60 ≈ \${flowPG.toFixed(1)} L/min（比純水多約 7~12%）\`]};
}`;

// ---- 主流程 ----
async function main() {
  // 確認 wiki 路徑
  const wikiDir = fs.existsSync(WIKI_DIR) ? WIKI_DIR
    : fs.existsSync('C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki') ? 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki'
    : null;

  if (!wikiDir) {
    console.error(`找不到 wiki 目錄。請設定 WIKI_PATH 環境變數。`);
    process.exit(1);
  }
  console.log(`Wiki 路徑：${wikiDir}`);

  // 1. 解析 vault
  console.log('\n[1/4] 解析 wiki...');
  const { levels, edges } = parseVault(wikiDir);
  console.log(`  找到 ${levels.length} 個 MD 檔`);

  // 讀入 MD 內容（供 gen_quiz 用）
  for (const lv of levels) {
    try {
      const fullPath = path.join(wikiDir, lv.filePath);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { content } = matter(raw);
      lv._content = content;
    } catch(e) { lv._content = ''; }
  }

  // 2. 讀入舊資料，確定保護 ids
  console.log('\n[2/4] 讀取現有 game-data.js...');
  const oldData = readExistingData();
  const protectedIds = getProtectedIds(oldData);
  console.log(`  保護的 human-curated 關卡：${[...protectedIds].join(', ') || '（無）'}`);

  // 把受保護的 human-curated 關卡加入 levels，讓它們參與自動排版與相依性計算
  if (oldData?.LEVELS) {
    for (const lv of oldData.LEVELS) {
      if (protectedIds.has(lv.id) && lv.id !== 'repair' && !levels.some(l => l.id === lv.id)) {
        levels.push({
          id: lv.id,
          name: lv.name,
          sub: lv.sub,
          kind: lv.kind,
          region: lv.id === 'm01' ? 'foundation' : lv.id === 'cdu' ? 'calc' : lv.id === 'vs' ? 'comparison' : lv.region,
          boss: lv.boss,
          c: lv.c,
          req: lv.req
        });
      }
    }
  }

  // 3. 生成題目（只處理新增或變動的檔案）
  if (process.env.ANTHROPIC_API_KEY) {
    console.log(`\n[3/4] 呼叫 Claude API（最多 ${MAX_NEW} 個新關卡）...`);
    const filteredLevels = levels.filter(lv => !protectedIds.has(lv.id));
    await genQuiz(filteredLevels, { forceAll: FORCE_ALL, maxNew: MAX_NEW });
  } else {
    console.log('\n[3/4] 跳過 API 生成（未設定 ANTHROPIC_API_KEY）');
  }

  // 4. 排座標 + 相依性 + 寫 game-data.js
  console.log('\n[4/4] 組合 game-data.js...');
  const quizzesDir = path.join(__dirname, 'quizzes');
  const cache = {};
  if (fs.existsSync(quizzesDir)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.json')) {
          const levelId = path.basename(entry.name, '.json');
          try {
            const content = fs.readFileSync(fullPath, 'utf8').replace(/^﻿/,'');
            cache[levelId] = JSON.parse(content);
          } catch (e) {
            console.warn(`  讀取/解析 ${entry.name} 失敗: ${e.message}`);
          }
        }
      }
    };
    walk(quizzesDir);
    console.log(`  載入 ${Object.keys(cache).length} 個分割關卡題目`);
  } else {
    console.log('  quizzes/ 目錄不存在，使用空快取');
  }

  inferRequirements(levels);
  const allLevels = assignAllCoords(levels);

  // 儲存 graph.json（供未來擴充）
  const graphPath = path.join(GAME_DIR, 'pipeline', 'graph.json');
  fs.writeFileSync(graphPath, JSON.stringify({ edges }, null, 2), 'utf8');
  console.log(`  graph.json → ${edges.length} 條邊`);

  const gameData = buildGameData(allLevels, cache, oldData, protectedIds);
  writeGameData(gameData, DEFAULT_GEN_CALC);

  const pipelineCount = gameData.LEVELS.filter(l => !protectedIds.has(l.id) && l.kind !== 'repair').length;
  console.log(`\n完成！`);
  console.log(`  - 保留關卡（human）：${protectedIds.size}`);
  console.log(`  - 新關卡（pipeline）：${pipelineCount}`);
  console.log(`  - 修復站：1`);
  console.log(`  - 總關卡：${gameData.LEVELS.length}`);

  // 5. 將 game-app.js 內嵌到 index.html 以支援直接雙擊（file://）開啟
  console.log('\n[5/5] 優化 index.html 以支援直接雙擊開啟...');
  const indexHtmlPath = path.join(GAME_DIR, 'index.html');
  const gameAppPath = path.join(GAME_DIR, 'game-app.js');
  if (fs.existsSync(gameAppPath)) {
    const gameAppCode = fs.readFileSync(gameAppPath, 'utf8');
    const indexTemplate = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>AIDC Engineer — 冷卻宇宙的守護者</title>
  <meta name="description" content="把 Obsidian HVAC/AIDC 技術筆記做成任天堂 Switch 風格的網頁學習遊戲：上課、打 Boss、修復知識裂痕。">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><path d='M32 6 C40 18 52 28 52 42 a20 20 0 1 1-40 0 C12 28 24 18 32 6Z' fill='%235BC2FF' stroke='%233B2B20' stroke-width='3.5'/></svg>">
  <style>
    body { margin: 0; background: #8FE3FF; overflow-x: hidden; }
    #root { min-height: 100vh; }
    #loading { display:flex; align-items:center; justify-content:center; min-height:100vh;
      font-family:'M PLUS Rounded 1c',sans-serif; font-size:24px; font-weight:900; color:#3B2B20; }
  </style>
</head>
<body>
  <div id="root"><div id="loading">載入中⋯</div></div>

  <!-- 關卡資料（由 pipeline 或手動更新） -->
  <script src="game-data.js"></script>

  <!-- React 18 + ReactDOM -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Babel Standalone：讓 JSX 在瀏覽器直接轉譯 -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script>
    Babel.registerPreset("custom-react", {
      presets: [
        [Babel.availablePresets["react"], { 
          runtime: "classic"
        }]
      ]
    });
  </script>

  <!-- 遊戲主程式（內嵌以避開本地 CORS 限制） -->
  <script type="text/babel" data-presets="custom-react">
${gameAppCode}
  </script>
</body>
</html>`;
    fs.writeFileSync(indexHtmlPath, indexTemplate, 'utf8');
    console.log(`  index.html 已成功嵌入 game-app.js，現在支援直接雙擊開啟！`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
