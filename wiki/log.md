# Wiki 活動日誌

記錄所有 ingest、query、lint 活動。格式：`## [日期] 操作類型 | 說明`

## [2026-06-06] expand | 晶片與機櫃專題分類細化與 Blackwell/Rubin 擴充

- **二級目錄重構：**
  - 將 `08_target_platforms/` 重新命名為 `08_racks_platforms/` (機櫃與系統平台)。
  - 新建 `09_chips_packaging/` (晶片與半導體封裝)，並將 `Cold Plate`、`TIM`、`MCL與MCCP`、`HBM與光通訊熱管理`、`熱管與均熱板`、`AI 工作負載熱特性` 移動至此。
- **新建概念頁面 —— 2 頁：**
  - [[NVIDIA GPU 晶片演進與散熱限值]]：詳細梳理 H100、H200、Blackwell (B100/B200)、Blackwell Ultra (B300)、Rubin 的 TDP、Tj 限值、熱點熱通量密度（$100\sim 150 \text{ W/cm}^2$）、50-80 psi 壓迫力與 PCB 翹曲、CTE 錯位應力。
  - [[GB300與Blackwell Ultra機櫃架構]]：解析 Blackwell Ultra $130\sim 140\text{ kW}$ 機櫃級規格、盲插 UQD 接頭浮動公差、DC Power Busbar 盲插安全、同程/異程管路水力平衡、以及 CDU 二次側防結露露點控制器聯鎖。
- **索引更新：**
  - 重構 [[index]]，新增 `08_racks_platforms` 與 `09_chips_packaging` 的表格，並將總頁面數更新為 **76 頁** (共計 78 個實體 Markdown 檔案)。
  - 運行 `verify_links.ps1`，全庫 **934 個 Wikilinks 交叉連結完美通過**，保證 0 斷裂連結。

---

## [2026-06-06] restructure | 知識庫目錄專題重構與 Graph View 優化

- **子目錄重構：** 將 `wiki/concepts/` 下的 50 個概念頁面，依專題目標分類移入 8 個新建的子資料夾：
  - `01_modules/` (8 篇導讀模組)
  - `02_air_cooling/` (5 篇空冷設備)
  - `03_liquid_cooling/` (11 篇液冷與晶片溫控)
  - `04_cooling_sources/` (6 篇冷凍冷源)
  - `05_power_systems/` (6 篇供電系統)
  - `06_standards_calculations/` (5 篇計算與標準)
  - `07_design_safety/` (5 篇設計與消防結構安全)
  - `08_target_platforms/` (3 篇目標平台與負載特性)
- **連結與索引維護：**
  - 重構 [[index]] 首頁的概念表結構，按 8 大專題分組並提供清晰指引。
  - 運行 `verify_links.ps1` 進行完整性驗證，在二級目錄結構下 **934 個 Wikilinks 全數驗證通過**，保持 0 斷裂連結。
  - 此重構完全保留了所有的交叉引用，並為使用者在 Obsidian 中利用 `path:` 篩選為 Graph View 配置 Color Groups 鋪平了道路，有效解決了「毛線球」密集問題。

---

## [2026-06-06] expand | AIDC HVAC 全面知識補強（16 新頁面，5 強化頁面）

- **新建概念頁面（wiki/concepts/）— 11 頁：**
  - [[乾冷器]]（乾式空氣散熱原理、逼近溫差計算、45°C 溫水冷卻後全球 Chiller-Free 可行性圖表）
  - [[漏液偵測系統]]（高風險點分佈、繩式感測電纜 ±1m 精度、ESD 聯鎖邏輯 <2s 截止、DCIM 整合）
  - [[電化學腐蝕與接地]]（伽凡尼腐蝕三要件、導電率 <10 μS/cm 防護門檻、BTA 緩蝕劑、等電位設計）
  - [[熱管與均熱板]]（相變傳熱原理、等效導熱 10,000~50,000 W/m·K、GPU 散熱鏈、LHP 與 MCL 演進）
  - [[Tier 分級深度解析]]（Tier I~IV 完整定義、99.671%→99.995% 可用性、Concurrently Maintainable vs Fault Tolerant）
  - [[消防系統]]（VESDA 四級告警邏輯、Pre-Action 雙聯鎖乾管、FM-200 vs Novec 1230 GWP 比較）
  - [[電力品質與諧波]]（SMPS THD、IEEE 519-2014 限值、中性線 3 次諧波疊加、APF 主動濾波）
  - [[冷媒知識]]（CFC→HCFC→HFC→HFO 四代、R-1234ze(E) GWP=7、EU F-Gas 2024 法規）
  - [[AI 工作負載熱特性]]（訓練 vs 推論功率特徵、Power Spike 1.2~1.3×TDP、熱節流連鎖反應）
  - [[中壓電力引入]]（台電 22kV 引入流程、GIS vs AIS、A/B Feed 中壓雙路、申請時程 18~36 個月）
  - [[地板荷重與機房結構]]（Vera Rubin 2 噸/架設計基準、IEC 地板等級、台灣 BCZ2 地震 0.4g 抗震設計）
- **強化現有頁面（wiki/concepts/）— 5 頁：**
  - [[Free Cooling]]（新增乾冷器整合、三段控制邏輯 Mode A/B/C）
  - [[Chiller Plant]]（新增三次側水路架構圖、化學水處理分節）
  - [[LMTD 計算]]（新增 ε-NTU 換熱有效度法 Section 4）
  - [[CFD 模擬]]（新增液冷 CFD 特殊邊界條件：CDU 廢熱、快接壓降等）
  - [[UPS]]（新增模組化 UPS、STS 靜態轉換開關、Eco-Mode 效率 vs 穩定性分析）
- **新建比較頁面（wiki/comparisons/）— 2 頁：**
  - [[Dry Cooler vs. 冷卻塔]]（顯熱 vs 潛熱根本差異、WUE=0 vs 高耗水、全面對比決策框架）
  - [[N+1 vs 2N vs N+2 備援架構]]（三種備援模式定義、成本 1.1×→2.0× 分析、各子系統典型選擇）
- **新建廠商實體頁面（wiki/entities/）— 3 頁：**
  - [[Carrier]]（開利，AquaForce Vision PUREtec R-1234ze GWP=7，全球備件網絡最廣）
  - [[奇鋐]]（AVC 3017，MCCP 微通道冷板製造龍頭，NVIDIA 認可供應商）
  - [[健策]]（Jentech 3653，MCL 微通道晶片蓋板台灣領跑者，Vera Rubin Ultra 封裝冷卻潛力）
- **索引更新：** [[index]] 頁面總數 58 → **74 頁**，快速入口區塊、各分類表均已補齊新頁面連結

---

## [2026-06-06] expand | Computex 2026 前沿液冷技術擴充

- **新建對比頁面（wiki/comparisons/）：**
  - [[單相 vs 雙相直接液冷]]（顯熱對流與沸騰相變潛熱物理機制、絕緣介質 GWP 合規限制、工作壓力、蒸汽鎖與冷凝迴路設計）
- **優化與擴充概念頁面（wiki/concepts/）：**
  - [[Cold Plate]]（加入單向流 vs. 雙向對流 U-turn/Split-flow 流道結構，分析其均溫性優勢與流阻壓降折衷；新增正反面 PCB 夾心冷卻之雙面液冷板設計）
  - [[快速接頭]]（加入單向斷接與雙向斷接 UQD 精密對比，解析無滴漏 Flat-face 閥芯設計；引入 OCP UQD 標準規範與盲插對準徑向公差補償機制）
- **關聯整合與索引：**
  - 修改 [[Module 04 - 液冷系統深度解析]] 以編織雙向流冷板、雙向斷接快接頭與 2P-DLC 等全新主題。
  - 更新 [[index]] 將新技術整合至快速入口區塊及比較專區表，更新總頁面數至 **54 頁**。
  - 重新運行 `verify_links.ps1` 確保全庫 0 dangling links，且雙向 Wikilinks 連結更形緊密。

## [2026-05-21] expand | 補齊 WUE 概念專頁 + 大幅強化 LMTD 設計實務

- **新建概念頁面（wiki/concepts/）：**
  - [[WUE 計算]]（單獨建立水資源使用效率指標專頁，包含 L/kWh 物理公式、PUE vs WUE 物理折衷天平、各等級合規標準、AIDC 瞬時補水量與管徑設計範例、CoC 濃縮倍數等五大優化手段）
- **強化概念頁面（wiki/concepts/）：**
  - [[LMTD 計算]]（大幅擴充 LMTD 工程數字直覺，建立 4 大溫差區間對換熱面積、壓降與 PUE 的物理關聯；新增從寫入 RFQ 溫點到審查廠商技術標計算書中的 Area Margin 與壓降等 3 大實務行動指南）
- **關聯重組：**
  - 修改 [[PUE 計算]] 中的延伸指標說明，建立 active 連結至 [[WUE 計算]] 專頁。
  - 更新 [[index]] 首頁導覽，將 [[WUE 計算]] 整合至 Quick Access 儀表板及計算標準表，更新總頁數為 **53 頁**。
  - 重新運行 `verify_links.ps1`，全庫累積 630 個雙向連結，保持 0 dangling links 完美記錄。

## [2026-05-20] expand | 比較專區與廠商生態大規模擴充 (Stage 4)

- **新建比較頁面（wiki/comparisons/）：**
  - [[單相 vs 雙相浸沒式液冷]]（顯熱與潛熱物理機制、PFAS/GWP 環保合規、密封壓力容器）
  - [[開式冷卻塔 vs 閉式冷卻塔]]（蒸發散熱與間接換熱效能、Legionella 防控、Free Cooling 影響）
  - [[離心式 vs 螺桿式冷凍機]]（動能與容積壓縮機、IPLV、喘振防護與磁浮無油能效增益）
  - [[微通道冷板 vs 鰭片式冷板]]（微通道與宏觀鰭片流阻壓降、極限晶片熱阻、製造工藝對比）
  - [[(In-Row) vs (RDHX)]]（局部氣流循環與全捕獲、老舊機房液冷升級可行性）
- **新建廠商實體頁面（wiki/entities/）：**
  - [[Schneider]]（施耐德電機，大容量 CRAH、電力與 EcoStruxure 整合優勢）
  - [[Daikin]]（大金空調，冷凍機房 Chiller 與 Turbocor 磁浮壓縮機專利與部分負載能效）
  - [[Trane]]（特靈空調，超大規模 CVHE 低壓離心冰機與模組預製冷凍機房）
  - [[Foxconn]]（鴻海精密，自研 Cold Plates、Smart Manifold 與快速接頭垂直整合）
  - [[Asetek]]（丹麥液冷先驅，專利 Pump-on-Cold Plate 置泵冷板方案與 OEM 驗證）
  - [[STULZ]]（德國精密空調專家，CyberAir/CyberRow 系列與高精度 PID 溫控）
  - [[Delta]]（台達電子，Modulon UPS、智慧母線槽、自研高能效 CDU 與伺服器風扇）
  - [[Rittal]]（德國威圖，VX IT 物理機櫃標準與 LCP 熱交換水門防護方案）
- **全庫網狀關聯重組：**
  - 重構 [[設備與廠商選型對照矩陣]]，增加 [[Delta]] 產品佈局，並將所有廠商升級為 active wikilinks 雙向連結。
  - 修改 [[Module 05 - 冷源與冷凍機房]] 及 [[Module 08 - 廠商生態系統]]，全面編織新比較專頁與廠商實體。
  - 更新 [[index]] 快速入口區塊，新增多維分欄與多重快速導覽路徑，頁面總數自 39 頁擴展至 **52 頁**。
  - 運行 `verify_links.ps1` 驗證，Wikilinks 總數破 450+，保持 0 dangling links 的完美狀態。

## [2026-05-20] expand | CDU 架構釐清 + 新建對比與廠商實體頁面 + 導覽優化

- **新建頁面（wiki/concepts/）：**
  - [[液冷系統 - CDU 架構]]（CDU 內部構造、水路迴路與變頻/溫度/備援控制邏輯、水質指標）
- **優化頁面（wiki/concepts/）：**
  - [[CDU 架構與選型]]（轉型為選型容量/流量計算、TBE 技術評估評分矩陣與廠商橫向對比）
- **新建頁面（wiki/comparisons/）：**
  - [[空冷 vs 液冷]]（體積熱容量物理極限推導、PUE 能效分析、CAPEX vs OPEX 成本結構）
  - [[CRAC vs CRAH]]（DX 直膨系統與 CW 冷凍水系統工作原理、系統熱傳路徑對比、控制指標、AIDC 混合選型）
- **新建頁面（wiki/entities/）：**
  - [[Vertiv]]（Liebert XDU CDU、精密 CRAH、電力與 DCIM 端到端整合優劣勢及 GB200 認證與交期）
  - [[CoolIT]]（專利冷板微流道、CHx 系列列間 CDU、Manifolds 與快接、ODM 協同研發優劣勢）
- **修復與關聯：**
  - 修改 [[Module 01 - Data Center 基礎概念]]、[[Module 04 - 液冷系統深度解析]] 及 [[Module 08 - 廠商生態系統]] 中的 cross-references 與 wikilinks，建立全庫完整的網狀連結。
- **更新：**
  - [[index]] 重組並新增頂部 **「⚡ 快速入口區塊」** 導覽儀表板，頁面總數自 34 頁擴充至 **38 頁**。

---

## [2026-05-20] expand | 補建概念頁面 + 修正 YAML 格式

- **新建頁面（wiki/concepts/）：**
  - 冷卻塔（Cooling Tower）
  - 浸沒式液冷（Immersion Cooling）
  - HAC CAC 熱通道冷通道封閉
  - UPS（不斷電系統）
  - 發電機（Emergency Generator）
  - CFD 模擬
  - Cold Plate（液冷冷板）
  - TIM 導熱介面材料
- **新建頁面（wiki/sources/）：**
  - AIDC HVAC 學習基地 - Notion（修復所有頁面的 dangling source 引用）
- **修正：** 19 個概念頁面的 YAML `sources` 格式（`[ [ ".." ] ]` → `[ "[ [ .. ] ]" ]`，Obsidian wikilink 正確語法）
- **更新：** index.md 重組為分類索引，頁面總數 8 → 29

---

## [2026-05-20] ingest | Notion AIDC HVAC 學習基地 Module 01~08

- **來源：** Notion「AIDC HVAC 學習基地 | 東旭筆記」（鴻海入職前培訓，2026-04 至 2026-05）
- **建立頁面：**
  - Module 01 - Data Center 基礎概念（測驗 90/100）
  - Module 02 - AIDC 熱負荷與冷卻需求（測驗 93/100）
  - Module 03 - 空冷系統架構（測驗 91/100）
  - Module 04 - 液冷系統深度解析（測驗 92/100）
  - Module 05 - 冷源與冷凍機房（測驗 94/100）
  - Module 06 - 電力架構與機電整合（測驗 93/100）
  - Module 07 - 設計計算實務（測驗 93/100）
  - Module 08 - 廠商生態系統
  - index.md、log.md（此文件）
- **關聯圖節點（待建立頁面）：** PUE 計算、Free Cooling、Chiller Plant、LMTD 計算、GB200 NVL72 冷卻需求、ASHRAE TC 9.9、液冷系統 CDU 架構、Module 02~08（已建立）
- **頁面總數：** 8 個模組頁面
- **備註：** 此為 Engineering-Wiki 初始化 ingest，素材來自入職前自主學習記錄，含自我測驗 Q&A 與觀念修正記錄
