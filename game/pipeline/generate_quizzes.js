// C:\Users\user\Obsidian\game\pipeline\generate_quizzes.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';

const WIKI_DIR = 'C:\\Users\\user\\Obsidian\\Engineering-Wiki\\wiki';
const CACHE_OUT = 'C:\\Users\\user\\Obsidian\\game\\pipeline\\quizbank_cache.json';

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
      q: "在 AIDC 備援電力系統中，高壓智慧母線槽（Busway）相較於傳統電纜線的主要優勢為何？",
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
        "台系廠商不收取任何售後維護費用"
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
      q: "在 AIDC 系統設計中，進行 CFD（計算流體力學）熱模擬的最主要目的是什麼？",
      opts: [
        "模擬機房內氣流風速與溫度場分佈，預防白區熱點（Hot Spots）並優化氣流",
        "計算機電管路的水擊壓降",
        "評估結構板片承受地震與重力荷載的安全餘裕",
        "驗證自動滅火系統的氣體擴散濃度"
      ],
      ans: 0,
      tag: "CFD模擬",
      ex: "CFD 熱模擬能提前找出機房內的短路氣流與散熱死角，對空冷及液冷風路優化極為關鍵。"
    }
  ],
  rack: [
    {
      q: "在 AIDC 高密度機櫃部署中，為什麼要強制加裝『盲板（Blanking Panels）』？",
      opts: [
        "填補機架未安裝伺服器的空位，防止冷回風短路，保障冷通道氣流直達伺服器",
        "增加機架的物理配重，避免機櫃傾倒",
        "阻擋多餘的電磁輻射（EMI）",
        "主要為了外觀美觀"
      ],
      ans: 0,
      tag: "盲板作用",
      ex: "盲板能阻斷冷氣直接漏往熱通道，是確保氣流不短路的最低成本、最重要配件。"
    }
  ],
  chip: [
    {
      q: "在最新一代 AI GPU（如 Blackwell 架構）晶片級散熱中，為什麼熱設計功耗（TDP）急劇上升到 1000W 以上？",
      opts: [
        "高度整合了 GPU 核心與高頻寬記憶體 (HBM3e)，電晶體數量激增導致發熱極大",
        "因為封裝內部改用電阻更大的鋁製導線",
        "晶片內部風扇的自發熱過高",
        "故意提高發熱量以加速熱電效應發電"
      ],
      ans: 0,
      tag: "GPU散熱",
      ex: "晶片整合度提高與 HBM 疊層使得單顆晶片 TDP 超越 1000W，必須使用液冷直接接觸散熱。"
    }
  ],
  comparison: [
    {
      q: "關於『單相浸沒式液冷』與『雙相浸沒式液冷』的技術特性比較，下列何者正確？",
      opts: [
        "單相工質不發生相變，維護簡單且無氟化液蒸發洩漏毒性風險；雙相效率較高但系統密封要求極嚴",
        "單相效率遠高於雙相，且工質會不斷沸騰氣化",
        "雙相浸沒式完全不需要外部冷卻塔或熱交換器",
        "單相浸沒式只能支持 5 kW/rack 以下的超低密度機架"
      ],
      ans: 0,
      tag: "浸沒液冷比較",
      ex: "單相工質（如合成油或矽油）不相變，維護安全且無蒸發流失；雙相（如氟化液）透過沸騰相變換熱，效率更高但密封性要求極高。"
    }
  ],
  entity: [
    {
      q: "廠商分析：台達電子 (Delta) 在 AIDC 熱管理與機電生態圈中最核心的『商務防線』與戰量盟友定位為何？",
      opts: [
        "為鴻海等 ODM 大廠提供極具商務競爭力的 UPS、CDU 與母線槽，制衡 Vertiv/Schneider 報價",
        "提供一次側大型 Chiller，並主導整個資料中心的土建總包",
        "生產並供應與 NVIDIA 無關的自研 AI 晶片",
        "作為唯一提供氟化液雙相浸沒式容器的供應商"
      ],
      ans: 0,
      tag: "台達定位",
      ex: "台達在 UPS 及二次側液冷 CDU 上性價比極高，是制衡歐美壟斷價格的黃金備選盾牌。"
    },
    {
      q: "廠商分析：維諦 (Vertiv) 在全球 AIDC 液冷二次側與空冷市場的優勢為何？",
      opts: [
        "全球市場占有率高，產品線極為完整，擁有 Hyperscaler 的品牌慣性與指名度",
        "報價比台系廠商便宜 50% 以上，交期極短",
        "與台達電聯合研發並共享所有專利",
        "主力產品為一次側離心式冰水主機（Chiller）"
      ],
      ans: 0,
      tag: "維諦優勢",
      ex: "Vertiv 在全球資料中心一二次側擁有深厚的品牌效應與完整的系統解決方案。"
    },
    {
      q: "廠商分析：大金 (Daikin) 與開利 (Carrier) 在 AIDC 一次側冷源（Chiller Plant）的主要競爭力為何？",
      opts: [
        "生產高效大型工業用 Chiller（如離心式/螺桿式主機）與冷水盤管技術，主導一次側冷源",
        "生產伺服器內建的高靜壓散熱風扇與冷板組件",
        "研發並供應 GB200 用的機架內嵌入式輕量 CDU",
        "提供雙相浸沒式冷卻工質與機櫃"
      ],
      ans: 0,
      tag: "冷源廠商",
      ex: "開利與大金是工業級冰水主機龍頭，主導一次側大型冷源系統。"
    },
    {
      q: "廠商分析：CoolIT 與 Asetek 在 AIDC 生態系中屬於哪一種類型的供應商？",
      opts: [
        "專注於晶片級冷板（Cold Plate）與二次側液冷 CDU、岐管（Manifold）設計的液冷專業廠商",
        "一次側大型機械冷卻塔與 Chiller 總包大廠",
        "發電機組與大容量高可靠不斷電系統 (UPS) 巨頭",
        "主要研發 AI 伺服器機電架構的 ODM 代工大廠"
      ],
      ans: 0,
      tag: "液冷廠商",
      ex: "CoolIT 與 Asetek 是領先的二次側液冷與冷板客製化供應商。"
    }
  ]
};

function sha1(str) {
  return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

// Shuffles an array in place
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1') // [[Link|Text]] -> Text, [[Link]] -> Link
    .replace(/\*\*+/g, '') // Remove bold asterisks
    .replace(/[*_#`>\-\+]/g, '') // Remove basic markdown symbols
    .replace(/[\s\r\n]+/g, ' ') // Collapse whitespace
    .trim();
}

function parseMarkdown(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const md_hash = sha1(raw);

  const { data: fm, content } = matter(raw);

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
    const cleanLine = line.replace(/\r$/, ''); // Clean up Windows line endings if any
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

function parseTable(tableLines) {
  if (tableLines.length < 3) return null;
  // Extract headers
  const headers = tableLines[0].split('|').map(c => c.trim()).filter((c, idx) => idx > 0 && idx < tableLines[0].split('|').length - 1);
  // Parse rows (skip divider at index 1)
  const rows = [];
  for (let i = 2; i < tableLines.length; i++) {
    const line = tableLines[i].trim();
    if (!line) continue;
    let cols = line.split('|').map(c => c.trim());
    if (line.startsWith('|')) cols = cols.slice(1);
    if (line.endsWith('|')) cols = cols.slice(0, -1);
    cols = cols.map(c => c.trim());
    if (cols.length >= 2) {
      rows.push(cols);
    }
  }
  return { headers, rows };
}

// Safe numerical and text distractor helper
function makeDistractors(val, key = '') {
  if (!val) return [];
  const valClean = val.replace(/[✔✘✅❌]/g, '').trim();
  if (['支援', '是', '支援（100%）'].includes(valClean)) {
    return ['不支援', '僅部分支援', '無法確定', '需外接設備'];
  }
  if (['不支援', '否'].includes(valClean)) {
    return ['支援', '僅在特定條件下支援', '由第三方提供', '不確定'];
  }

  // Check if number or percentage
  const numMatch = valClean.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const numStr = numMatch[1];
    const unit = valClean.replace(numStr, '').trim();
    const num = parseFloat(numStr);
    if (!isNaN(num)) {
      let d1, d2, d3;
      if (unit === '%') {
        // Percentage distractors should not exceed 100 or drop below 0
        d1 = Math.max(0, num - 5);
        d2 = Math.max(0, num - 12);
        d3 = Math.max(0, num - 20);
      } else if (unit.toLowerCase().includes('c') || unit.includes('°')) {
        // Temperatures
        d1 = num + 5;
        d2 = num - 5;
        d3 = num + 10;
      } else {
        d1 = Math.round(num * 1.3);
        d2 = Math.max(0, Math.round(num * 0.7));
        d3 = Math.round(num * 1.8);
      }
      const distractors = Array.from(new Set([
        `${d1}${unit}`.trim(),
        `${d2}${unit}`.trim(),
        `${d3}${unit}`.trim()
      ])).filter(v => v !== valClean);
      while (distractors.length < 3) {
        distractors.push(`${Math.round(num + distractors.length * 8)}${unit}`.trim());
      }
      return distractors.slice(0, 3);
    }
  }

  // Fallback realistic generic distractors
  return [
    `與 ${valClean} 不同的工程方案`,
    `低於標準的 ${valClean} 規格參數`,
    '視現場環境工況而定的其他配置'
  ];
}

function generateQuizForFile(filepath, relPath) {
  const { title, sections, md_hash } = parseMarkdown(filepath);

  // Determine Category for fallback questions
  let category = 'm01';
  const normPath = relPath.toLowerCase().replace(/\\/g, '/');
  if (normPath.includes('01_modules')) {
    const mMatch = normPath.match(/module\s*(\d+)/);
    if (mMatch) {
      const mNum = parseInt(mMatch[1], 10);
      category = `m${String(mNum).padStart(2, '0')}`;
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

  // 1. Generate Intel Cards
  const intelCards = [];
  const validSections = sections.filter(s => !['Cross-References', 'Sources', '參考資料', '相關連結', 'Cross-references', '參考文獻'].includes(s.title));

  for (const sec of validSections.slice(0, 4)) {
    let t = sec.title;
    if (t.length > 15) {
      t = t.slice(0, 12) + '...';
    }

    const lines = sec.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let intro = '';
    const points = [];

    for (const line of lines) {
      if (line.startsWith('|') || line.startsWith('#')) continue;

      const cleanLine = cleanMarkdown(line);
      if (!cleanLine) continue;

      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('+') || /^\d+\./.test(line)) {
        if (cleanLine.length > 5 && cleanLine.length < 80) {
          points.push(cleanLine);
        }
      } else if (!intro && line.length > 15 && !line.startsWith('>')) {
        intro = cleanLine;
      }
    }

    if (points.length === 0) {
      const cleanBody = cleanMarkdown(sec.text);
      const sentences = cleanBody.split(/[。！？]/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 60);
      for (const sent of sentences.slice(0, 3)) {
        points.push(sent);
      }
    }

    if (points.length === 0) {
      points.push(`學習並掌握 ${sec.title} 的核心設計規範`);
      points.push(`理解其在 AIDC 熱管理與機電架構中的重要性`);
    }

    const finalPoints = points.slice(0, 4);
    while (finalPoints.length < 2) {
      finalPoints.push(`注意 AIDC 現場實際工況下的選型與配備調節`);
    }

    if (!intro) {
      intro = `本章節詳細介紹關於 ${title} 的 ${sec.title} 關鍵技術參數與設計規格。`;
    }
    if (intro.length > 180) {
      intro = intro.slice(0, 177) + '...';
    }

    intelCards.push({
      t: t,
      intro: intro,
      points: finalPoints,
      f: `重點點位：${sec.title}`,
      note: `在實務工程中，部署 ${title} 時，必須對其 ${sec.title} 相關物理參數與容錯限制進行全面評估。`
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

  // 2. Extract Bold Key-Value Points from sections (for bold questions & vendor profiles)
  const boldPoints = [];
  let parentTerm = '';

  for (const sec of validSections) {
    const lines = sec.text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('#')) {
        parentTerm = '';
        continue;
      }

      const listMatch = line.match(/^(\s*)([-*+\d.]+)\s+(.*)/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const itemText = listMatch[3].trim();
        const boldMatch = itemText.match(/^\*\*([^*]+)\*\*(.*)/);

        if (boldMatch) {
          const term = boldMatch[1].trim();
          let desc = boldMatch[2].trim().replace(/^[:：\-ー\s]+/, '').trim();
          
          if (indent === 0) {
            parentTerm = term;
            if (desc.length > 8) {
              boldPoints.push({ term, desc: cleanMarkdown(desc) });
            }
          } else {
            const fullTerm = parentTerm ? `${parentTerm} - ${term}` : term;
            if (desc.length > 8) {
              boldPoints.push({ term: fullTerm, desc: cleanMarkdown(desc) });
            } else {
              let nextText = [];
              for (let j = 1; j <= 2; j++) {
                if (i + j >= lines.length) break;
                const nl = lines[i+j].trim();
                if (nl.startsWith('#') || nl.startsWith('-') || nl.startsWith('*') || /^\d+\./.test(nl)) break;
                if (nl) nextText.push(nl);
              }
              if (nextText.length > 0) {
                boldPoints.push({ term: fullTerm, desc: cleanMarkdown(nextText.join(' ')) });
              }
            }
          }
        } else {
          if (parentTerm && itemText.length > 15 && indent > 0) {
            boldPoints.push({ term: parentTerm, desc: cleanMarkdown(itemText) });
          }
        }
      } else {
        const boldParaMatch = trimmed.match(/^\*\*([^*]+)\*\*(.*)/);
        if (boldParaMatch) {
          const term = boldParaMatch[1].trim();
          let desc = boldParaMatch[2].trim().replace(/^[:：\-ー\s]+/, '').trim();
          if (desc.length > 15) {
            boldPoints.push({ term, desc: cleanMarkdown(desc) });
          }
        }
      }
    }
  }

  // 3. Generate Quiz Questions
  const questions = [];
  const tables = extractTables(sections);

  // A. Generate Questions from Tables (Smart Cross-Referencing)
  for (const tableLines of tables) {
    if (questions.length >= 6) break;
    const table = parseTable(tableLines);
    if (!table || table.rows.length < 2) continue;

    const headers = table.headers;
    const rows = table.rows;

    for (let colIdx = 1; colIdx < headers.length; colIdx++) {
      if (questions.length >= 6) break;
      const attrName = headers[colIdx] || '規格';

      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        if (questions.length >= 6) break;
        const row = rows[rowIdx];
        const subject = cleanMarkdown(row[0]);
        const correctVal = cleanMarkdown(row[colIdx]);

        if (!subject || !correctVal || correctVal.startsWith('---') || correctVal.length > 80) continue;

        // Pull distractors from other rows in the same column!
        let distractors = rows
          .filter((_, rIdx) => rIdx !== rowIdx)
          .map(r => cleanMarkdown(r[colIdx]))
          .filter(v => v && v !== correctVal && !v.startsWith('---') && v.length < 80);

        distractors = Array.from(new Set(distractors));

        // Fallback helper-based distractors if not enough cross-references
        if (distractors.length < 3) {
          const generated = makeDistractors(correctVal, attrName);
          distractors = distractors.concat(generated);
        }

        const opts = [correctVal, ...distractors.slice(0, 3)];
        shuffle(opts);
        const ansIdx = opts.indexOf(correctVal);

        const qText = `根據 AIDC 技術筆記，關於「${subject}」的「${attrName}」，下列敘述或規格數值何者正確？`;

        questions.push({
          id: `q${questions.length + 1}`,
          type: 'choice',
          d: questions.length < 2 ? 1 : (questions.length < 4 ? 2 : 3),
          q: qText,
          opts: opts,
          ans: ansIdx,
          tag: attrName.slice(0, 10),
          ex: `正確答案為「${correctVal}」。詳見筆記中有關 ${subject} 的 ${attrName} 說明。`
        });
      }
    }
  }

  // B. Generate Questions from Bold Points (Highly Specific lists/notes)
  if (questions.length < 6 && boldPoints.length >= 2) {
    const shuffledPoints = [...boldPoints];
    shuffle(shuffledPoints);

    for (const bp of shuffledPoints) {
      if (questions.length >= 6) break;
      if (bp.term.length > 50 || bp.desc.length > 180 || bp.desc.length < 15) continue;

      // Extract distractors from OTHER bold points in the same file!
      let distractors = shuffledPoints
        .filter(p => p.term !== bp.term)
        .map(p => p.desc)
        .filter(d => d && d !== bp.desc && d.length < 180 && d.length > 15);

      distractors = Array.from(new Set(distractors));

      if (distractors.length < 3) {
        distractors.push(`與 ${bp.term} 無關的另一種工程規格方案與系統配置說明。`);
        distractors.push(`這是一項非關鍵的參數細節，通常僅在特殊高溫環境下由原廠人員設定。`);
        distractors.push(`指的是一次側冷凍冷卻系統的水泵頻率控制，不直接影響機載二次側。`);
      }

      const opts = [bp.desc, ...distractors.slice(0, 3)];
      shuffle(opts);
      const ansIdx = opts.indexOf(bp.desc);

      const qText = `根據技術筆記，在對「${title}」的分析中，關於「${bp.term}」的核心功能、定位或特點是什麼？`;

      questions.push({
        id: `q${questions.length + 1}`,
        type: 'choice',
        d: questions.length < 2 ? 1 : (questions.length < 4 ? 2 : 3),
        q: qText,
        opts: opts,
        ans: ansIdx,
        tag: bp.term.slice(0, 10),
        ex: `正確答案為「${bp.desc}」。詳見筆記中有關 ${bp.term} 的說明。`
      });
    }
  }

  // C. Fallback Questions (Category-Specific)
  const categoryFallbacks = FALLBACK_BANK[category] || FALLBACK_BANK['m01'];
  for (const f of categoryFallbacks) {
    if (questions.length >= 6) break;

    const opts = [...f.opts];
    const correctVal = opts[f.ans];
    shuffle(opts);
    const ansIdx = opts.indexOf(correctVal);

    questions.push({
      id: `q${questions.length + 1}`,
      type: 'choice',
      d: questions.length < 2 ? 1 : (questions.length < 4 ? 2 : 3),
      q: f.q.replace(/{title}/g, title),
      opts: opts,
      ans: ansIdx,
      tag: f.tag,
      ex: f.ex
    });
  }

  // Ensure exactly 6 questions
  while (questions.length < 6) {
    const f = FALLBACK_BANK['m01'][questions.length % FALLBACK_BANK['m01'].length];
    const opts = [...f.opts];
    const correctVal = opts[f.ans];
    shuffle(opts);
    const ansIdx = opts.indexOf(correctVal);

    questions.push({
      id: `q${questions.length + 1}`,
      type: 'choice',
      d: 2,
      q: f.q.replace(/{title}/g, title),
      opts: opts,
      ans: ansIdx,
      tag: f.tag,
      ex: f.ex
    });
  }

  return {
    md_hash: md_hash,
    reviewed: false,
    intel: intelCards,
    questions: questions
  };
}

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
      if (file.endsWith('.md') && file !== 'index.md' && file !== 'log.md') {
        const fullPath = path.join(fullSubdir, file);
        const relPath = path.relative(WIKI_DIR, fullPath);
        const levelId = makeId(relPath.replace(/\\/g, '/'));

        try {
          const levelData = generateQuizForFile(fullPath, relPath);
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
