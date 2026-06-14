// pipeline/gen_quiz.js
// 對每個 MD 檔呼叫 Claude API，生成 INTEL 卡片 + 題目
// 已有 reviewed:true 的題目不會被覆寫

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}
const MODEL = 'claude-sonnet-4-6';

// 快取檔路徑（key: levelId, value: { md_hash, reviewed, intel, questions }）
const CACHE_PATH = new URL('../pipeline/quizbank_cache.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); }
  catch { return {}; }
}
function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

const PROMPT_SYSTEM = `你是一位資深 AIDC（AI Data Center）工程師兼教育考官，
專精 HVAC、液冷、電力系統、資料中心設計與 NVIDIA GPU 熱管理。

你的任務：根據提供的技術筆記，生成遊戲關卡的學習內容與考題。

輸出規格（嚴格遵守）：
1. 只輸出合法 JSON，不加任何 markdown 圍欄（\`\`\`）或說明文字
2. 所有中文使用繁體中文
3. 工程數字必須準確可查證
4. 計算題的 formula 必須是合法 JS 表達式（可以 eval()）

JSON 格式：
{
  "intel": [               // 3~5 張知識卡
    {
      "t": "卡片標題（15字以內）",
      "intro": "完整導讀段落（100~200字）",
      "points": ["重點1","重點2","重點3","重點4"],
      "f": "核心公式或口訣",
      "note": "工程備註（50~80字）"
    }
  ],
  "questions": [           // 6 題：難度 1,1,2,2,3,3 各一對
    {
      "id": "q1",
      "type": "choice",    // 或 "calc"
      "d": 1,              // 難度 1~3
      "q": "題目",
      "opts": ["A","B","C","D"],
      "ans": 0,            // 正確答案 index（0-based）
      "tag": "知識點標籤",
      "ex": "詳解（50字以內）"
    }
  ]
}

難度定義：
- d:1 定義/事實題（直接從課文找答案）
- d:2 應用/選型題（需要判斷、比較）
- d:3 推導/計算/陷阱題（需要計算或識破常見誤解）

如筆記含公式/計算，最多加 1 道計算題，格式如下：
{
  "id": "c1",
  "type": "calc",
  "d": 2,
  "label": "計算題名稱",
  "ask": "完整題目敘述（含數字）",
  "params": { "Q": {"pool":[120,130,140]}, "dT": {"pool":[10]} },
  "formula": "Q/(4.186*dT)*60",
  "tolerance": 0.05,
  "unit": "L/min",
  "steps": ["步驟1","步驟2"]
}`;

async function generateForLevel(levelId, mdContent, levelName) {
  const userMsg = `筆記主題：${levelName}\n\n筆記內容：\n${mdContent}`;

  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: PROMPT_SYSTEM,
    messages: [{ role: 'user', content: userMsg }],
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  // 清除可能的圍欄
  const cleaned = text.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim();
  return JSON.parse(cleaned);
}

// 主要 export：對需要更新的關卡生成題目，回傳更新後的快取
export async function genQuiz(levels, options = {}) {
  const { forceAll = false, maxNew = 5 } = options;
  const cache = loadCache();
  let generated = 0;

  for (const lv of levels) {
    // 跳過 repair 關卡
    if (lv.kind === 'repair') continue;

    const existing = cache[lv.id];
    // 已有且 hash 未變且未強制重跑 → 跳過
    if (!forceAll && existing && existing.md_hash === lv.md_hash) {
      process.stdout.write(`[skip] ${lv.id} (unchanged)\n`);
      continue;
    }
    // 已有且 reviewed:true → 保護，只在強制模式下更新
    if (existing?.reviewed && !forceAll) {
      process.stdout.write(`[protected] ${lv.id} (reviewed:true)\n`);
      continue;
    }
    // 限制單次跑的數量（避免 API 費用失控）
    if (generated >= maxNew) {
      process.stdout.write(`[limit] 已達本次最大生成數 ${maxNew}，跳過 ${lv.id}\n`);
      continue;
    }
    // 讀 MD 內容
    if (!lv._content) {
      process.stdout.write(`[warn] ${lv.id} 無 _content，略過\n`);
      continue;
    }

    process.stdout.write(`[gen] ${lv.id} "${lv.name}" ...`);
    try {
      const result = await generateForLevel(lv.id, lv._content, lv.name);
      cache[lv.id] = {
        md_hash: lv.md_hash,
        reviewed: false,
        intel: result.intel || [],
        questions: result.questions || [],
      };
      saveCache(cache);
      generated++;
      process.stdout.write(` OK（${result.intel?.length ?? 0} 張卡，${result.questions?.length ?? 0} 題）\n`);
    } catch (err) {
      generated++;
      const msg = err.message || '';
      process.stdout.write(` ERROR: ${msg}\n`);
      // 餘額不足或帳戶問題，繼續打也沒用，直接停
      if (msg.includes('credit balance') || msg.includes('insufficient') || msg.includes('402')) break;
    }
  }

  console.log(`\n本次生成 ${generated} 個關卡`);
  return cache;
}
