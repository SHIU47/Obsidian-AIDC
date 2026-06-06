---
tags: [entity, vendor, Asetek, liquid-cooling, cold-plate, CDU, server-cooling, HPC]
sources: ["[[AIDC HVAC 學習基地 - Notion]]", "[[Module 08 - 廠商生態系統]]"]
created: 2026-05-20
updated: 2026-05-20
---

# 廠商剖析：Asetek (丹麥阿斯泰克)

**Asetek（丹麥阿斯泰克公司）** 總部位於丹麥奧爾堡，是全球液冷技術（Liquid Cooling）的最早開拓者與領導者之一。Asetek 最早以個人電腦（PC）超頻一體式水冷（AIO）聞名全球，隨後將其深厚的液冷微流道與微型水泵技術，成功導入高性能計算（HPC）與資料中心白區 **直接液冷 (Direct Liquid Cooling, DLC)** 領域。與橫跨多領域的巨頭不同，Asetek 是專門深耕「晶片到機櫃」熱管理的純液冷核心組件供應商。

---

## 1. AIDC 核心產品線與佈局

Asetek 在資料中心二次側（IT Loop）提供高度緊湊的專利冷板與機櫃級散熱迴路：

### A. 專利一體泵冷板 (Pump-on-Cold Plate / Direct-to-Chip)
*   **技術核心**：Asetek 最具代表性的專利技術。將**微型變頻水泵直接集成在 GPU/CPU 冷板上方**。
*   **物理優勢**：
    *   **消除系統局部水阻**：傳統液冷靠 CDU 集中水泵遠距離推動液體，若管路複雜易有死角。Asetek「冷板帶泵」能在發熱源最前端直接提供推力，大幅降低對一次側/二次側外部水泵的揚程壓力要求。
    *   **點對點精準控流**：可依據每顆 GPU 的即時溫度動態控制自帶微型泵的轉速，避免整體管路多餘的旁通能耗。

### B. 機櫃裝式與排級 CDU (In-Rack & In-Row CDU)
*   提供高緊湊、熱插拔設計的機櫃內置式 CDU，能配合高密度刀鋒伺服器或 GPU 機架（如 50~100 kW）進行局部的快速液冷導入。

### C. 工廠預裝液冷迴路 (Factory-sealed Liquid Cooling Loops)
*   與全球一線伺服器 OEM 大廠（如 Dell, Lenovo, HP, 華碩）合作，在伺服器出廠前即完成冷板、快接與管路的完全氣密裝配，降低現場漏液風險。

---

## 2. Technical Strengths (技術優勢)

1.  **獨步業界的「冷板集成微泵」技術 (Micro-pump Patent)**
    *   在二次側液冷水路設計中，Asetek 擁有大量關於微型馬達軸承、防氣蝕與冷板一體化流道的核心專利。其系統在部分負載下的主動流量調節能力極佳，換熱效率極高。
2.  **極強的一線伺服器 OEM 合作底蘊 (Tier-1 OEM Partnerships)**
    *   Asetek 是 Dell PowerEdge 伺服器與 Lenovo ThinkSystem 專用液冷方案的主要代工商。這使其產品在實體安裝界面、EMI 電磁防護與防結露邏輯上，與大廠伺服器有著完美的底層相容性。
3.  **無滴漏快接與管路氣密安全性**
    *   其在 PC 消费級與 HPC 工業級市場累積了數百萬套液冷系統的出貨經驗，其防腐蝕電化學塗層與管路接頭的抗壓壽命極高。

---

## 3. 面臨挑戰與劣勢 (Weaknesses)

1.  **基礎設施與大冷源整合能力薄弱 (Infrastructure Limits)**
    *   與 CoolIT 類似，Asetek 僅專注於二次側「晶片到機櫃」水路。它**不具備大規模一次側冷源（如 Chiller、冷卻塔）或關鍵電力（UPS）**產品。在需要整包交付的大型綠地專案（Greenfield Project）中，必須與大機電商聯合投標。
2.  **專利訴訟官司導致的商業壁壘**
    *   Asetek 歷史上在「一體泵冷板」領域有著極其嚴格的專利排他權，並頻繁與競爭對手（如 Cooler Master、Apaltek）進行法律訴訟，這使得部分 ODM 廠在協同研發時，會因專利侵權風險評估而採取較為謹慎的合作態度。

---

## 4. 鴻海 AIDC 的戰略定位與採購考量

在鴻海（Foxconn）的 AI 伺服器製造與 AIDC 液冷發包策略中，Asetek 的定位為 **「二次側 DLC 關鍵技術盟友與 Dual-Source 安全網」**：

*   **伺服器 OEM 液冷出貨的重要供應商**：
    *   當鴻海以 ODM 身份承接 Dell 或 Lenovo 的高密度 AI 伺服器代工訂單時，若客戶指名採用 Asetek 的預裝液冷迴路，鴻海生產線具備完整的安裝與檢測工藝（He Leak Test，氦氣檢漏技術），能與 Asetek 進行無縫生產對接。
*   **制衡 CoolIT 的重要籌碼**：
    *   在 TBE（技術評估）中，為了防範單一廠商（如 CoolIT）產能吃緊或交期延誤，鴻海在二次側晶片冷板、分歧管採購上，將 Asetek 列為一等主力備選。這套 **「CoolIT + Asetek 雙軌備選」** 策略，能極大化優化採購成本，並防範全球供應鏈的交期風險。
*   **自研技術的專利防禦參考**：
    *   鴻海自研冷板與快接組件在進行專利寫作與物理結構避規設計（Avoidance Design）時，Asetek 的 Pump-on-Cold Plate 專利佈局是鴻海智財（IP）團隊最重要的分析與防禦基準。

---

## 5. Cross-References

*   技術實體：[[Cold Plate]]、[[液冷系統 - CDU 架構]]、[[快速接頭]]
*   競爭對手：[[CoolIT]] (頭號 DLC 技術對手)、[[Foxconn]] (自研冷板/CDU)
*   比較專區：[[微通道冷板 vs 鰭片式冷板]]、[[單相 vs 雙相浸沒式液冷]]
*   生態系統分層：[[設備與廠商選型對照矩陣]]、[[Module 08 - 廠商生態系統]]
