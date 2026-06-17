# Engineering-Wiki Index

AIDC HVAC 工程知識庫索引。由 Antigravity 維護，最後更新：2026-06-06。

---

## ⚡ 快速入口區塊 (Quick Access)

| 🎯 核心目標與標準 | ❄️ 核心液冷組件 | 📊 系統對比專欄 | 🏢 龍頭與主要廠商 |
| :--- | :--- | :--- | :--- |
| [[GB200 NVL72 冷卻需求]] / [[GB300與Blackwell Ultra機櫃架構]] / [[Vera Rubin 機櫃物理與電力架構]] / [[800VDC 直流配電]] / [[AIDC 微電網架構]] | [[液冷系統 - CDU 架構]] / [[NVIDIA GPU 晶片演進與散熱限值]] | [[空冷 vs 液冷]] | [[Vertiv]] / [[CoolIT]] |
| [[PUE 計算]] / [[WUE 計算]] / [[AIDC TCO 成本模型與決策模板]] | [[Cold Plate]] / [[MCL與MCCP液冷技術]] | [[CRAC vs CRAH]] | [[Schneider]] / [[Delta]] |
| [[ASHRAE TC 9.9 Data Center 溫濕度標準]] / [[AIDC 核心標準與規範指引]] | [[快速接頭]] / [[儲冷罐]] / [[HBM與晶片級光通訊熱管理]] / [[TCS 二次側與冷卻水化學管理]] | [[單相 vs 雙相浸沒式液冷]] / [[單相 vs 雙相直接液冷]] | [[Foxconn]] / [[Asetek]] |
| [[設備與廠商選型對照矩陣]] / [[AIDC 驗收測試與調試實務]] | [[浸沒式液冷]] / [[CDU 架構與選型]] / [[PDU與電力引線]] | [[微通道冷板 vs 鰭片式冷板]] | [[STULZ]] / [[Rittal]] / [[Daikin]] / [[Trane]] |
| [[乾冷器]] / [[Tier 分級深度解析]] / [[AIDC FMEA 故障模式與效應分析]] | [[漏液偵測系統]] / [[熱管與均熱板]] | [[Dry Cooler vs. 密閉式冷卻水塔]] / [[N+1 vs 2N vs N+2 備援架構]] | [[Carrier]] / [[奇鋐]] / [[健策]] |
| [[消防系統]] / [[電力品質與諧波]] / [[BMS與DCIM序列控制邏輯]] | [[電化學腐蝕與接地]] / [[AI 工作負載熱特性]] | — | [[雙鴻]] / [[Cooler master]] |
| [[中壓電力引入]] / [[地板荷重與機房結構]] | [[冷媒知識]] | — | — |

---

## 學習模組（wiki/concepts/）

| 頁面 | 摘要 | 測驗分數 |
|------|------|---------|
| [[Module 01 - Data Center 基礎概念]] | DC 定義、Tier 分級、空間架構、AI DC vs 傳統 DC、PUE 入門 | 90/100 |
| [[Module 02 - AIDC 熱負荷與冷卻需求]] | 熱量換算、IT 設備功耗、冷卻容量計算鏈、設計裕度、流量計算 | 93/100 |
| [[Module 03 - 空冷系統架構]] | CRAC/CRAH、熱通道封閉、架架地板、RDHX、ASHRAE TC 9.9 | 91/100 |
| [[Module 04 - 液冷系統深度解析]] | DLC Cold Plate、CDU 架構、TIM、快速接頭、儲冷罐、浸沒式 | 92/100 |
| [[Module 05 - 冷源與冷凍機房]] | Chiller 選型、冷卻塔、Free Cooling、LMTD 計算、PUE 優化 | 94/100 |
| [[Module 06 - 電力架構與機電整合]] | kW/kVA、電力路徑、UPS、發電機、A/B Feed、MEP 協調 | 93/100 |
| [[Module 07 - 設計計算實務]] | 完整設計流程、計算鏈、CFD 驗證、Boss 關、常見錯誤 | 93/100 |
| [[Module 08 - 廠商生態系統]] | 廠商分層、TBE 評分矩陣、選型原則、未來趨勢 | — |

---

## 比較專區（wiki/comparisons/）

| 頁面 | 對對比主題與核心工程價值 |
|------|-------------------|
| [[空冷 vs 液冷]] | 體積熱容量物理限制推導、PUE 效率與能效分析、CAPEX vs OPEX 成本結構與回收期評估 |
| [[CRAC vs CRAH]] | DX 直膨系統與 CW 冷凍水系統工作原理、系統架構圖對比、控制精度與 AIDC 混合部署選型 |
| [[單相 vs 雙相浸沒式液冷]] | 顯熱 vs 潛熱換熱原理、PFAS 環保法規與 GWP 限制、密封壓力容器與沸騰控制、建置成本評估 |
| [[開放式冷卻塔 vs 閉式冷卻塔]] | 蒸發散熱與間接換熱對比、Legionella 防控與水質要求、逼近溫差極限、對 Free Cooling 影響 |
| [[離心式 vs 螺桿式冷凍機]] | 動能式與容積式原理對比、IPLV 與 VFD 變頻控制、喘振防護、無油磁浮技術的能效增益 |
| [[微通道冷板 vs 鰭片式冷板]] | 微通道與宏觀鰭片流體力學對比、極限晶片熱阻 $R_{jc} \le 0.03 \text{ K/W}$ 、水流阻力與壓降、製造工藝 (Skiving vs CNC) |
| [[(In-Row) vs (RDHX)]] | 局部風路循環 vs 機櫃熱風全捕獲、風扇功耗影響、老舊機房液冷升級可行性、混合冷卻系統部署 |
| [[單相 vs 雙相直接液冷]] | 顯熱對流與沸騰相變潛熱機制、絕緣冷媒與 GWP 環保合規、系統高壓氣密與汽鎖 (Vapor Lock) 控制 |
| [[Dry Cooler vs. 密閉式冷卻水塔]] | 顯熱 vs 潛熱換熱根本差異、WUE=0 vs 高耗水、Legionella 風險、45°C 溫水冷卻後全球 Chiller-Free 可行性 |
| [[N+1 vs 2N vs N+2 備援架構]] | 三種備援模式完整定義、可用性成本分析（1.1× vs 2.0×）、UPS/Chiller/CDU 各子系統典型設計選擇 |

---

## 廠商實體（wiki/entities/）

| 頁面 | 廠商定位與 AIDC 核心評估 |
|------|-----------------------|
| [[Vertiv]] | 全球資料中心機電龍頭，XDU 系列大容量 CDU、精密 CRAH、電力與 DCIM 一體化方案，面臨交期瓶頸 |
| [[CoolIT]] | 直接液冷 (DLC) 先驅與純專門技術廠，專利冷板微通道、緊湊型 CHx 系列 CDU，客製化敏捷度高 |
| [[Schneider]] | 施耐德電機，全球電力分配與 EcoStruxure 資料中心軟硬體霸主，Uniflair 精密空調與大容量 CRAH 供應商 |
| [[Daikin]] | 大金空調，冷凍機房核心 Chiller 霸主，掌握 Turbocor 磁浮無油壓縮機專利技術，極限部分負載能效 IPLV/NPLV，支援快速啟動 |
| [[Trane]] | 特靈空調，美系大型 Chiller 與冷凍系統老牌巨頭，CVHE 超低壓離心冰機與預製化冷凍機房模組 |
| [[Foxconn]] | 鴻海精密，自研 Cold Plates、Smart Manifold 與快速接頭，實現從 L10 到 L11 的垂直整合與供應鏈自給 |
| [[Asetek]] | 丹麥液冷先驅，專利 Pump-on-Cold Plate (冷板置泵) 方案，與 Tier-1 伺服器 OEM 深度驗證 |
| [[STULZ]] | 德國精密空調專家，CyberAir 與 CyberRow 氣冷系列，高精度 PID 溫濕度控制能力，客製化彈性極強 |
| [[Delta]] | 台達電子，電源管理與散熱解決方案巨頭，Modulon DPH 模組化 UPS、智慧母線槽、自研 CDU 及高靜壓伺服器風扇 |
| [[Rittal]] | 德國威圖，機櫃結構物理防護霸主，VX IT 機架標準與 LCP 主動/被動 RDHX 門後水冷系統，物理裝甲防護 |
| [[Carrier]] | 開利，全球最大 Chiller 製造商之一，AquaForce Vision PUREtec R-1234ze（GWP=7），備件服務網絡最廣 |
| [[奇鋐]] | 奇鋐科技（AVC 3017），台灣 MCCP 微通道冷板製造龍頭，NVIDIA Vera Rubin 供應鏈認可，真空釺焊量產良率最高 |
| [[健策]] | 健策精密（Jentech 3653），MCL 微通道晶片蓋板台灣領跑者，30 年均熱板工藝，Vera Rubin Ultra 封裝冷卻潛在主力 |
| [[雙鴻]] | 雙鴻科技（Auras 3324），台灣液冷二次側龍頭，同時具備冷板、CDU 與分歧管完整方案，與 ODM 合作緊密 |
| [[Cooler master]] | 酷碼科技（Cooler Master），全球散熱巨合，自研 3D VC 極限空冷技術及機架式 CDU，客製化敏捷度高 |

---

## 概念頁面（wiki/concepts/）

### 01_modules (導讀模組)

| 頁面 | 說明 |
|------|------|
| [[Module 01 - Data Center 基礎概念]] | DC 定義、Tier 分級、空間架構、AI DC vs 傳統 DC、PUE 入門 |
| [[Module 02 - AIDC 熱負荷與冷卻需求]] | 熱量換算、IT 設備功耗、冷卻容量計算鏈、設計裕度、流量計算 |
| [[Module 03 - 空冷系統架構]] | CRAC/CRAH、熱通道封閉、架架地板、RDHX、ASHRAE TC 9.9 |
| [[Module 04 - 液冷系統深度解析]] | DLC Cold Plate、CDU 架構、TIM、快速接頭、儲冷罐、浸沒式 |
| [[Module 05 - 冷源與冷凍機房]] | Chiller 選型、冷卻塔、Free Cooling、LMTD 計算、PUE 優化 |
| [[Module 06 - 電力架構與機電整合]] | kW/kVA、電力路徑、UPS、發電機、A/B Feed、MEP 協調 |
| [[Module 07 - 設計計算實務]] | 完整設計流程、計算鏈、CFD 驗證、Boss 關、常見錯誤 |
| [[Module 08 - 廠商生態系統]] | 廠商分層、TBE 評分矩陣、選型原則、未來趨勢 |

### 02_air_cooling (空冷設備)

| 頁面 | 說明 |
|------|------|
| [[CRAC]] | Computer Room Air Conditioner，自帶壓縮機，小型或邊緣機房 |
| [[CRAH]] | Computer Room Air Handler，需外部冷凍水，大型 AIDC 空冷主力 |
| [[In-Row Cooling]] | 機列式冷卻，30+ kW/rack 高密度補強 |
| [[RDHX]] | 機架後門熱交換器，最快改造方案，18~24°C 供水 |
| [[HAC CAC 熱通道冷通道封閉]] | HAC/CAC 設計、Bypass 控制、盲板安裝 |

### 03_liquid_cooling (液冷迴路組件)

| 頁面 | 說明 |
|------|------|
| [[CDU 架構與選型]] | CDU 選型容量與流量計算、TBE 技術評估矩陣、廠商考量 |
| [[液冷系統 - CDU 架構]] | CDU 內部構造、水路迴路與運作控制邏輯（隔離與水質） |
| [[快速接頭]] | 乾式斷開、帶壓插拔、防呆設計，Hot Swap 的基礎 |
| [[儲冷罐]] | 熱慣性緩衝（10~30 min）、穩壓穩流、排氣補水，液冷的 UPS |
| [[浸沒式液冷]] | 單相/雙相浸沒，PUE≈1.02，2026+ 逐步成熟 |
| [[漏液偵測系統]] | 高風險點分佈圖、繩式感測電纜精度 ±1m、ESD 聯鎖邏輯（<2s 截止閥）、DCIM 整合告警 |
| [[電化學腐蝕與接地]] | 伽凡尼腐蝕三要件、導電率 <10 μS/cm 防護門檻、BTA 銅緩蝕劑、等電位接地設計 |
| [[TCS 二次側與冷卻水化學管理]] | TCS 迴路導電度控制、pH標準、BTA緩蝕配比、乙二醇比熱折衷、微米級旁濾、材料電位序列相容性 |

### 04_cooling_sources (冷源與冷凍水路)

| 頁面 | 說明 |
|------|------|
| [[Chiller Plant]] | 冷凍機房完整架構，一次/二次/三次側，Chiller 選型、台數計算與化學水處理 |
| [[磁浮式冷凍機]] | 磁浮軸承原理、部分負載 COP 優勢、AIDC 首選理由 |
| [[冷卻水塔]] | 冷卻塔類型、濕球溫度限制、水質管理（ASHRAE Guideline 12-2020）|
| [[Free Cooling]] | 三種形式（直接/間接/乾冷器）、各地可用時數、台灣策略、三段控制邏輯 |
| [[乾冷器]] | 乾式空氣冷卻原理、逼近溫差計算、45°C 溫水冷卻全球 Chiller-Free 可行性、乙二醇修正 |
| [[冷媒知識]] | CFC→HCFC→HFC→HFO 四代演進、R-1234ze(E) GWP=7、EU F-Gas 2024 台灣環保署法規 |
| [[氣冷式冰機]] | 空冷冷凝原理、環境溫度對 COP 影響、WUE=0 適用場景、邊緣 DC 與缺水地區應用 |
| [[吸收式冰機]] | LiBr 吸收循環原理、單效/雙效/三效 COP、CHP 廢熱驅動製冷、CCHP 三聯產架構 |

### 05_power_systems (電力配電)

| 頁面 | 說明 |
|------|------|
| [[UPS]] | Online Double Conversion、模組化 UPS、STS 靜態轉換開關、Eco-Mode 效率 vs 穩定性 |
| [[發電機]] | 備援時序、儲油量、排氣方向（不能朝冷卻塔）|
| [[Busbar 匯流排]] | 高密度機架配電唯一可行方式，I²R 發熱 2~5% 需納入 CFD |
| [[PDU與電力引線]] | 落地式 RPP、智慧型機架 rPDU、電力引線配線之氣流阻礙隱患，以及架空隨插即用 Tap-off 插接箱 |
| [[電力品質與諧波]] | 非線性負載 THD、IEEE 519-2014 限值、中性線 3 次諧波疊加、APF 主動濾波 |
| [[中壓電力引入]] | 台電 22kV 引入流程、GIS 開關設備、A/B Feed 雙路設計、申請時程 18~36 個月 |
| [[800VDC 直流配電]] | B200/NVL72 輸電電流與銅排重量物理推導、直流熄弧物理限制（無過零點）、絕緣檢測浮地設計 |
| [[AIDC 微電網架構]] | 分布式能源與 BESS 毫秒級動態削峰計算、SOFC 廢熱回收吸附式冰機（CCHP）整合、STS 孤島無縫切換 |

### 06_standards_calculations (計算與標準)

| 頁面 | 說明 |
|------|------|
| [[PUE 計算]] | PUE 公式、冷卻耗電計算、各等級意義 |
| [[WUE 計算]] | WUE 水資源使用效率指標、PUE vs WUE 折衷物理、優化手段與補水管徑設計範例 |
| [[LMTD 計算]] | 對數平均溫差公式、ε-NTU 換熱有效度法、CDU 熱交換器應用與採購審標實務 |
| [[ASHRAE TC 9.9 Data Center 溫濕度標準]] | A1~A4 等級、量測點（進氣口）、節能關係 |
| [[Tier 分級深度解析]] | Tier I~IV 完整定義、Concurrently Maintainable vs Fault Tolerant、可用性 99.671%→99.995%、成本倍數 |
| [[AIDC 核心標準與規範指引]] | 收錄並導讀 ASHRAE TC 9.9、Guideline 12、NFPA 75/76/2001、IEEE 519、IEC 61508、OCP UQD 等核心規範 |
| [[AIDC TCO 成本模型與決策模板]] | 5年 TCO 成本公式、PUE 與 WUE 邊際成本折衷、CDU 交期風險評估、2N/N+1 輕載能效懲罰曲線 |

### 07_design_safety (設計與安全)

| 頁面 | 說明 |
|------|------|
| [[CFD 模擬]] | 設計流程中的位置（Step 7，設備採購前）、四大驗證項目、液冷 CFD 特殊邊界條件 |
| [[DCIM]] | 資料中心基礎設施管理，PUE 即時計算、告警、容量規劃 |
| [[設備與廠商選型對照矩陣]] | 10 大核心設備與全球一線製造商選型對照、發包規格 RFQ 要點及標準設計工況 |
| [[消防系統]] | VESDA 四級告警邏輯、Pre-Action 雙聯鎖乾管、FM-200 vs Novec 1230 GWP 比較、DLC 漏液 ESD 整合 |
| [[地板荷重與機房結構]] | Vera Rubin 2 噸/架設計基準、IEC 地板等級（A1500 不足）、台灣 BCZ2 地震 0.4g 抗震設計 |
| [[AIDC 驗收測試與調試實務]] | Level 1 ~ Level 5 調試進程、FAT、SAT、IST、假負載滿載拉載、市電斷電切換、冷卻失效測試實務 |
| [[AIDC FMEA 故障模式與效應分析]] | 表格化分析水泵/板換/UQD快接/冷板堵塞/漏水/結露/UPS/發電機等 10 大失效事件與聯鎖保護 |
| [[BMS與DCIM序列控制邏輯]] | 差壓變送器恆壓差控制水泵、三通調節閥露點追蹤邏輯、冰機啟停（Staging）調度、水塔風扇控制 |

### 08_racks_platforms (機櫃與系統平台)

| 頁面 | 說明 |
|------|------|
| [[GB200 NVL72 冷卻需求]] | 原廠規格、供水溫度 ≤17°C、DLC 設計要點 |
| [[GB300與Blackwell Ultra機櫃架構]] | Blackwell Ultra 130~140 kW 系統、UQD 盲插公差、同程/異程平衡、防結露露點閥門控制 |
| [[Vera Rubin 機櫃物理與電力架構]] | 2026 次世代 Rubin 平台、190~230 kW 極限功率、45°C 溫水冷卻設計、重載滑軌、VDC PDB 及中板 (Midplane) 物理分配 |

### 09_chips_packaging (晶片與半導體封裝)

| 頁面 | 說明 |
|------|------|
| [[NVIDIA GPU 晶片演進與散熱限值]] | H100/Blackwell/Rubin 晶片 TDP、Tj 限制、熱通量熱點、50-80 psi 扣合壓力、CTE 剪應力失效 |
| [[Cold Plate]] | DLC 核心換熱元件，80~90% GPU 熱量，≤17°C 供水，雙向流道與雙面冷板 |
| [[TIM 導熱介面材料]] | Cold Plate 與 GPU 之間的導熱介面，GB200 用銦箔（一次性）|
| [[MCL與MCCP液冷技術]] | 微通道液冷板（MCCP）與微通道晶片蓋板（MCL）之封裝級冷卻對流換熱原理及供應鏈陣營 |
| [[HBM與晶片級光通訊熱管理]] | HBM4 堆疊晶圓 $\le 85^\circ\text{C}$ 刷新率熱限制、矽光子 CPO 與外置雷射源 ELS $\le 70^\circ\text{C}$ 波長防飄移溫控 |
| [[熱管與均熱板]] | 相變傳熱原理、等效導熱 10,000~50,000 W/m·K, GPU 散熱鏈位置、LHP 與 MCL 演進 |
| [[AI 工作負載熱特性]] | 訓練 vs 推論功率特徵、Power Spike 1.2~1.3×TDP、熱節流連鎖反應、CDU 設計裕度 1.2×1.1 |

---

## Source 頁面（wiki/sources/）

| 頁面 | 說明 |
|------|------|
| [[AIDC HVAC 學習基地 - Notion]] | 主要來源，Module 01~08 學習記錄、測驗成績、錯誤修正 |

---

## 統計

- 頁面總數：8 個模組頁面 + 48 個概念頁面 + 10 個比較頁面 + 15 個廠商實體頁面 + 1 個 source 頁面 = **82 頁**
- 最後 Ingest：2026-05-20（Notion 學習基地 Module 01~08）
- 最後重構與優化：2026-06-06（依照 CODEX 審查意見全面補齊證據鏈、驗收鏈與失效防線。新增 6 篇工業級技術專頁：標準與規範指引、驗收測試調試實務、FMEA 故障模式分析、TCS水化學與材料相容、TCO成本決策模板、BMS控制邏輯；編寫自動化 fix_encoding_and_consolidate.ps1 統一 UTF-8 編碼並重建 consolidated 檔案；全庫 983 個連結 100% 驗證通過）
