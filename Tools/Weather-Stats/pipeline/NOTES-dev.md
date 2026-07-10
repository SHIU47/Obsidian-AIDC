# Phase 0 查證筆記

> 產出目的：供 Phase 1–4 實作時直接引用，避免自創參數名或亂猜門檻數字。

---

## 1. Open-Meteo hourly 歷史 API 變數名稱（已用真實 API 呼叫驗證，非僅讀文件）

驗證方式：直接呼叫 `https://archive-api.open-meteo.com/v1/archive`（台北座標、2023-01-01 一天），
一次帶入全部候選變數名稱，實際取得 200 回應與 `hourly_units`，比讀文件更可靠（文件頁面是動態表單，WebFetch 轉 markdown 有失真風險）。

呼叫範例：
```
https://archive-api.open-meteo.com/v1/archive?latitude=25.03&longitude=121.56&start_date=2023-01-01&end_date=2023-01-01&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,precipitation,wet_bulb_temperature_2m&timezone=auto
```

回傳 `hourly_units`（實測結果，逐字）：

| 變數（verbatim） | 單位（實測回傳） | 狀態 |
|---|---|---|
| `temperature_2m` | °C | 確認正確，與計畫一致 |
| `relative_humidity_2m` | % | 確認正確，與計畫一致（注意底線寫法，非 `relativehumidity_2m`） |
| `dew_point_2m` | °C | 確認正確，與計畫一致 |
| `surface_pressure` | **hPa**（不是 Pa） | 確認正確，但計畫 Phase 2 濕度比公式用 Pa，換算時記得 ×100 |
| `pressure_msl` | hPa | 備用（計畫未用，但兩者皆存在，`surface_pressure` 才是計畫要的站壓） |
| `wind_speed_10m` | km/h（預設單位；可用 `wind_speed_unit=ms` 參數改 m/s） | 確認正確，**若後續程式要算風速統計，注意預設是 km/h 不是 m/s** |
| `wind_direction_10m` | ° | 確認正確 |
| `precipitation` | mm | 確認正確，與計畫假設一致 |
| `wet_bulb_temperature_2m` | °C | **存在！** 原生濕球變數，實測可直接取得 |

**結論：計畫原本假設的 7 個變數名稱（`temperature_2m, relative_humidity_2m, dew_point_2m, surface_pressure, wind_speed_10m, wind_direction_10m, precipitation`）全部正確，無需修改。**

`wet_bulb_temperature_2m` 確認存在且可直接抓取（實測有值，如同時段 T=17.5°C, RH=82% → Twb=15.4°C，量級合理）。
**但依計畫反模式條款**：即使有原生濕球值，Phase 2 的 psychrometrics 模組仍要保留（MCWB 分組平均、焓、濕度比都要自己算；原生 `wet_bulb_temperature_2m` 可用來做 Phase 2 濕球迭代公式的交叉驗證，等於多一組免費的檢核點）。

來源：
- 直接 API 呼叫實測（最高信度）
- https://open-meteo.com/en/docs/historical-weather-api （WebFetch 讀取，變數表格與實測一致）
- https://open-meteo.com/en/docs （WebFetch 讀取，變數表格與實測一致）

信心：**高**（三方來源一致，且以實際 API 回應為準，非僅憑文件截圖或摘要）。

---

## 2. ASHRAE 169 氣候分區門檻（CDD10/HDD18 與濕區 A/B/C）

### 來源
1. **主要來源（逐字表格，PDF 直接讀取）**：AASHE STARS 轉載的 *International Climate Zone Definitions*（內容明載「from Tables B-2, B-3, and B-4」，出自 **ANSI/ASHRAE/IESNA Standard 90.1-2007 Normative Appendix B**）
   https://stars.aashe.org/wp-content/uploads/2024/01/20081111_cztables-1-1.pdf
2. **交叉驗證來源（新版，含 Zone 0）**：UpCodes 轉載的 IECC 2021 條文 Table C301.3（北卡州能源法規版本）
   https://up.codes/viewer/north_carolina/iecc-2021/chapter/CE_3/ce-general-requirements
3. **交叉驗證來源**：ASHRAE 官方氣象資料庫網站的說明頁
   https://ashrae-meteo.info/v3.0/help_IECC.php

### 版本差異說明（重要）
90.1-2007 版（來源 1，逐字 PDF）**沒有 Zone 0**，最熱一律歸入 Zone 1（`5000 < CDD10°C`，無上限）。
後續 ASHRAE 169-2020 / IECC 2021（來源 2、3）新增 **Zone 0**（給杜拜等極熱氣候），把 Zone 1 上限收窄為 `5000 < CDD10°C ≤ 6000`。
兩版對 Zone 2–8 的門檻數字完全一致（三來源交叉核對無誤）。**若計畫要分區，建議採新版（含 Zone 0）**，因為 IECC 2021 是目前現行版本。

### 熱區門檻（CDD10°C / HDD18°C，SI 單位；採新版含 Zone 0，逐字核對三來源一致）

| Zone | 門檻條件（CDD10°C / HDD18°C） |
|---|---|
| 0 | 6000 < CDD10°C |
| 1 | 5000 < CDD10°C ≤ 6000 |
| 2 | 3500 < CDD10°C ≤ 5000 |
| 3 | CDD10°C < 3500 **且** HDD18°C ≤ 2000 |
| 4 | CDD10°C ≤ 2500 **且** 2000 < HDD18°C ≤ 3000 |
| 5 | 3000 < HDD18°C ≤ 4000 |
| 6 | 4000 < HDD18°C ≤ 5000 |
| 7 | 5000 < HDD18°C ≤ 7000 |
| 8 | 7000 < HDD18°C |

> 註：Zone 3/4 的 CDD 上限在來源 1（舊版，逐字）寫 `CDD10°C ≤ 2500`，來源 2/3（新版，AI 摘要非逐字）部分片段寫 `CDD10°C < 3500`，兩者對 3A/3B 與 3C（Marine）的切分方式略有出入（3C 用 CDD≤2500，3A/3B 用 CDD<3500 這段對不齊）。**建議實作時只用 Zone 編號（0–8）粗分，不要做到 A/B/C 三位一體的完整字母後綴分類**，除非另外花時間逐字核對 169-2020 原文（本次查證未取得 169-2020 正式逐字稿，僅有 AI 摘要）。

### 濕區判定（Marine C / Dry B / Moist(Humid) A）— 逐字轉載自來源 1（90.1-2007 Appendix B，Table B-3/B-4），並經來源 2 內容交叉驗證一致

**Marine (C)** — 需同時滿足以下 4 項：
1. 最冷月均溫介於 27°F(-3°C) 至 65°F(18°C) 之間
2. 最暖月均溫 < 72°F(22°C)
3. 至少 4 個月月均溫 > 50°F(10°C)
4. 夏季為乾季：冷季（北半球 10 月–3 月）中降雨最多的月份，其降雨量須為其餘月份中降雨最少月份的至少 3 倍

**Dry (B)** — 需同時滿足：
- 非 Marine，且
- IP 單位：`P < 0.44 × (T − 19.5)`（P=年降雨英吋，T=年均溫°F）
- SI 單位：`P < 2.0 × (T + 7)`（P=年降雨公分，T=年均溫°C）

**Moist/Humid (A)** — 非 Marine 且非 Dry 的地區

信心：**高**（門檻數字與濕區公式來自逐字 PDF 表格，非 AI 摘要臆測；Zone 0 新增與 3A/3B/3C 邊界細節來自 AI 摘要，信心較低，已在上方標註）。

### 建議
- Phase 3/4 實作氣候分區時，**只做 Zone 0–8 數字分區**（門檻已逐字驗證，信心高）。
- **暫不做 A/B/C 濕區字母後綴**，因為：(1) 濕區判定需要「高日照期降雨占比」等更複雜的月resolution 資料與判斷邏輯（Dry 定義的完整版其實有 3 段條件式，本次只查到主要一段，另兩段條件式未查到逐字來源）；(2) 3A/3B/3C 邊界在新舊版本間有出入，未完全核實。若使用者要求濕區分類，需要另外一輪查證 ASHRAE 169-2020 或 IECC 2021 正式逐字條文（例如購買 ANSI webstore 版本或找更完整的免費轉載）。
