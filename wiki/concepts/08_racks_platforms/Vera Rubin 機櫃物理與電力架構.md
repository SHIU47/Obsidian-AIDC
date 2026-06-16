---
tags: [concept, power, cooling, Rubin, NVL72, rack, busbar, midplane, slide-rail]
sources: ["[[Module 06 - 電力架構與機電整合]]", "[[Module 04 - 液冷系統深度解析]]", "[[Cold Plate]]"]
created: 2026-06-06
updated: 2026-06-06
---

# Vera Rubin 機櫃物理與電力架構

隨著 AI 機房向萬億參數等級的大型語言模型（LLM）與代理型 AI（Agentic AI）演進，NVIDIA 推出了 **Vera Rubin 平台**（預計於 2026 年量產部署）。這款次世代超大規模機架式超級電腦（Rubin NVL72）將機櫃的電力密度與機械物理結構推向了極限，成為 AIDC 設計建造的最前沿指標。

---

## 1. Vera Rubin NVL72 平台核心參數

Vera Rubin 平台是由運算、網路與電力系統在機架層級（Rack-level）進行深度協同設計（Co-design）的結晶：

*   **Vera CPU**：搭載 88 個高頻寬 Olympus 核心，負責系統控制流與資料調度。
*   **Rubin GPU**：採用 3nm 工藝與次世代 **HBM4 高頻寬記憶體**，單晶片解熱需求急劇上升。
*   **NVLink 6**：提供高達 **$3.6 \text{ TB/s}$** 的雙向互連頻寬。
*   **ConnectX-9 SuperNIC**：提供 $1.6 \text{ Tb/s}$ 的超高速網路傳輸能力。
*   **整架規模**：標準 Rubin NVL72 單櫃整合了 **72 顆 Rubin GPU** 與 **36 顆 Vera CPU**（通常配置為 18 個運算雙節點 Tray 與 9 個 NVLink Switch Tray）。

---

## 2. 極限電力與暖通規格

### A. 單機架電耗密度（Power Density）
*   **額定功耗**：標準 Rubin NVL72 單機櫃的額定運行電耗飆升至 **$190 \text{ kW} \sim 230 \text{ kW}$**（相較於 Blackwell NVL72 的 $120 \text{ kW} \sim 130 \text{ kW}$ 上升近一倍）。
*   **前瞻演進**：未來的 Rubin Ultra 平台甚至正往 **$600 \text{ kW/rack}$** 的功耗密度推進。
*   *工程意義*：廠務端的變壓器容量、大容量發電機、不斷電系統（UPS）以及架空母線槽（Busbar）必須依據最大設計電流進行預留。

### B. 45°C 溫水冷卻技術 (Warm Water Cooling)
相較於 Blackwell 時代要求二次側進水溫度 $\le 17^\circ\text{C}$（在台灣等熱帶區全年必須運轉 Chiller），Vera Rubin 平台取得了革命性物理突破：
*   **進水溫度限制**：支援高達 **$45^\circ\text{C}$ (113°F) 的二次側供水溫度**，回水溫度可高達 **$65^\circ\text{C}$**。
*   *能效奇蹟 (Chiller-Free)*：由於進水溫度高達 $45^\circ\text{C}$，與室外夏季濕球溫度的溫差極大。這意味著**全球所有氣候區（包含熱帶新加坡與台灣夏季）均能 100% 關閉 Chiller，僅靠閉式乾冷器（Dry Cooler）的風扇進行顯熱排熱（Free Cooling）**，實現 $WUE = 0$ 且整體 PUE $\le 1.10$ 的極限節能目標。

---

## 3. 機櫃內部核心物理與電力組件

Vera Rubin 機櫃內部空間寸土寸金，傳統的「電纜糾纏」已被高度模組化、集成化的硬體結構徹底取代：

```
       [機櫃正面]                                 [機櫃背面中央]
+-------------------------+                     +-------------------------+
| Compute Tray (運算節點) |                     |  垂直直流銅排           |
|   - Rubin GPU + HBM4    |                     |  (Vertical DC Busbar)   |
|   - Slide Rail 滑軌架裝  | ──────────────────> |  - 48V/50V DC, 1400A+   |
+-------------------------+   後部 Blind-mate   |  - VDC PDB 直流分配板   |
| NVLink Switch Tray      |   Power / Signal    +-------------------------+
|   - Tray Inner Manifold |                     |  無電纜銅纜中板         |
+-------------------------+                     |  (Copper Midplane)      |
| Power Shelf (33kW × 6)  |                     |  - NVLink 6 高速互連    |
+-------------------------+                     +-------------------------+
```

### 1. Slide Rail (重載伸縮滑軌)
*   **挑戰**：單個運算節點 Tray 由於整合了多顆 GPU、散熱冷板與水路管件，重量高達 $60 \sim 80 \text{ kg}$。
*   **規格**：採用專利高強度滾珠伸縮滑軌，具備機櫃雙向防傾倒聯鎖、重載定位鎖，並在滑軌底部設有整合式**防滴水槽（Drip Tray）**，確保插拔維護時微量溢水不會滴落至下方節點。

### 2. Power Shelf (電源機架) 與 PSUs
*   機櫃內部配置 **6 ~ 8 組 33 kW 電源機架**，每組機架內置 6 個 5.5 kW 高能效鈦金級整流模組（PSU）。
*   電源機架直接接入一次側 380V~480V 三相交流電（AC），高效率整流轉換為 **48V/50V 直流電（DC）** 輸出，並支持 N+1 或 N+N 備援。

### 3. VDC PDB (垂直直流電源分配板)
*   垂直安裝於機櫃背部左右兩側的特殊電路板，與 Power Shelf 的 DC 輸出端相連。
*   主要功能是將 48V 直流高電流安全地母線化，並分配至各個 Compute Tray 與 Switch Tray 插槽的供電點。

### 4. DC Busbar (直流匯流排)
*   位於機櫃背部中央的重型銅製垂直導電軌，**額定電流高達 1,400A ~ 2,000A**。
*   伺服器節點向後推入機櫃時，其後部的快接夾片（Clip）會直接咬合在 DC Busbar 上（**無電纜盲插 Blind-mate**），完成 48V 直流取電，**機櫃白區內徹底免除傳統粗重的 AC 配線電纜**。

### 5. Tray Inner Manifold (節點內部分歧管)
*   位於運算節點內部的二次側水冷分支管。冷卻液由機櫃後部的快速接頭（UQD）進入節點後，通過此 Manifold 將水流精確分流至各顆 GPU / CPU 的 **MCCP（微通道冷板）**，回水管再將熱水匯集流出。

### 6. Midplane (無電纜銅纜中板)
*   專為 NVLink 6 設計的**無電纜中板（Cable Cartridge Midplane）**。
*   所有的運算節點與交換器節點推入機櫃時，直接透過後部的 Blind-mate 高速接頭插入此中板。利用中板內部集成的精密高頻銅導線（或光纖）實現 72 顆 GPU 之間無死角的 $3.6 \text{ TB/s}$ 互連，徹底避免了傳統線纜糾纏阻礙排風風道的問題。

### 7. NVLink Switch Tray (液冷網路節點)
*   配備專用液冷板的網路交換節點，內部承載 NVLink Switch 晶片。Rubin 機櫃通常配置 9 個 Switch Trays，與運算節點的銅纜中板對接，構成龐大的物理網絡矩陣。

---

## 4. Cross-References

*   45°C 溫水冷卻技術完整解析（ASHRAE W5、化學/材料/晶片端衝擊）：[[高溫冷卻液與溫水冷卻技術]]
*   末端冷卻板技術：[[Cold Plate]]、[[MCL與MCCP液冷技術]] (MCCP / MCL 詳細剖析)
*   前沿熱敏感控制：[[HBM與晶片級光通訊熱管理]] (HBM4 與矽光子 CPO 溫控約束)
*   配電前端介面：[[PDU與電力引線]] (RPP, Power Whips, Tap-off)
*   電力整合：[[Module 06 - 電力架構與機電整合]]、[[Busbar 匯流排]]
