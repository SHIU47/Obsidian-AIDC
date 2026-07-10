# 10年天氣統計 — ASHRAE 等級加強計畫

> 本計畫給新的 Claude session 執行。執行前先完整讀完本檔，特別是「既有架構與已知地雷」一節，裡面是前一輪開發實際踩過的坑。
> 使用者偏好：繁體中文回應、單一 HTML 檔案 + Tailwind CDN + vanilla JS（不用框架）、**物理公式準確性優先，不可簡化到失真**、不做沒被要求的功能。

---

## 目標

把現有的陽春版（月均溫/降雨/年趨勢）升級成 **ASHRAE Climatic Design Conditions 等級**的氣候設計資料庫：

1. 用 Open-Meteo **hourly** 歷史資料（現在只用 daily）計算真正的設計條件：乾球/濕球/露點的年百分位設計值、HDD/CDD、自然冷卻時數等
2. 每個城市筆記升級成完整的氣候設計條件表（類似 ASHRAE Fundamentals Ch.14 的城市表格）
3. 地球工具加入設計條件面板與跨城市比較
4. 建立 Obsidian Base 做跨城市查詢比較

---

## 既有架構與已知地雷（必讀）

### 檔案結構（vault 根目錄 = `C:\Users\user\Obsidian\Engineering-Wiki\`）

```
Engineering-Wiki\                      ← Obsidian vault 根目錄（.obsidian 在這層，不是外層 Obsidian\）
├── Tools\Weather-Stats\
│   ├── index.html                     ← 單一檔案工具（資料內嵌，無外部本地檔）
│   └── pipeline\
│       ├── fetch-weather.js           ← Node 24 直接執行（原生 fetch），不透過中介層
│       └── locations.json             ← 地點清單（id/name/continent/country/lat/lon）
├── 天氣統計\<洲>\<國家>\<城市>.md      ← pipeline 自動產生的筆記樹（11 城市）
└── 10年天氣統計.md                    ← 入口筆記
```

### 地雷清單（每一條都是實際踩過的）

| # | 地雷 | 正確做法 |
|---|------|---------|
| 1 | Obsidian HTML Viewer 外掛**無法載入本地相對路徑的 `<script src>`**（如 `weather-data.js`） | 所有資料必須內嵌在 index.html 的 `/* WEATHER_DATA_START */ ... /* WEATHER_DATA_END */` 標記區塊內，由 pipeline 用 regex 取代注入。外部 **CDN**（Tailwind、unpkg globe.gl、Google Fonts）可正常載入 |
| 2 | globe.gl 的 htmlElements 層預設讀 `d.lng`，我們資料欄位是 `lon` | 必須保留 `.htmlLat(d => d.lat).htmlLng(d => d.lon)` 存取器 |
| 3 | Open-Meteo 免費版有**每分鐘流量限制**（HTTP 429），一次抓 10 年資料權重高 | fetch-weather.js 已有 429 → 等 65 秒重試一次的機制；改抓 hourly 後權重更高，需要「逐年分段抓取 + 本地快取」（見 Phase 1） |
| 4 | pipeline 注入 index.html 時，若新資料與舊資料相同，`replace` 前後字串一樣 | 判斷標記存在要用 `markerRe.test(html)`，不能用「取代前後是否相等」判斷 |
| 5 | 這個 vault 有 obsidian-git 自動 backup（每 10 分鐘 commit+push 到 GitHub `SHIU47/Obsidian-AIDC`，並部署 GitHub Pages） | **大型原始資料快取絕不能放進會被 git 追蹤的路徑**，快取目錄必須加入 `.gitignore`（見 Phase 1）|
| 6 | Obsidian 筆記內嵌 iframe 顯示本地 HTML 會失敗 | 開啟方式：HTML Viewer 外掛（Scripts: ON）直接開 index.html，或 GitHub Pages 網址 |
| 7 | 使用者環境：Windows 11、PowerShell、Node v24 | 路徑處理用 `path.join`，寫檔一律 `utf-8` |

### Open-Meteo Archive API（已驗證）

- Base URL：`https://archive-api.open-meteo.com/v1/archive`
- 參數：`latitude, longitude, start_date, end_date`（yyyy-mm-dd）、`hourly=` 或 `daily=`（逗號分隔）、`timezone=auto`
- 回傳：`hourly.time[]` + 各變數平行陣列、`hourly_units`；`elevation` 在頂層
- 本計畫需要的 hourly 變數（名稱已照官方文件，勿自創）：
  `temperature_2m, relative_humidity_2m, dew_point_2m, surface_pressure, wind_speed_10m, wind_direction_10m, precipitation`
- 免費、不需 API key；歷史資料回溯至 1940（ERA5）
- 沒有 monthly 聚合，一律自己算

---

## Phase 0：現況盤點與文件確認

1. 讀取現有 `pipeline/fetch-weather.js`、`index.html`（注意它含 500+ 行內嵌資料，用 Grep 找結構、不要整檔硬讀）、一份現有城市筆記（如 `天氣統計/歐洲/英國/倫敦.md`）
2. 用 WebFetch 確認 Open-Meteo hourly 參數頁（https://open-meteo.com/en/docs/historical-weather-api）上述變數名稱無誤
3. **ASHRAE 169 氣候分區判定準則**（CDD10 / HDD18 門檻與濕區 A/B/C 判定）需查證後才能寫死數字——用 WebSearch 查 ASHRAE 169 / IECC climate zone 定義，在計畫筆記中記下引用來源。查不到可信來源的部分，寧可標註「未分區」也不要編造門檻
4. 產出：在 `pipeline/` 下建 `NOTES-dev.md` 簡記查證結果（允許的 API 變數、分區準則與來源）

## Phase 1：Pipeline 升級 — hourly 抓取與本地快取

**檔案：`pipeline/fetch-weather.js`（擴充，不重寫既有 daily 邏輯）**

1. 新增 hourly 抓取：每城市**逐年**呼叫（10 次），變數如上。單次呼叫約 8,760 筆 × 7 變數
2. 本地快取：回應原始 JSON 存 `pipeline/cache/<city-id>/<year>.json`；重跑時**快取命中就跳過 API**（歷史年份資料不會變，快取永久有效）。這讓之後加新城市或改統計邏輯不用重抓全部
3. 在 vault 根目錄 `.gitignore` 加一行 `Tools/Weather-Stats/pipeline/cache/`（**先讀現有 .gitignore 再 append，不要覆蓋**）
4. 429 處理沿用「等 65 秒重試」；逐年呼叫之間加 2 秒間隔。11 城市 × 10 年 = 110 次呼叫，第一次全抓預估 10–30 分鐘（含等待），屬正常，**要用背景執行跑**
5. 驗證：cache 目錄有 110 個檔案；抽查一個檔案的 `hourly.time.length` ≈ 8760（閏年 8784）

## Phase 2：濕空氣熱力學計算模組

**新檔案：`pipeline/psychrometrics.js`（純函數模組，供 fetch-weather.js require）**

公式一律用 ASHRAE Fundamentals 標準式，**不可用簡化近似式**（使用者是 HVAC 工程師，會驗算）：

1. 飽和水蒸氣壓 `pws(T)`：Hyland-Wexler 式（ASHRAE Fundamentals Ch.1 eq.5/6，冰面與水面分段）
2. 水蒸氣分壓：`pw = RH/100 × pws(T)`
3. 濕度比：`W = 0.621945 × pw / (p − pw)`（p 用該小時 `surface_pressure`，單位注意：API 回傳 hPa，公式用 Pa 或一致換算）
4. 濕球溫度 `Twb`：用 ASHRAE Ch.1 eq.33/35 迭代求解（bisection 或 Newton 皆可，收斂容差 0.01°C）：
   `W = ((2501 − 2.326·Twb)·Ws(Twb) − 1.006·(T − Twb)) / (2501 + 1.86·T − 4.186·Twb)`（T、Twb 單位 °C，適用 T ≥ 0；T < 0 用對應冰面式）
5. 焓：`h = 1.006·T + W·(2501 + 1.86·T)` [kJ/kg]
6. **驗證（必做）**：寫 `pipeline/test-psychrometrics.js`，用已知檢核點驗算，例如 T=35°C、RH=40%、p=101325 Pa → Twb ≈ 24.1°C（±0.3°C）；T=30°C、RH=100% → Twb=30°C；數個點對照線上 psychrometric calculator。測試不過不得進 Phase 3

## Phase 3：設計條件統計計算

**擴充 `pipeline/fetch-weather.js` 的聚合邏輯**，對每城市 10 年 hourly（約 87,600 小時）計算：

### 冷卻設計條件（年百分位，全部小時排序取值）
- 乾球 0.4% / 1% / 2% 設計值 + 對應的 mean coincident wet-bulb（MCWB：取乾球落在該百分位 ±0.5°C 區間內所有小時的濕球平均）
- 濕球 0.4% / 1% / 2% 設計值 + MCDB
- 露點 0.4% / 1% / 2% 設計值 + 對應濕度比（g/kg）+ MCDB

### 加熱設計條件
- 乾球 99.6% / 99%（即最冷的 0.4% / 1% 百分位）

### 極端值
- 10 年極端最高/最低乾球、極端最高濕球（含發生年月）
- 年極端值的平均與標準差

### 度日與時數統計
- HDD18.3 / CDD18.3 / CDD10（10 年平均，由 daily 均溫算，沿用既有 daily 資料）
- 自然冷卻時數（10 年平均，時/年）：
  - 乾球 < 15°C（air-side economizer 全時數）
  - 濕球 < 12.8°C（water-side economizer，冷卻水塔 approach 假設 3.9K 供 18°C 冷卻水）
  - **這兩個門檻是預設假設，執行時在筆記中明確標註假設條件**
- 高濕球時數：Twb > 24°C、> 26°C、> 28°C 的年均時數（冷卻水塔選型風險指標）

### 資料量控制（重要）
- index.html 內嵌資料**只放聚合結果**（設計條件表 + 既有月/年統計），不放 hourly 原始資料，注入後 index.html 總大小需 < 2 MB
- 完整聚合結果另存 `pipeline/output/<city-id>-stats.json`（gitignore 不需要，這個小）

### 驗證
- 台北 0.4% 乾球設計值應落在 34–36°C、0.4% 濕球 27–29°C 區間（與 ASHRAE 台北站published 值同量級）；新加坡 HDD18.3 ≈ 0；倫敦 CDD18.3 < 500。若嚴重偏離，先檢查單位（hPa/Pa、%/fraction）再檢查百分位方向

## Phase 4：城市筆記升級

**擴充 `buildNote()`**，在既有內容之後加入：

1. 「ASHRAE 風格設計條件表」：冷卻/加熱/極端值三張表，欄位含百分位、DB、MCWB（或 WB、MCDB）、濕度比
2. 「度日與自然冷卻」表：HDD/CDD、各門檻自然冷卻時數、高濕球時數（標註假設條件）
3. ASHRAE 169 氣候分區（依 Phase 0 查證的準則；查不到可信準則就標「—」）
4. frontmatter 新增屬性：`db_04, wb_04, dp_04, hdd18, cdd18, free_cooling_ws_hours, climate_zone`（給 Base 查詢用）
5. 表格數值全部標單位；來源標註「Open-Meteo ERA5 reanalysis，非氣象站實測，與 ASHRAE 官方表格（氣象站資料）會有小幅差異」——這句必須寫進筆記，工程上誠實很重要

## Phase 5：地球工具升級

**修改 `index.html`**（保持單一檔案；動 UI 前先呼叫 `ui-ux-pro-max` skill 與 `dataviz` skill）：

1. Detail panel 新增「設計條件」區塊：0.4%/1%/2% DB/WB/DP 表 + 自然冷卻時數 KPI
2. 標記顏色改為依 0.4% 濕球設計值的冷暖色階（濕球是冷卻系統選型的關鍵參數）；圖例放地球面板角落
3. 新增簡單城市清單側欄或下拉（11+ 城市在地球上點選不便，尤其台灣六都擠在一起）
4. 保留既有月均溫/降雨/年趨勢圖不動
5. 驗證：用 Playwright headless 截圖確認（scratchpad 已有 shot.js 模式可參考：`chromium.launch()` → `file:///C:/Users/user/Obsidian/Engineering-Wiki/Tools/Weather-Stats/index.html` → 收集 console error + 截圖），并測至少 2 個城市切換

## Phase 6：Obsidian Base 跨城市比較

1. 在 `天氣統計/` 下建立 `城市比較.base`（Obsidian Bases 格式——**先讀 vault 中既有的 `未命名.base` 了解此版本 Obsidian 的 base YAML 語法**，不要憑記憶寫）
2. 檢視：全部城市一覽（filter `type: weather-stats`），欄位 city/country/db_04/wb_04/hdd18/cdd18/free_cooling_ws_hours/climate_zone，依 wb_04 排序
3. 驗證：請使用者在 Obsidian 開啟確認（AI 無法驗證 Base 渲染）

## Phase 7：總驗證

1. `node pipeline/test-psychrometrics.js` 全過
2. 重跑 `node pipeline/fetch-weather.js`（背景執行）：cache 命中不重抓、11 份筆記重新產生、index.html 注入成功且 < 2 MB
3. Playwright 截圖：地球 + 標記 + 設計條件面板正常、console 無錯誤
4. 抽查 3 份筆記數值合理性（台北/新加坡/倫敦，用 Phase 3 的檢核區間）
5. 提醒使用者：在 Obsidian HTML Viewer 按 Refresh、開 Base 確認、等 obsidian-git 自動 push 後 GitHub Pages 版本才會更新

---

## 反模式（不要做）

- 不要把 hourly 原始資料塞進 index.html 或筆記
- 不要用 Stull 近似式算濕球（誤差可達 1°C，使用者不接受）
- 不要發明 Open-Meteo 不存在的參數（如 `monthly=`、`wet_bulb_temperature_2m` 需先查證是否存在，查證過才能用；查到有就可直接用、省掉自算濕球，但 Phase 2 的 psychrometrics 模組仍需要——MCWB/焓/濕度比還是要自己算）
- 不要改動 `game/`、`wiki/`、`raw/` 等既有資料夾
- 不要把快取目錄 commit 進 git
- 不要新增框架（React/Vue）或 build step
- 不要在回應結尾加冗長總結（使用者偏好簡短直接）
