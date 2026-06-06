---
tags: [entity, vendor, Vertiv, liquid-cooling, air-cooling, CDU, UPS]
sources: ["[[AIDC HVAC 學習基地 - Notion]]", "[[Module 08 - 廠商生態系統]]"]
created: 2026-05-20
updated: 2026-05-20
---

# 廠商剖析：Vertiv (維諦)

**Vertiv（維諦技術，前身為 Emerson Network Power 艾默生網路能源）** 總部位於美國俄亥俄州哥倫布市，是全球資料中心機電關鍵基礎設施（關鍵電力、精密冷卻、基礎設施管理與軟體）的絕對龍頭與主導廠商。在 AIDC 與高密度 AI 運算革命中，Vertiv 憑藉其端到端的基礎設施整合實力，成為最核心的系統供應商。

---

## 1. AIDC 核心產品線與佈局

Vertiv 提供橫跨空冷、液冷、電力與 DCIM 管理的全套解決方案：

### A. 液冷解決方案 (CDU & DLC)
*   **Liebert XDU 系列**：
    *   **定位**：專為高密度伺服器設計的冷卻液分配裝置。
    *   **主力型號**：
        *   **XDU 450**（排熱容量達 450 kW，適合列間 Row-based 部署）。
        *   **XDU 1350**（大容量集中式 CDU，排熱量達 1350 kW，適合白區側邊或集中式機房部署）。
        *   **機架式 CDU (Rack-mount CDU)**：針對單架 100~120 kW（如 GB200 NVL72）研發的嵌入式機架冷卻單元。
    *   **特點**：極致的溫度控制與壓差變頻調節能力，內建全冗餘 N+1 變頻水泵及雙電源切換（ATS）。
*   **Liebert XDM 列間冷水機組**：專為 DLC 設計的一/二次側分開換熱單元。

### B. 精密空冷解決方案 (CRAH & In-Row)
*   **Liebert DSE 系列**：配備智能無水冷卻技術及泵送氟冷媒自然冷卻（Econophase）的精密直膨式空調，在缺水地區及中型 AI DC 中市占極高。
*   **Liebert PCW 系列**：高能效冷凍水型 CRAH，單機冷卻容量達 100~400 kW，是超大型 AIDC 配合 Chiller Plant 的主力送風設備。

### C. 電力系統與 UPS
*   **Liebert EXL S1 / APM 系列**：大容量模組化三相 UPS，採用線上雙變換技術（Online Double Conversion），為 GPU 白區提供純淨不斷電電力。

---

## 2. 技術優勢 (Strengths)

1.  **端到端系統整合力 (End-to-End Synergy)**
    *   Vertiv 能同時提供資料中心的三大核心骨幹：**電力（UPS、匯流排）+ 冷卻（CDU、CRAH、冷卻塔）+ 管理（Trellis DCIM 監控）**。這種一體化整合能力，使機房在進行動態能效調節（如聯動 Chiller 與 CDU 的壓差控制）時，具備極佳的兼容性，減少系統衝突。
2.  **極高的技術成熟度與認證 (TRL & Eco-Certification)**
    *   Vertiv 是 **NVIDIA 官方生態系的重要合作夥伴**。其 CDU 與相關冷卻迴路均通過 GB200 原廠最嚴格的物理相容性、水阻特性與長期運作壓力測試，在 TBE（技術評估）中通常能取得滿分。
3.  **地表最密集的全球售後服務網 (Global Footprint)**
    *   擁有全球化的工程師團隊與備品庫房，能承諾 2~4 小時內到場搶修。對於重視 MTTR（平均維修時間）的 Hyperscaler（亞馬遜、微軟、Google）及 ODM 大廠而言，這是無可替代的商業優勢。

---

## 3. 面臨挑戰與劣勢 (Weaknesses)

1.  **高昂的 CAPEX 成本 (Premium Pricing)**
    *   相較於其他競爭對手，Vertiv 設備的採購單價最高，對於預算敏感型專案或高度追求 CAPEX 最佳化的二線資料中心而言，價格門檻較高。
2.  **交期瓶頸 (Supply Chain & Lead Time Bottlenecks)**
    *   由於全球 AI 資料中心建設呈爆發式增長，Vertiv 的訂單極度飽滿。
    *   在供應鏈吃緊時，**CDU 的交期常被拉長至 30 週（約 7.5 個月）以上**。對於講求「天下武功，唯快不破」、需在 3~6 個月內為客戶搶蓋 AIDC 的鴻海而言，這是極大的進度風險。

---

## 4. 鴻海 AIDC 的戰略合作與因應對策

在鴻海（Foxconn）的 HVAC 採購策略中，對 Vertiv 的定位為：

*   **「首選主力，但絕不唯一」**：
    *   在新一代 AIDC 機房的設計規劃（Step 1~3）中，優先採用 Vertiv 的參數（如 XDU 的壓差阻力、流量要求）作為基準進行系統建模（CFD 模擬）。
    *   **備案與議價機制**：為防範其交期風險並維持採購議價權，鴻海在液冷 CDU 上積極導入 [[CoolIT]] 作為雙軌（Dual-source）備選方案，並積極扶植集團內部的自研液冷能力（Foxconn 自研 Cold Plate 與快接組件）。

---

## 5. Cross-References

*   技術實體與選型：[[設備與廠商選型對照矩陣]]、[[CDU 架構與選型]]、[[液冷系統 - CDU 架構]]、[[CRAH]]
*   對手廠商：[[CoolIT]]
*   生態系統分層：[[Module 08 - 廠商生態系統]]
