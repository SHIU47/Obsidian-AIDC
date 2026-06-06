---
tags: [entity, vendor, CoolIT, liquid-cooling, DLC, Cold-Plate, CDU]
sources: ["[[AIDC HVAC 學習基地 - Notion]]", "[[Module 08 - 廠商生態系統]]"]
created: 2026-05-20
updated: 2026-05-20
---

# 廠商剖析：CoolIT Systems (酷力)

**CoolIT Systems（酷力系統）** 總部位於加拿大亞伯達省卡加利，是資料中心 **直接液冷 (Direct Liquid Cooling, DLC)** 技術的先驅與純液冷技術專門廠商（Pure-play Specialist）。與橫跨多領域的機電巨頭 Vertiv 不同，CoolIT 專精於高性能運算（HPC）與 AI 資料中心的液冷末端冷卻，以高超的冷板微通道設計與客製化機櫃管路整合聞名全球。

---

## 1. AIDC 核心產品線與佈局

CoolIT 的產品線 100% 圍繞液冷二次側（IT Loop）展開，提供高度客製化的「晶片到 CDU」完整方案：

### A. 客製化冷板 (Patented Cold Plates)
*   **Split-Flow 微流道專利技術**：CoolIT 擁有獨步業界的銅製冷板設計，其內部微流道（Micro-channels）斷面極小，能以最低的流量阻力達到最高的表面對流換熱係數。
*   **晶片廠緊密認證**：為 NVIDIA（H100/H200/GB200）、AMD（MI300X 系列）及 Intel（Gaudi 系列）客製化研發專用冷板，精準覆蓋高溫 GPU Die、HBM 記憶體與周邊 VRM 供電模組。

### B. 液冷分配裝置 (CDU)
*   **CHx 系列 (Liquid-to-Liquid CDU)**：
    *   **CHx200**：列/櫃裝式輕量化 CDU（排熱容量達 200 kW），適合個別高密度機架快速導入。
    *   **CHx750**：列間（Row-based）高容量 CDU（排熱能力 750 kW），足夠支撐 4~6 架 GB200 機架。
    *   **CHx1000+**：超大型集中式液/液交換單元，提供大流量、低溫差換熱。
    *   **特點**：體積相較於 Vertiv 更加緊湊，PLC 控制軟體針對二次側水流動態調控演算法優化極佳。

### C. 智能分歧管與快接配件 (Manifolds & Quick Connects)
*   提供專為伺服器機架背部設計的 **不鏽鋼分歧管（Smart Manifolds）**，整合流量計、壓力感測器，並大量搭配乾式無滴漏 [[快速接頭]]，確保 Hot Swap 熱插拔過程滴水不漏。

---

## 2. 技術優勢 (Strengths)

1.  **液冷領域的極限專業底蘊 (Thermodynamic Expertise)**
    *   在 DLC 領域累積超過 20 年的研發經驗，擁有數百項關於冷板水流路、防滲漏結構與防腐蝕電化學塗層的專利。其熱阻抗控制能力極強，能以最接近的 approach 溫差導出 GPU 熱量。
2.  **極強的客製化彈性與響應速度 (Customization & Agility)**
    *   作為專業廠，CoolIT 能迅速配合 ODM 廠（如鴻海 Foxconn、廣達 Quanta）的伺服器板卡佈局變更（例如調整電容位置、冷板厚度等），在數週內完成 Cold Plate 改版設計與打樣，相較於流程官僚的國際大機電廠具備極大的研發敏捷度。
3.  **生態系緊密合作 (Ecosystem Co-development)**
    *   與 NVIDIA 原廠及台灣 ODM 鏈的系統整合工程師有著長期的共同研發（Co-development）關係，這使其產品在物理結構與安裝介面上，與最新一代 GPU 機櫃有著極佳的貼合度。

---

## 3. 面臨挑戰與劣勢 (Weaknesses)

1.  **缺乏廣泛的基礎設施產品線 (Limited Scope)**
    *   CoolIT 是單純的「液冷技術廠」。它**不提供電力設備（如 UPS、變壓器）或大規模的一次側冷源（如大型 Chiller、冷卻水塔）**。
    *   在專案採購中，若業主（Hyperscaler）希望「電力+冷卻」整包採購（Turnkey Solution），CoolIT 必須與其他電力廠（如 Eaton、ABB）聯合投標，整合度不如 Vertiv 一體化方案。
2.  **售後服務規模限制 (Service Scaling)**
    *   雖然在全球主要地區有售後點，但直屬維護團隊的規模遠不如 Vertiv。CoolIT 在大型專案中，主要依賴與 ODM（如鴻海）或大型 SI（系統整合商）簽署技術協議，將第一線現場維修授權給合作夥伴，原廠僅提供二線支援。

---

## 4. 鴻海 AIDC 的戰略合作定位

在鴻海（Foxconn）的 AI 伺服器製造與機房建置中，CoolIT 具備雙重戰略地位：

1.  **「系統研發的協作大腦」**：
    *   鴻海製造的 GB200 機櫃與高密度伺服器，在初期冷板迴路（Cold Plate Loop）設計與 Manifold 配管評估時，CoolIT 是最核心的協同設計廠商。
2.  **「CDU 採購的二合一安全網」**：
    *   為了打破 Vertiv 在大容量 CDU 上的壟斷並分散其交期瓶頸，鴻海在技術評估（TBE）中將 CoolIT 的 CHx 系列列為一等主力備選，藉此促進市場競爭，優化採購成本與產能分配。

---

## 5. Cross-References

*   技術實體與選型：[[設備與廠商選型對照矩陣]]、[[CDU 架構與選型]]、[[液冷系統 - CDU 架構]]、[[Cold Plate]]、[[快速接頭]]
*   競爭廠商：[[Vertiv]]
*   生態系統分層：[[Module 08 - 廠商生態系統]]
