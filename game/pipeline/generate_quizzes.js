// C:\Users\user\Obsidian\game\pipeline\generate_quizzes.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';

const WIKI_DIR = 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki';
const QUIZZES_DIR = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizzes';

function getFolderName(source) {
  const norm = source.replace(/\\/g, '/');
  if (norm.includes('concepts/')) {
    const parts = norm.split('/');
    // e.g., "concepts/02_air_cooling/CRAC.md" -> "02_air_cooling"
    return parts[1] || 'unknown';
  } else {
    const parts = norm.split('/');
    // e.g., "comparisons/CRAC vs CRAH.md" -> "comparisons"
    return parts[0] || 'unknown';
  }
}

function loadAllQuizzes() {
  const cache = {};
  if (!fs.existsSync(QUIZZES_DIR)) {
    return cache;
  }
  
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.json')) {
        const levelId = path.basename(entry.name, '.json');
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          cache[levelId] = JSON.parse(content);
        } catch (e) {
          console.warn(`Error reading/parsing ${fullPath}: ${e.message}`);
        }
      }
    }
  }
  
  walk(QUIZZES_DIR);
  return cache;
}

// Global Fallback Distractors (Professional AIDC options)
const GLOBAL_FALLBACK_DISTRACTORS = [
  "採用高規格的 N+1 冗餘架構，確保在單一主機停機維護時仍能維持不中斷運行。",
  "實施冷熱通道遏制（Containment）以防止氣流短路，將回風溫度提高以提升製冷能效。",
  "在二次側技術冷卻系統中採用雙板式熱交換器進行傳熱不傳質，隔絕一次側外部水質。",
  "使用符合 OCP 規範的無滴漏快速接頭，保證在帶電插遞伺服器冷熱板時無液體洩漏。",
  "冷卻分配單元（CDU）需具備變頻調節功能，根據 IT 設備的實際發熱負載自動調整水量流量。",
  "在冰水主機（Chiller）運轉中加入智慧變頻控制（VFD），能降低部分負載時的綜合能效指標。",
  "利用室外低溫環境冷源進行 Free Cooling 自然冷卻，冬季關閉壓縮機能顯著降低 PUE 值。",
  "IT 機架功率密度超過 40 kW 時，氣冷已達物理極限，需評估採用冷板式直接液冷方案。"
];

// Clean markdown tags and strip spoiler emojis
function cleanMarkdown(str) {
  if (!str) return '';
  let s = str;
  // Strip spoiler emojis: ✅, ❌, ✔, ✘
  s = s.replace(/[✅❌✔✘]/g, '');

  // Wikilinks: [[Link|Text]] -> Text, [[Link]] -> Link
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/\[\[/g, '').replace(/\]\]/g, ''); // stray [[ ]]
  // LaTeX math: convert common symbols to Unicode
  s = s.replace(/\\le(?![a-zA-Z])/g, '≤').replace(/\\ge(?![a-zA-Z])/g, '≥');
  s = s.replace(/\\approx(?![a-zA-Z])/g, '≈').replace(/\\times(?![a-zA-Z])/g, '×');
  s = s.replace(/\\pm(?![a-zA-Z])/g, '±').replace(/\\to(?![a-zA-Z])/g, '→');
  s = s.replace(/\\rightarrow(?![a-zA-Z])/g, '→').replace(/\\mu(?![a-zA-Z])/g, 'μ');
  s = s.replace(/\\sim(?![a-zA-Z])/g, '~');
  s = s.replace(/\\div(?![a-zA-Z])/g, '÷');
  s = s.replace(/\\rho(?![a-zA-Z])/g, 'ρ');
  s = s.replace(/\\\^\\circ/g, '°').replace(/\^\\circ/g, '°').replace(/\\circ/g, '°');
  s = s.replace(/\\dot\{m\}/g, 'ṁ').replace(/\\dot\s+m/g, 'ṁ').replace(/\\dot\{V\}/g, 'V̇');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1'); // \cmd{text} -> text
  s = s.replace(/\\[a-zA-Z]+/g, '');              // leftover \cmd -> ''
  // Remove LaTeX delimiters $...$ 
  s = s.replace(/\$([^$]*)\$/g, (m, inner) => inner.replace(/[{}_^\\]/g, '').trim());
  s = s.replace(/\$/g, '');
  // Remaining backslashes and special chars
  s = s.replace(/[{}_^\\]/g, '');
  // Markdown formatting
  s = s.replace(/\*\*+/g, '');
  s = s.replace(/[*_#`>]/g, '');
  s = s.replace(/^[\-\+\*\s]+/, '');
  s = s.replace(/[\s\r\n]+/g, ' ').trim();
  return s;
}

// Helper to calculate sha1 hash
function sha1(str) {
  return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

// Shuffling helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function falsifyStatement(str) {
  const distractors = [];
  
  // 1. Swapping antonyms and keywords safely
  const swaps = [
    [/越低越好/g, "越高越好"],
    [/越高越好/g, "越低越好"],
    [/越低/g, "越高"],
    [/越高/g, "越低"],
    [/必須/g, "不需要"],
    [/不需要/g, "必須"],
    [/降低/g, "提高"],
    [/提高/g, "降低"],
    [/空冷/g, "液冷"],
    [/液冷/g, "空冷"],
    [/白區/g, "灰區"],
    [/灰區/g, "白區"],
    [/PUE/g, "COP"],
    [/COP/g, "PUE"],
    [/N\+1/g, "N+2"],
    [/2N/g, "N+1"],
    [/最高/g, "最低"],
    [/最低/g, "最高"],
    [/進氣口/g, "排氣口"],
    [/排氣口/g, "進氣口"]
  ];

  let altered = str;
  let didSwap = false;
  for (const [pattern, replacement] of swaps) {
    const temp = altered.replace(pattern, replacement);
    if (temp !== altered) {
      altered = temp;
      didSwap = true;
    }
  }
  if (didSwap && altered !== str) {
    distractors.push(altered);
  }

  // 2. Swapping numbers
  const numRegex = /(\d+(\.\d+)?)/g;
  const matches = [...str.matchAll(numRegex)];
  if (matches.length > 0) {
    const scales = [1.35, 0.65, 1.8];
    for (const scale of scales) {
      let newStr = str;
      let replaced = false;
      for (const m of matches) {
        const num = parseFloat(m[0]);
        if (num === 0 || num === 1) continue; // Skip 0 and 1
        
        let newNum;
        if (Number.isInteger(num)) {
          newNum = Math.round(num * scale);
          if (newNum === num) newNum += 1;
        } else {
          newNum = parseFloat((num * scale).toFixed(num.toString().split('.')[1].length));
        }
        newStr = newStr.replace(m[0], newNum.toString());
        replaced = true;
      }
      if (replaced && newStr !== str && !distractors.includes(newStr)) {
        distractors.push(newStr);
      }
    }
  }

  return distractors;
}

// Category fallback question bank (Module-specific & Category-specific)
const FALLBACK_BANK = {
  m01: [
    {
      q: "在資料中心空間架構中，哪一個區域（Space）主要放置 IT 設備（如伺服器機架），且對溫濕度控制（HVAC）要求最高？",
      opts: ["白區 (White Space)", "灰區 (Gray Space)", "機電區 (Mechanical Space)", "安全控制區 (Security Space)"],
      ans: 0,
      tag: "空間架構",
      ex: "白區 (White Space) 是放置 IT 設備的區域，對溫濕度有嚴格的控制標準。"
    },
    {
      q: "根據 Uptime Institute 標準，以下關於 Tier III 與 Tier IV 備援設計的敘述，何者正確？",
      opts: [
        "Tier III 要求可並行維護（N+1），Tier IV 要求完全容錯（2N）",
        "Tier III 要求 2N 備援，Tier IV 可以容忍單點故障",
        "Tier III 容許計畫停機，Tier IV 每年停機時數達 22 小時",
        "所有備援都是複雜度越高越好，不需考慮維護成本"
      ],
      ans: 0,
      tag: "備援設計",
      ex: "Tier III 要求可並行維護（N+1），而 Tier IV 要求完全容錯（2N）。"
    },
    {
      q: "在 AIDC 設計中，PUE（電力使用效率）的定義與計算公式為何？",
      opts: ["資料中心總用電 ÷ IT 設備用電", "IT 設備用電 ÷ 資料中心總用電", "冷卻系統用電 ÷ IT 設備用電", "總用電 − IT 設備用電"],
      ans: 0,
      tag: "PUE",
      ex: "PUE = 資料中心總用電 / IT 設備用電，數值越接近 1.0 效率越高。"
    }
  ],
  m02: [
    {
      q: "在 AIDC 熱量換算中，當機架散熱負荷 Q = 100 kW 時，若要換算為冷凍噸 (RT)，其數值大約是多少？（已知 1 RT ≈ 3.517 kW）",
      opts: ["大約 28.4 RT", "大約 35.2 RT", "大約 12.0 RT", "大約 100 RT"],
      ans: 0,
      tag: "熱量換算",
      ex: "1 RT ≈ 3.517 kW，因此 100 kW / 3.517 ≈ 28.4 RT。"
    },
    {
      q: "為什麼高密度 AI 機架（如 GB200 NVL72，功耗大約 120 kW/rack）必須使用直接液冷，而傳統氣冷在物理上限無法滿足？",
      opts: [
        "水（純水）的體積熱容量是空氣的 3,500 倍，風量在有限機房空間內無法實現",
        "水的熱導率比空氣低，散熱效果更慢",
        "氣冷風扇噪音太小，無法提醒工程師設備運行",
        "液冷比氣冷更便宜，初建成本（CAPEX）極低"
      ],
      ans: 0,
      tag: "液冷原因",
      ex: "水的體積熱容量是空氣的 3500 倍，高密度散熱非液冷不可。"
    }
  ],
  m03: [
    {
      q: "在機房精密空調中，CRAC（精密空調機）與 CRAH（精密空調處理機）的主要差別是什麼？",
      opts: [
        "CRAC 內含壓縮機與製冷劑迴路自製冷；CRAH 僅有風扇與水盤管，接入外部冰水",
        "CRAH 內含壓縮機，CRAC 依靠外部冷卻水",
        "CRAC 僅用於熱通道，CRAH 僅用於冷通道",
        "CRAH 只能處理顯熱，CRAC 只能處理潛熱"
      ],
      ans: 0,
      tag: "空冷設備",
      ex: "CRAC 是直膨式自製冷，CRAH 則是接入冰水主機的冷卻水進行換熱。"
    },
    {
      q: "在空冷氣流管理中，實施冷通道遏制（Cold Aisle Containment）的主要工程目的是什麼？",
      opts: [
        "防止冷空氣流失，阻斷冷熱空氣混合以提高回風溫度",
        "降低伺服器風扇的進風阻力",
        "讓機房內工作人員感覺更舒適",
        "將熱空氣直接排入地板下"
      ],
      ans: 0,
      tag: "氣流遏制",
      ex: "遏制冷通道能防止冷熱空氣混合，提升回風溫度與 CRAC 運轉效率。"
    }
  ],
  m04: [
    {
      q: "在液冷二次側系統中，CDU（冷卻分配單元）內部板式熱交換器的核心工程角色是什麼？",
      opts: [
        "傳熱不傳質：阻隔一次側冷凍水與二次側純水混合，僅進行熱量交換",
        "過濾雜質並降低水的酸鹼值",
        "直接把二次側的純水加壓送至室外冷卻塔",
        "將水與防凍液（如 PG25）進行線上調和與混合"
      ],
      ans: 0,
      tag: "CDU原理",
      ex: "CDU 熱交換器實現『傳熱不傳質』，避免外部水質污染昂貴的晶片二次側。"
    },
    {
      q: "在液冷快速接頭（Quick Disconnects, QDs）的選型中，工程師最關心的關鍵參數除了流量與壓降外，還有哪一項安全指標？",
      opts: [
        "無滴漏（Dripless）雙向止回切換防洩漏能力",
        "快速接頭的顏色標記是否醒目",
        "接頭金屬外殼的防靜電塗層厚度",
        "快速接頭的手動鎖緊扭力值"
      ],
      ans: 0,
      tag: "快速接頭",
      ex: "無滴漏設計能確保在帶電維護插拔冷板接頭時，沒有任何冷卻液滴落。"
    }
  ],
  m05: [
    {
      q: "冷凍機房（Chiller Plant）運作時，決定整個冷卻系統最終排熱能力極限的環境物理瓶頸通常是？",
      opts: ["室外空氣的濕球溫度（Wet-Bulb Temperature）", "冷凍水主機的冷媒充填量", "白區內部的氣壓高低", "冷凝水泵的運轉頻率"],
      ans: 0,
      tag: "排熱極限",
      ex: "冷卻塔排熱受限於環境空氣的濕球溫度，這是熱力學的物理上限。"
    },
    {
      q: "在資料中心冷源設計中，Free Cooling（自然冷卻）被廣泛導入的主要節能目的是什麼？",
      opts: [
        "當室外氣溫夠低時，繞過 Chiller 壓縮機直接散熱以降低 PUE",
        "完全關閉冷卻塔以節省用水",
        "降低 IT 設備的風扇功耗",
        "消除二次側與一次側的熱交換溫差"
      ],
      ans: 0,
      tag: "自然冷卻",
      ex: "自然冷卻利用室外低溫環境冷源，不開冰機壓縮機即可散熱，可省下巨額電費。"
    }
  ],
  m06: [
    {
      q: "在 AIDC 機電規劃中，IT 機架容量以 kW 表示，而 UPS 的容量通常以 kVA 表示。關於這兩者的換算關係，下列敘述何者正確？",
      opts: [
        "kW = kVA × 功率因數 (PF)；AIDC 中通常要求 PF 接近 0.99 以上",
        "kVA = kW × 功率因數 (PF)；PF 越低越好",
        "kVA 與 kW 數值完全相等，不需考慮 PF 的無功功率影響",
        "kW 與 kVA 的差別在於是否包含空調系統的冷卻功耗"
      ],
      ans: 0,
      tag: "電力計算",
      ex: "視在功率 (kVA) 乘上功率因數 (PF) 等於實功 (kW)。高能效 AIDC 要求 PF 趨近 1。"
    },
    {
      q: "在 AIDC 裝配中，高壓智慧母線槽（Busway）相較於傳統電纜線的主要優勢為何？",
      opts: [
        "模組化可隨時線上插拔配電插接箱，且具備即時電流與溫度監測",
        "材料成本低廉且電阻為零",
        "能完全消除 UPS 的諧波干擾",
        "不需要進行任何物理支撐或吊掛設計"
      ],
      ans: 0,
      tag: "配電設計",
      ex: "智慧母線槽提供高密度插拔彈性，並透過感測器實施即時配電安全監控。"
    }
  ],
  m07: [
    {
      q: "根據 ASHRAE TC 9.9 指南，以下哪一項是液冷 AIDC 二次側冷卻水質（W1~W5 分級）中最核心的監控化學指標？",
      opts: [
        "水阻率（電導率）、pH 值與氯離子濃度（防止侵蝕銅冷板）",
        "水的懸浮顆粒大小與表面張力",
        "防凍液 PG25 的甜度與粘度",
        "水中溶解的二氧化碳比例"
      ],
      ans: 0,
      tag: "水質標準",
      ex: "電導率、酸鹼值及氯離子是防止晶片水冷板產生電化學腐蝕的關鍵指標。"
    },
    {
      q: "在熱交換器計算中，對數平均溫差（LMTD）的值越大，代表什麼工程意義？",
      opts: [
        "熱交換器的傳熱驅動力越強，相同的換熱量下所需的換熱面積越小",
        "熱交換器的熱阻力越大，效率越低",
        "一次側與二次側的流體流速完全一致",
        "兩側流體混合得越均勻"
      ],
      ans: 0,
      tag: "LMTD",
      ex: "LMTD 越大，代表換熱的熱勢差驅動力越大，能縮小換熱器所需的實體尺寸。"
    }
  ],
  m08: [
    {
      q: "在 AIDC 建設發包中，為何大廠（如鴻海）在進行液冷 CDU 與模組化 UPS 招標時，通常會積極扶植台系廠商（如台達電）？",
      opts: [
        "作為與歐美巨頭（如 Vertiv, Schneider）談判的商務備選盾牌，降低 CAPEX 與縮短 30% 交期",
        "因為歐美廠商技術完全落後，台系廠商有獨家專利",
        "台系廠商能提供一次側的大型工業用 Chiller（冷凍機）",
        "台系廠商不收取 any 售後維護費用"
      ],
      ans: 0,
      tag: "供應鏈戰略",
      ex: "本土台系廠商具備極佳的性價比與協同研發速度，是制衡歐美大廠溢價的商務利器。"
    }
  ],
  air: [
    {
      q: "在氣冷資料中心中，熱通道遏制（Hot Aisle Containment）相比冷通道遏制，在節能上的主要優勢是什麼？",
      opts: [
        "整個機房白區空間保持低溫，且空調回風溫度高，提升 CRAC 熱交換效率",
        "風扇噪音顯著降低",
        "不需要安裝屋頂板或隔簾",
        "漏風時冷氣直接流失，安全性更高"
      ],
      ans: 0,
      tag: "氣冷管理",
      ex: "熱通道遏制能保證冷氣僅在機房白區低溫流動，回風溫度拉高能顯著改善空調效率。"
    }
  ],
  liquid: [
    {
      q: "在冷板式液冷（Cold Plate）系統中，冷卻液（如純水或防凍液）是如何將 GPU/CPU 的熱量帶走的？",
      opts: [
        "冷卻液在密封的微通道銅底冷板內部流動，透過對流換熱帶走熱量",
        "冷卻液直接噴淋在晶片表面進行相變沸騰",
        "冷卻液透過熱管的毛細作用蒸發",
        "冷卻液通過機櫃門上的被動式散熱銅網進行風冷熱交換"
      ],
      ans: 0,
      tag: "冷板原理",
      ex: "冷板式液冷是間接液冷，液體在銅板內部的微通道流過，不直接接觸電子元件。"
    }
  ],
  source: [
    {
      q: "在冷水主機（Chiller）性能指標中，COP（性能係數）定義為何？",
      opts: ["製冷能力（kW） ÷ 輸入電功率（kW）", "輸入電功率（kW） ÷ 製冷能力（kW）", "製冷量 ÷ 冷卻 water 流量", "壓冷器壓差"],
      ans: 0,
      tag: "COP",
      ex: "COP (Coefficient of Performance) 是一台冰機產生的冷量除以消耗的電量之比。"
    }
  ],
  power: [
    {
      q: "在資料中心不斷電系統設計中，『雙轉換在線式（Double Conversion Online）UPS』的作用原理為何？",
      opts: [
        "將市電交流電整流為直流電，再逆變為純淨交流電供電，市電斷電時零切換時間",
        "當市電斷電時，自動切換至柴油發電機，中間有 10 秒電力空檔",
        "利用飛輪物理旋轉儲能，提供短暫 5 秒備用電路",
        "市電正常時直接旁路供電，僅在異常時切換至電池發電"
      ],
      ans: 0,
      tag: "UPS原理",
      ex: "雙轉換 UPS 會進行『AC -> DC -> AC』兩次轉換，保證供電品質且斷電時零切換延遲。"
    }
  ],
  calc: [
    {
      q: "在 ASHRAE TC 9.9 標準中，W1 至 W5 的水溫分級主要影響液冷系統中的哪一項設計？",
      opts: [
        "一次側冷凍水溫要求，進而決定是否能全年使用 Free Cooling 自然冷卻",
        "機房內空氣的相對濕度控制範圍",
        "柴油發電機的冷起動次數",
        "IT 機櫃防漏托盤的冷卻液容量"
      ],
      ans: 0,
      tag: "水溫標準",
      ex: "W3/W4/W5 允許較高的二次側進水溫度（32°C~45°C 以上），有利於實現無 Chiller 全年自然冷卻。"
    }
  ],
  safety: [
    {
      q: "在資料中心進行 CFD（計算流體力學）模擬，最核心的目的是？",
      opts: [
        "預測機房內的氣流風速、壓力分佈與溫度場，以找出局部熱點並優化空調氣流",
        "計算機架的結構承重極限",
        "模擬消防系統噴灑時的液體流速",
        "估算供電線路的短路熱效應"
      ],
      ans: 0,
      tag: "CFD模擬",
      ex: "CFD 能模擬氣體流动，幫工程師在動工前驗證冷熱通道遏制與送回風是否均勻。"
    },
    {
      q: "在進行機電系統 FMEA（故障模式與效應分析）時，工程師評估的核心維度是？",
      opts: [
        "故障發生的嚴重度（S）、頻率（O）與偵測難度（D）",
        "設備的初建成本、折舊年限與維修工時",
        "機房的冷卻極限、電力密度與 PUE 目標",
        "水泵流量、管徑大小與阻力損耗"
      ],
      ans: 0,
      tag: "FMEA分析",
      ex: "FMEA 透過 S、O、D 三個評估值相乘得出風險順序數（RPN），用以防範單點故障。"
    }
  ],
  rack: [
    {
      q: "針對 NVIDIA GB200 NVL72 機架，其總功耗高達 ~120 kW，設計上為什麼必須採用直接液冷（DLC）？",
      opts: [
        "單機架發熱量極高，空冷風量在實務機房物理空間與風扇噪音限制下無法實現",
        "液冷冷板可以完全取代機房的消防噴淋系統",
        "液冷機櫃不需要連接外部冷卻水塔與冰水主機",
        "DLC 機櫃可以免除配備任何斷電備援 UPS"
      ],
      ans: 0,
      tag: "DLC必要性",
      ex: "120 kW 的熱量密度非空氣所能承載（水熱容量是空氣 3500 倍），液冷是唯一物理可行的技術方案。"
    }
  ],
  chip: [
    {
      q: "在晶片散熱中，TIM（熱介面材料，如導熱膏、液態金屬）最核心的作用是？",
      opts: [
        "填補晶片表面與金屬冷板/散熱片之間的微觀空氣間隙，降低接觸熱阻",
        "直接冷卻晶片內部的微通道電路",
        "作為晶片與冷板之間的電氣絕緣與接地傳導層",
        "防止冷板表面的冷凝水滲入晶片封裝內部"
      ],
      ans: 0,
      tag: "TIM作用",
      ex: "金屬接觸面存在微觀空隙，空氣熱導率極低，TIM 能排除空氣、填補間隙以降低接觸熱阻。"
    }
  ]
};

// Parse markdown sections
function parseMarkdown(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const md_hash = sha1(raw);
  const { data: fm, content } = matter(raw);

  let title = '';
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else {
    title = path.basename(filepath, '.md');
  }

  const sections = [];
  let currentSec = { title: '概述', text: '' };
  for (const line of content.split('\n')) {
    const cleanLine = line.replace(/\r$/, '');
    if (cleanLine.startsWith('## ')) {
      if (currentSec.text.trim()) {
        sections.push(currentSec);
      }
      currentSec = { title: cleanLine.slice(3).trim(), text: '' };
    } else {
      currentSec.text += line + '\n';
    }
  }
  if (currentSec.text.trim()) {
    sections.push(currentSec);
  }

  return { title, sections, md_hash, tags: fm.tags || [], moduleNum: fm.module || null };
}

// Extract table data with context
function parseTable(tableText) {
  const lines = tableText.split('\n').map(l => l.trim());
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|')) {
      tableStartIndex = i;
      break;
    }
  }
  if (tableStartIndex === -1) return null;

  // Look for the last bold text before the table
  let context = '';
  for (let i = tableStartIndex - 1; i >= 0; i--) {
    const boldMatch = lines[i].match(/\*\*([^*]+)\*\*/);
    if (boldMatch) {
      context = boldMatch[1].replace(/[:：\s]+$/, '').trim();
      break;
    }
  }

  // If no bold context found, check if there's any simple text before the table
  if (!context) {
    for (let i = tableStartIndex - 1; i >= 0; i--) {
      if (lines[i] && !lines[i].startsWith('#') && lines[i].length > 4 && !lines[i].includes('|')) {
        context = lines[i].replace(/[:：\s]+$/, '').trim();
        break;
      }
    }
  }

  const tableLines = lines.slice(tableStartIndex).filter(l => l.startsWith('|'));
  if (tableLines.length < 3) return null;
  const headers = tableLines[0].split('|').map(c => c.trim()).filter((c, idx) => idx > 0 && idx < tableLines[0].split('|').length - 1);
  const rows = [];
  for (let i = 2; i < tableLines.length; i++) {
    const rowCells = tableLines[i].split('|').map(c => c.trim()).filter((c, idx) => idx > 0 && idx < tableLines[i].split('|').length - 1);
    if (rowCells.length > 0 && !tableLines[i].includes('---')) {
      rows.push(rowCells);
    }
  }
  return { headers, rows, context };
}

// Distractor shifting helper for numbers and ranges
function makeNumericDistractors(valClean) {
  if (!valClean) return null;

  // 1. Range Detection (e.g. "6.5 ~ 8.0" or "18 ~ 27 °C")
  const rangeMatch = valClean.match(/^([≤≥≈<>~]*)\s*(\d+(?:\,\d+)*(?:\.\d+)?)\s*([~~\-ー\s\u223c\uFF5E]+)\s*(\d+(?:\,\d+)*(?:\.\d+)?)(.*)$/);
  if (rangeMatch) {
    const prefix = rangeMatch[1].trim();
    const num1Str = rangeMatch[2];
    const sep = rangeMatch[3].trim();
    const num2Str = rangeMatch[4];
    const unit = rangeMatch[5].trim();

    const num1 = parseFloat(num1Str.replace(/,/g, ''));
    const num2 = parseFloat(num2Str.replace(/,/g, ''));

    if (!isNaN(num1) && !isNaN(num2)) {
      const diff = num2 - num1;
      const step = diff > 0 ? diff : (num1 * 0.3 || 5);

      const d1_1 = num1 + step;
      const d1_2 = num2 + step;
      const d2_1 = Math.max(0, num1 - step);
      const d2_2 = Math.max(0, num2 - step);
      const d3_1 = num1 + step * 2;
      const d3_2 = num2 + step * 2;

      const formatRange = (n1, n2) => {
        const hasDecimal = num1Str.includes('.') || num2Str.includes('.');
        const f1 = hasDecimal ? n1.toFixed(1) : Math.round(n1).toString();
        const f2 = hasDecimal ? n2.toFixed(1) : Math.round(n2).toString();
        const formatted1 = num1Str.includes(',') ? parseFloat(f1).toLocaleString('en-US') : f1;
        const formatted2 = num2Str.includes(',') ? parseFloat(f2).toLocaleString('en-US') : f2;
        const p = prefix ? prefix + ' ' : '';
        const u = unit ? ' ' + unit : '';
        return `${p}${formatted1} ${sep} ${formatted2}${u}`.trim().replace(/\s+/g, ' ');
      };

      return [
        formatRange(d1_1, d1_2),
        formatRange(d2_1, d2_2),
        formatRange(d3_1, d3_2)
      ];
    }
  }

  // 2. Single Number with Optional Prefix & Suffix
  const prefixMatch = valClean.match(/^([≤≥≈<>~]+)\s*/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const cleanForNum = prefix ? valClean.slice(prefixMatch[0].length).trim() : valClean;

  const numMatch = cleanForNum.match(/^(\d+(?:\,\d+)*(?:\.\d+)?)(.*)$/);
  if (numMatch) {
    const numStr = numMatch[1];
    const unit = numMatch[2].trim();
    const num = parseFloat(numStr.replace(/,/g, ''));

    if (!isNaN(num)) {
      let d1, d2, d3;
      if (unit === '%') {
        d1 = Math.min(100, num + 8);
        d2 = Math.max(0, num - 12);
        d3 = Math.min(100, num + 18);
      } else if (unit.toLowerCase().includes('c') || unit.includes('°')) {
        d1 = num + 6;
        d2 = Math.max(0, num - 8);
        d3 = num + 14;
      } else {
        if (num <= 5) {
          d1 = num + 1.2;
          d2 = Math.max(0, num - 1.5);
          d3 = num + 2.8;
        } else if (num <= 50) {
          d1 = num + 8;
          d2 = Math.max(0, num - 12);
          d3 = num + 22;
        } else {
          d1 = Math.round(num * 1.35);
          d2 = Math.max(0, Math.round(num * 0.55));
          d3 = Math.round(num * 1.75);
        }
      }

      const formatVal = (n) => {
        let s = '';
        const decimalIdx = numStr.indexOf('.');
        if (decimalIdx !== -1) {
          const places = numStr.length - decimalIdx - 1;
          s = n.toFixed(places);
        } else {
          s = Math.round(n).toString();
        }
        if (numStr.includes(',')) {
          s = parseFloat(s).toLocaleString('en-US');
        }
        const p = prefix ? prefix + ' ' : '';
        const u = unit ? ' ' + unit : '';
        return `${p}${s}${u}`.trim().replace(/\s+/g, ' ');
      };

      const distractors = Array.from(new Set([
        formatVal(d1),
        formatVal(d2),
        formatVal(d3)
      ])).filter(v => v !== valClean);

      while (distractors.length < 3) {
        distractors.push(formatVal(num + (distractors.length + 1) * 9.5));
      }

      return distractors.slice(0, 3);
    }
  }

  return null;
}

// Scan directory recursively
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

// Convert path to standard ID
function makeId(relPath) {
  const normPath = relPath.replace(/\\/g, '/');
  const base = path.basename(normPath, '.md');
  const mMatch = base.match(/^Module\s+(\d+)/i);
  if (mMatch) return `m${mMatch[1].padStart(2, '0')}`;
  
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

function main() {
  console.log(`Scanning wiki dir: ${WIKI_DIR}`);

  // Load existing cache from split files to preserve reviewed items
  const cache = loadAllQuizzes();
  console.log(`Loaded existing cache with ${Object.keys(cache).length} entries`);

  const files = [];
  if (fs.existsSync(WIKI_DIR)) {
    scanDir(WIKI_DIR, '', files);
  } else {
    console.error(`Wiki directory not found: ${WIKI_DIR}`);
    process.exit(1);
  }

  // First Pass: Parse all files to extract titles, sections, and populate Global Category Pool
  const parsedFiles = [];
  const globalCategoryPool = {};
  
  // Smart Distractor Pools (table cells)
  const tableCellPool = {};
  const tableCategoryPool = {};

  const initPoolCategory = (cat) => {
    if (!globalCategoryPool[cat]) {
      globalCategoryPool[cat] = { summaries: [], terms: [], facts: [] };
    }
  };

  for (const { fullPath, relPath } of files) {
    try {
      const parsed = parseMarkdown(fullPath);
      const levelId = makeId(relPath.replace(/\\/g, '/'));
      
      // Determine Category
      let category = 'm01';
      const normPath = relPath.toLowerCase().replace(/\\/g, '/');
      if (normPath.includes('01_modules')) {
        if (parsed.moduleNum) {
          category = `m${String(parsed.moduleNum).padStart(2, '0')}`;
        }
      } else if (normPath.includes('02_air_cooling')) category = 'air';
      else if (normPath.includes('03_liquid_cooling')) category = 'liquid';
      else if (normPath.includes('04_cooling_sources')) category = 'source';
      else if (normPath.includes('05_power_systems')) category = 'power';
      else if (normPath.includes('06_standards_calculations')) category = 'calc';
      else if (normPath.includes('07_design_safety')) category = 'safety';
      else if (normPath.includes('08_racks_platforms')) category = 'rack';
      else if (normPath.includes('09_chips_packaging')) category = 'chip';
      else if (normPath.includes('comparisons')) category = 'comparison';
      else if (normPath.includes('entities')) category = 'entity';

      initPoolCategory(category);
      initPoolCategory('global');

      const fileObj = {
        levelId,
        fullPath,
        relPath,
        category,
        title: parsed.title,
        sections: parsed.sections,
        md_hash: parsed.md_hash,
        tags: parsed.tags
      };
      parsedFiles.push(fileObj);

      // Extract bullet points & bold terms for the pool
      const validSections = parsed.sections.filter(s => !['Cross-References', 'Sources', '參考資料', '相關連結', 'Cross-references', '參考文獻'].includes(s.title));
      for (const sec of validSections) {
        // Bullet points
        const bulletPoints = sec.text.split('\n')
          .map(l => l.trim())
          .filter(l => l.startsWith('-') || l.startsWith('*') || l.startsWith('+') || /^\d+\./.test(l))
          .map(l => cleanMarkdown(l))
          .filter(l => l.length > 10 && l.length < 180);

        const isSummarySec = ['重點整理', '重點摘要', '核心概念', '結論', 'AIDC 應用場景', '應用場景'].some(kw => sec.title.includes(kw));

        for (const pt of bulletPoints) {
          const item = { text: pt, fileTitle: parsed.title };
          if (isSummarySec) {
            globalCategoryPool[category].summaries.push(item);
          } else {
            globalCategoryPool[category].facts.push(item);
          }
        }

        // Bold term definitions in lists or paragraphs
        const lines = sec.text.split('\n');
        for (const line of lines) {
          const boldMatch = line.trim().match(/^\s*([-*+\d.]*)\s*\*\*([^*]+)\*\*\s*[:：\-ー\s]*(.*)/);
          if (boldMatch) {
            const term = boldMatch[2].trim();
            const desc = cleanMarkdown(boldMatch[3].trim());
            if (term.length > 1 && term.length < 40 && desc.length > 8 && desc.length < 200) {
              const item = { term, desc, fileTitle: parsed.title };
              globalCategoryPool[category].terms.push(item);
            }
          }
        }
      }

      // Extract and Parse Tables for Global Cell Pools
      const tables = [];
      for (const sec of validSections) {
        const tableLines = sec.text.split('\n').filter(l => l.includes('|'));
        if (tableLines.length >= 3) {
          const table = parseTable(sec.text);
          if (table && table.rows.length >= 2) {
            tables.push(table);
          }
        }
      }

      for (const table of tables) {
        const headers = table.headers;
        const rows = table.rows;
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
          const attrName = headers[colIdx];
          if (!tableCellPool[attrName]) {
            tableCellPool[attrName] = new Set();
          }
          if (!tableCategoryPool[category]) {
            tableCategoryPool[category] = new Set();
          }
          for (const row of rows) {
            if (colIdx < row.length) {
              const val = cleanMarkdown(row[colIdx]);
              if (val && val.length > 1 && val.length < 80 && !['—', '-', 'N/A', 'n/a', '無', '不適用'].includes(val.trim())) {
                tableCellPool[attrName].add(val);
                tableCategoryPool[category].add(val);
              }
            }
          }
        }
      }

    } catch (e) {
      console.log(`First-pass error on ${relPath}: ${e}`);
    }
  }

  // Second Pass: Generate Quizzes and Intel Cards using smart heuristics
  let processedCount = 0;
  let protectedCount = 0;

  for (const fileObj of parsedFiles) {
    const { levelId, fullPath, relPath, category, title, sections, md_hash } = fileObj;

    // Check if existing in cache and marked reviewed: true
    if (cache[levelId] && cache[levelId].reviewed) {
      console.log(`[protected] ${levelId} (reviewed:true)`);
      protectedCount++;
      processedCount++;
      continue;
    }

    // A. Generate Intel Cards (deep parsing sections)
    const intelCards = [];
    const validSections = sections.filter(s => !['Cross-References', 'Sources', '參考資料', '相關連結', 'Cross-references', '參考文獻'].includes(s.title));

    for (const sec of validSections.slice(0, 4)) {
      let cardTitle = sec.title;
      if (cardTitle.length > 15) cardTitle = cardTitle.slice(0, 12) + '...';

      const lines = sec.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let intro = '';
      const points = [];
      let formula = '';
      let note = '';

      // Find formula
      const formulaMatch = sec.text.match(/\$\$([\s\S]+?)\$\$/) || sec.text.match(/\$([^$\n]+)\$/);
      if (formulaMatch) {
        formula = cleanMarkdown(formulaMatch[1].trim());
      }

      // Find first blockquote as note
      const blockquoteMatch = lines.find(l => l.startsWith('>'));
      if (blockquoteMatch) {
        note = cleanMarkdown(blockquoteMatch.replace(/^>\s*/, '').trim());
      }

      for (const line of lines) {
        if (line.startsWith('|') || line.startsWith('#') || line.startsWith('>')) continue;
        const cleanL = cleanMarkdown(line);
        if (!cleanL) continue;

        if (line.startsWith('-') || line.startsWith('*') || line.startsWith('+') || /^\d+\./.test(line)) {
          if (cleanL.length > 5 && cleanL.length < 100) {
            points.push(cleanL);
          }
        } else if (!intro && line.length > 15) {
          intro = cleanL;
        }
      }

      // Fallback points if none found
      if (points.length === 0) {
        const sentences = cleanMarkdown(sec.text).split(/[。！？]/).map(s => s.trim()).filter(s => s.length > 12 && s.length < 80);
        for (const sent of sentences.slice(0, 3)) {
          points.push(sent);
        }
      }

      if (points.length === 0) {
        points.push(`掌握 ${sec.title} 相關核心工程規格與技術引數`);
        points.push(`注意在實際 AIDC 環控要求下的系統相容性調節`);
      }

      if (!intro) {
        intro = `本章節重點介紹關於 ${title} 的 ${sec.title} 相關關鍵工況引數與系統組態。`;
      }

      if (intro.length > 180) intro = intro.slice(0, 177) + '...';
      const finalPoints = points.slice(0, 4);
      while (finalPoints.length < 2) {
        finalPoints.push(`遵循 HVAC 與電力系統設計規範以提升 AIDC 可靠度`);
      }

      intelCards.push({
        t: cardTitle,
        intro: intro,
        points: finalPoints,
        f: formula ? formula.slice(0, 50) : `工程焦點：${sec.title}`,
        note: note ? note.slice(0, 150) : `工程評估：部署 ${title} 時，必須對其 ${sec.title} 的具體規格進行多重容錯認證。`
      });
    }

    if (intelCards.length === 0) {
      intelCards.push({
        t: '基礎知識',
        intro: `探討關於 ${title} 的主要工程設計規範與系統整合原理。`,
        points: ['搞懂基本運作模式', '掌握核心設計引數', '注意選型與配置細節'],
        f: `掌握 ${title} 技術要點`,
        note: '這是 AIDC 基礎設施中非常核心的工程環節。'
      });
    }

    // B. Generate Quiz Questions
    const tableQuestions = [];
    const conceptualQuestions = [];
    const termQuestions = [];
    const pool = globalCategoryPool[category] || { summaries: [], terms: [], facts: [] };

    // 1. Table questions (Difficulty 2 & 3)
    const tables = [];
    for (const sec of validSections) {
      const tableLines = sec.text.split('\n').filter(l => l.includes('|'));
      if (tableLines.length >= 3) {
        const table = parseTable(sec.text);
        if (table && table.rows.length >= 2) {
          tables.push(table);
        }
      }
    }

    for (const table of tables) {
      const headers = table.headers;
      const rows = table.rows;

      // Check if Pros/Cons or Adv/Disadv table
      const isProsConsTable = headers.some(h => h.includes('優點') || h.includes('缺點') || h.includes('優勢') || h.includes('劣勢'));
      if (isProsConsTable) {
        const colIdx = headers.findIndex(h => h.includes('優點') || h.includes('優勢'));
        const conIdx = headers.findIndex(h => h.includes('缺點') || h.includes('劣勢'));

        if (colIdx !== -1) {
          for (let rIdx = 0; rIdx < Math.min(rows.length, 2); rIdx++) {
            const correctVal = cleanMarkdown(rows[rIdx][colIdx]);
            if (!correctVal || correctVal.length < 5 || correctVal.length > 100 || ['—', '-', 'N/A', 'n/a', '無', '不適用'].includes(correctVal.trim())) continue;

            // Distractors: Opposites (disadvantages) or from other rows
            let distractors = [];
            if (conIdx !== -1) {
              distractors = rows.map(r => cleanMarkdown(r[conIdx])).filter(v => v && v !== correctVal && v.length > 5 && !['—', '-', 'N/A', 'n/a', '無', '不適用'].includes(v.trim()));
            }
            const otherPros = rows.filter((_, idx) => idx !== rIdx).map(r => cleanMarkdown(r[colIdx])).filter(v => v && v.length > 5 && !['—', '-', 'N/A', 'n/a', '無', '不適用'].includes(v.trim()));
            distractors = distractors.concat(otherPros);
            distractors = Array.from(new Set(distractors));

            // Pull from global cell pools if not enough
            if (distractors.length < 3 && tableCellPool[headers[colIdx]]) {
              const pooled = Array.from(tableCellPool[headers[colIdx]]).filter(v => v !== correctVal && !distractors.includes(v));
              distractors = distractors.concat(pooled);
            }
            if (distractors.length < 3 && tableCategoryPool[category]) {
              const pooled = Array.from(tableCategoryPool[category]).filter(v => v !== correctVal && !distractors.includes(v));
              distractors = distractors.concat(pooled);
            }
            if (distractors.length < 3) {
              distractors = distractors.concat(GLOBAL_FALLBACK_DISTRACTORS);
            }

            const opts = [correctVal, ...distractors.slice(0, 3)];
            shuffle(opts);
            const ansIdx = opts.indexOf(correctVal);

            const qContext = table.context 
              ? `在「${table.context}」的比較中` 
              : `在 AIDC 實務規劃中`;

            tableQuestions.push({
              type: 'choice',
              d: 2,
              q: `${qContext}，下列關於「${title}」技術方案的「優點/優勢」，何者敘述正確？`,
              opts,
              ans: ansIdx,
              tag: '技術優勢',
              ex: `正確答案為「${correctVal}」。詳見筆記中有關 ${title} 的優缺點對比。`
            });
          }
        }
      } else {
        // General spec table
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
          const attrName = headers[colIdx];

          for (let rIdx = 0; rIdx < Math.min(rows.length, 3); rIdx++) {
            const row = rows[rIdx];
            const subject = cleanMarkdown(row[0]);
            const correctVal = cleanMarkdown(row[colIdx]);

            if (!subject || !correctVal || correctVal.length > 80 || correctVal.length < 2) continue;
            if (['—', '-', 'N/A', 'n/a', '無', '不適用'].includes(correctVal.trim())) continue;

            // Resolve Step/Layer sequence numbers hierarchically to avoid "關於「1」" issues
            const firstHeader = (headers[0] || '').trim().toLowerCase();
            const isSequence = /^\d+$/.test(subject) || ['step', 'layer', '編號', '#', 'id', '序號', '項次', '步驟'].includes(firstHeader);
            let resolvedSubject = subject;
            if (isSequence) {
              const seqLabel = headers[0] || '步驟';
              if (colIdx === 1) {
                resolvedSubject = `${seqLabel} ${subject}`;
              } else if (row.length > 1) {
                const nextVal = cleanMarkdown(row[1]);
                resolvedSubject = `${seqLabel} ${subject}（${nextVal}）`;
              } else {
                resolvedSubject = `${seqLabel} ${subject}`;
              }
            }

            // Numeric check for Diff 3 calculation question
            const numericDistractors = makeNumericDistractors(correctVal);
            if (numericDistractors) {
              const opts = [correctVal, ...numericDistractors];
              shuffle(opts);
              const ansIdx = opts.indexOf(correctVal);

              const qContext = table.context 
                ? `在「${table.context}」的設計情境中` 
                : `在「${title}」的技術設計中`;

              tableQuestions.push({
                type: 'choice',
                d: 3,
                q: `${qContext}，關於「${resolvedSubject}」的「${attrName}」數值何者正確？`,
                opts,
                ans: ansIdx,
                tag: attrName.slice(0, 10),
                ex: `正確答案為「${correctVal}」。這是針對 ${resolvedSubject} 物理參數的標準規格值。`
              });
            } else {
              // Categorical spec question (Diff 2)
              let distractors = rows
                .filter((_, idx) => idx !== rIdx)
                .map(r => cleanMarkdown(r[colIdx]))
                .filter(v => v && v !== correctVal && v.length < 80 && !['—', '-', 'N/A', 'n/a', '無', '不適用'].includes(v.trim()));

              distractors = Array.from(new Set(distractors));
              
              // Smart Distractor Pooling
              if (distractors.length < 3 && tableCellPool[attrName]) {
                const pooled = Array.from(tableCellPool[attrName]).filter(v => v !== correctVal && !distractors.includes(v));
                distractors = distractors.concat(pooled);
              }
              if (distractors.length < 3 && tableCategoryPool[category]) {
                const pooled = Array.from(tableCategoryPool[category]).filter(v => v !== correctVal && !distractors.includes(v));
                distractors = distractors.concat(pooled);
              }
              if (distractors.length < 3) {
                distractors = distractors.concat(GLOBAL_FALLBACK_DISTRACTORS);
              }

              const opts = [correctVal, ...distractors.slice(0, 3)];
              shuffle(opts);
              const ansIdx = opts.indexOf(correctVal);

              const qContext = table.context 
                ? `在「${table.context}」的設計情境中` 
                : `在「${title}」的技術設計中`;

              tableQuestions.push({
                type: 'choice',
                d: 2,
                q: `${qContext}，關於「${resolvedSubject}」的「${attrName}」規格描述，下列何者正確？`,
                opts,
                ans: ansIdx,
                tag: attrName.slice(0, 10),
                ex: `正確答案為「${correctVal}」。這是該項目對應的技術特徵與配置說明。`
              });
            }
          }
        }
      }
    }

    // 2. Summary-based Conceptual questions (Difficulty 1 & 2)
    let fileTakeaways = [];
    for (const sec of validSections) {
      const isSummarySec = ['重點整理', '重點摘要', '核心概念', '結論', 'AIDC 應用場景', '應用場景'].some(kw => sec.title.includes(kw));
      if (isSummarySec) {
        fileTakeaways = sec.text.split('\n')
          .map(l => l.trim())
          .filter(l => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('+ ') || /^\d+[\.\s、]+/.test(l))
          .map(l => {
            let s = cleanMarkdown(l);
            s = s.replace(/^\d+[\.\s、]+/, '').replace(/^[\-\*\+\s]+/, '');
            return s.trim();
          })
          .filter(l => l.length > 15 && l.length < 150);
      }
    }

    if (fileTakeaways.length === 0) {
      fileTakeaways = sections.flatMap(sec => sec.text.split('\n'))
        .map(l => l.trim())
        .filter(l => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('+ '))
        .map(l => {
          let s = cleanMarkdown(l);
          s = s.replace(/^\d+[\.\s、]+/, '').replace(/^[\-\*\+\s]+/, '');
          return s.trim();
        })
        .filter(l => l.length > 20 && l.length < 150)
        .slice(0, 5);
    }

    for (const takeaway of fileTakeaways) {
      let distractors = falsifyStatement(takeaway);
      
      if (distractors.length < 3) {
        const otherSummaries = pool.summaries
          .filter(s => s.fileTitle !== title)
          .map(s => s.text)
          .filter(t => t && t !== takeaway && t.length > 15 && t.length < 150);
        distractors = distractors.concat(otherSummaries);
      }

      distractors = Array.from(new Set(distractors));
      if (distractors.length < 3) {
        const categoryFacts = pool.facts.filter(f => f.fileTitle !== title).map(f => f.text);
        distractors = distractors.concat(categoryFacts);
      }
      if (distractors.length < 3) {
        distractors = distractors.concat(GLOBAL_FALLBACK_DISTRACTORS);
      }
      shuffle(distractors);

      const opts = [takeaway, ...distractors.slice(0, 3)];
      shuffle(opts);
      const ansIdx = opts.indexOf(takeaway);

      conceptualQuestions.push({
        type: 'choice',
        d: 1,
        q: `根據 AIDC 設計規範，下列關於「${title}」的主導定位、設計細節或工作特性，何者敘述完全正確？`,
        opts,
        ans: ansIdx,
        tag: '核心概念',
        ex: `正確答案為「${takeaway}」。這是 ${title} 的關鍵概念要點。`
      });
    }

    // 3. Bold term questions (Difficulty 2)
    const fileTerms = [];
    for (const sec of validSections) {
      const lines = sec.text.split('\n');
      for (const line of lines) {
        const boldMatch = line.trim().match(/^\s*([-*+\d.]*)\s*\*\*([^*]+)\*\*\s*[:：\-ー\s]*(.*)/);
        if (boldMatch) {
          const term = boldMatch[2].trim();
          let desc = cleanMarkdown(boldMatch[3].trim());
          desc = desc.replace(/^[，,。．；;\s\(\（]+/, '').trim();
          if (term.length > 1 && term.length < 40 && desc.length > 15 && desc.length < 180) {
            fileTerms.push({ term, desc });
          }
        }
      }
    }

    for (const bt of fileTerms) {
      let distractors = pool.terms
        .filter(t => t.fileTitle !== title || t.term !== bt.term)
        .map(t => t.desc)
        .filter(d => d && d !== bt.desc && d.length > 15);

      distractors = Array.from(new Set(distractors));
      if (distractors.length < 3) {
        const categoryFacts = pool.facts.filter(f => f.fileTitle !== title).map(f => f.text);
        distractors = distractors.concat(categoryFacts);
      }
      if (distractors.length < 3) {
        distractors = distractors.concat(GLOBAL_FALLBACK_DISTRACTORS);
      }
      shuffle(distractors);

      const opts = [bt.desc, ...distractors.slice(0, 3)];
      shuffle(opts);
      const ansIdx = opts.indexOf(bt.desc);

      termQuestions.push({
        type: 'choice',
        d: 2,
        q: `在關於「${title}」的技術分析中，關於「${bt.term}」的定義、特點或工程角色，下列何者正確？`,
        opts,
        ans: ansIdx,
        tag: bt.term.slice(0, 10),
        ex: `正確答案為「${bt.desc}」。詳見筆記中有關 ${bt.term} 的說明。`
      });
    }

    // Select a balanced mix of 6 questions
    const selectedQuestions = [];
    shuffle(tableQuestions);
    shuffle(conceptualQuestions);
    shuffle(termQuestions);

    let tableIndex = 0;
    let conceptIndex = 0;
    let termIndex = 0;

    // Phase 1: Try to pick 2 conceptual, 2 term, 2 table
    while (selectedQuestions.length < 2 && conceptIndex < conceptualQuestions.length) {
      selectedQuestions.push(conceptualQuestions[conceptIndex++]);
    }
    while (selectedQuestions.length < 4 && termIndex < termQuestions.length) {
      selectedQuestions.push(termQuestions[termIndex++]);
    }
    while (selectedQuestions.length < 6 && tableIndex < tableQuestions.length) {
      selectedQuestions.push(tableQuestions[tableIndex++]);
    }

    // Phase 2: Fill remaining up to 6 from any pool
    while (selectedQuestions.length < 6 && conceptIndex < conceptualQuestions.length) {
      selectedQuestions.push(conceptualQuestions[conceptIndex++]);
    }
    while (selectedQuestions.length < 6 && termIndex < termQuestions.length) {
      selectedQuestions.push(termQuestions[termIndex++]);
    }
    while (selectedQuestions.length < 6 && tableIndex < tableQuestions.length) {
      selectedQuestions.push(tableQuestions[tableIndex++]);
    }

    // Phase 3: Fallbacks if still not enough (exact 6)
    let fallbackIndex = 0;
    const categoryFallbacks = FALLBACK_BANK[category] || FALLBACK_BANK['m01'];
    while (selectedQuestions.length < 6) {
      const f = categoryFallbacks[fallbackIndex % categoryFallbacks.length];
      fallbackIndex++;
      const opts = [...f.opts];
      const correctVal = opts[f.ans];
      shuffle(opts);
      const ansIdx = opts.indexOf(correctVal);

      selectedQuestions.push({
        type: 'choice',
        d: 2,
        q: f.q.replace(/{title}/g, title),
        opts: opts,
        ans: ansIdx,
        tag: f.tag,
        ex: f.ex
      });
    }

    // Set correct difficulty distribution and IDs
    selectedQuestions.forEach((q, idx) => {
      q.id = `q${idx + 1}`;
      q.d = idx < 2 ? 1 : (idx < 4 ? 2 : 3);
    });

    cache[levelId] = {
      source: relPath.replace(/\\/g, '/'),
      md_hash: md_hash,
      reviewed: false,
      intel: intelCards,
      questions: selectedQuestions
    };

    // Write individual level JSON file
    const folderName = getFolderName(relPath);
    const targetDir = path.join(QUIZZES_DIR, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, `${levelId}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(cache[levelId], null, 2), 'utf8');

    processedCount++;
  }

  console.log(`Success! Compiled ${processedCount} levels (${protectedCount} protected, ${processedCount - protectedCount} updated).`);
  console.log(`Quizzes saved individually under ${QUIZZES_DIR}`);
}

main();
