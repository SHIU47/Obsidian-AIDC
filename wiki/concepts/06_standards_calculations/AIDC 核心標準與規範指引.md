---
tags: [concept, AIDC, standards, compliance, ASHRAE, NFPA, IEEE, OCP, Uptime]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-06-06
updated: 2026-06-06
---

# AIDC 核心標準與規範指引

在 AIDC（人工智慧資料中心）的設計、發包、驗收與運維實務中，國際標準與規範是建立「工程證據鏈」的最核心依據。任何系統設計與廠務規範如果缺少這些標準的背書，便無法通過 Tier 認證或業主審標。

本指引彙整了 AIDC 暖通、液冷、消防、電力與架構中，最權威且必須引用的一手國際官方標準規範。

---

## 1. 暖通與冷卻標準

### ASHRAE TC 9.9 (Thermal Guidelines for Data Processing Environments)
*   **權威地位**：全球資料中心進氣端溫濕度控制的唯一聖經。
*   **關鍵內容**：
    *   **Class A1 ~ A4 溫濕度範圍定義**：明確規範伺服器進氣端溫度（推薦 $18^\circ\text{C} \sim 27^\circ\text{C}$，容許 $15^\circ\text{C} \sim 32^\circ\text{C}$ / $35^\circ\text{C}$ / $40^\circ\text{C}$ / $45^\circ\text{C}$）。
    *   **液冷標準變更（Liquid Cooling Classes W1 ~ W5 / W+）**：
        *   **W1/W2/W3**：要求進水溫度較低，需冰機輔助。
        *   **W4/W5**：進水溫度分別為 $40^\circ\text{C}$ 與 $45^\circ\text{C}$。這是實現 **100% Chiller-Free (免冰機自然冷卻)** 的底層標準依據。例如 Vera Rubin 平台採用 $45^\circ\text{C}$ 回水即是符合 **W5** 標準。
*   **相關頁面**：[[ASHRAE TC 9.9 Data Center 溫濕度標準]]、[[GB200 NVL72 冷卻需求]]、[[Vera Rubin 機櫃物理與電力架構]]

### ASHRAE Guideline 12-2020 (Managing the Risk of Legionellosis Associated with Building Water Systems)
*   **權威地位**：控制冷卻水塔與蒸發散熱系統中**退伍軍人菌（Legionella）**滋生風險的核心指南。
*   **關鍵內容**：
    *   規範了冷卻水塔的水質採樣頻率（至少每季一次）、化學殺菌劑投藥程序（維持游離氯 $0.5 \sim 1.0 \text{ ppm}$），以及水霧擴散物理阻隔器的設計規格。
*   **相關頁面**：[[冷卻水塔]]、[[開式冷卻塔 vs 閉式冷卻塔]]

---

## 2. 消防與結構安全標準

### NFPA 75 (Standard for the Fire Protection of Information Technology Equipment)
*   **權威地位**：資訊科技設備防火保護的最高標準。
*   **關鍵內容**：
    *   **氣體消防聯鎖**：規範了高靈敏度早期煙霧偵測系統（VESDA）與氣體滅火（FM-200 / Novec 1230）的氣密與噴放延遲邏輯。
    *   **液冷安全聯鎖（ESD）**：要求液冷漏液偵測系統必須與 UPS 電力及消防系統進行邏輯聯鎖，在發生嚴重漏水或火警時在 2 秒內關閉閥門，切斷伺服器電力，避免電弧擴大。
*   **相關頁面**：[[消防系統]]、[[漏液偵測系統]]

### NFPA 76 (Standard for the Fire Protection of Telecommunications Facilities)
*   **權威地位**：電信與高速網絡交換中心機房的防火保護專項標準。
*   **關鍵內容**：
    *   針對高速 NVLink Switch 網路白區與光通訊機房，要求採取非導電性防火氣體（潔淨氣體）防護，且氣體鋼瓶儲存區需與發熱區進行防火牆物理隔離。
*   **相關頁面**：[[HBM與晶片級光通訊熱管理]]

### NFPA 2001 (Standard on Clean Agent Fire Extinguishing Systems)
*   **權威地位**：潔淨氣體滅火系統設計的標準依據。
*   **關鍵內容**：
    *   規範了氣體最低設計濃度（Novec 1230 一般為 4.5%~5.3%），放熱性測試，以及為期至少 10 分鐘的氣體保持時間（Hold Time）要求。
*   **相關頁面**：[[消防系統]]

### IEC 61508 (Functional Safety of Electrical/Electronic/Programmable Electronic Safety-related Systems)
*   **權威地位**：功能安全國際標準，常用於評估 DCIM 與 BMS 的安全完整性等級（SIL1 ~ SIL4）。
*   **關鍵內容**：
    *   要求 CDU 漏液截止閥、發電機 STS 切換等關鍵邏輯必須通過 SIL2 以上認證，計算其隨機硬體失效機率（PFD）。
*   **相關頁面**：[[液冷系統 - CDU 架構]]、[[AIDC 微電網架構]]

---

## 3. 電力與諧波標準

### IEEE 519-2014 (Recommended Practice and Requirements for Harmonic Control in Electric Power Systems)
*   **權威地位**：電力系統諧波控制的唯一公認標準。
*   **關鍵內容**：
    *   AIDC 白區充滿大量伺服器開關電源（SMPS），是非線性負載的主要來源。
    *   標準規定：**公共連接點（PCC）處的電壓總諧波畸變率（THD-V）必須 $\le 5\%$**，電流總諧波畸變率（THD-I）根據系統短路比限制在 $5\% \sim 20\%$ 內，否則需強制安裝主動式電力濾波器（APF）。
*   **相關頁面**：[[電力品質與諧波]]、[[UPS]]

### IEC 60364 (Low-voltage electrical installations)
*   **權威地位**：低壓電氣設備安裝國際標準。
*   **關鍵內容**：
    *   規定了 AIDC 的接地形式：TN-S 系統（PE線與N線嚴格分離）與 IT 浮地系統（適用於 800VDC 配電）的安全與監測防護。
*   **相關頁面**：[[電化學腐蝕與接地]]、[[800VDC 直流配電]]

---

## 4. 液冷快接與系統開源標準

### OCP ACS (Open Compute Project - Advanced Cooling Solutions)
*   **權威地位**：全球開放運算專案下，針對高密度直接液冷（DLC）的硬體規範。
*   **關鍵內容**：
    *   **OCP UQD (Universal Quick Disconnect) 規範**：
        *   定義了快速接頭的平面無滴漏結構（Flat-face）、最小壓力降（Flow vs. Pressure Drop 曲線）、以及在 $1.5\text{ bar}$ 帶壓插拔下的耐用次數（至少 100 次插拔無漏液）。
        *   規定了盲插對準的徑向浮動公差範圍。
*   **相關頁面**：[[快速接頭]]、[[GB300與Blackwell Ultra機櫃架構]]

---

## 5. 可靠度分級標準

### Uptime Institute Tier Standard
*   **權威地位**：資料中心設計、建造與運維可靠性的分級認證。
*   **關鍵內容**：
    *   **Tier I (基本型) $\rightarrow$ Tier IV (容錯型)**。
    *   核心邏輯區分：
        *   **Tier III 可同時維護性 (Concurrently Maintainable)**：任何單一配電盤、UPS、CDU、Chiller 在不停機的情況下均可抽離維護（要求路徑備援如 N+1）。
        *   **Tier IV 容錯性 (Fault Tolerant)**：發生單點故障時，系統能自動隔離故障並自主運行，不影響 IT 端（要求完全獨立的雙路 2N 或 2(N+1) 實體隔離）。
*   **相關頁面**：[[Tier 分級深度解析]]、[[N+1 vs 2N vs N+2 備援架構]]

---

## 官方文檔參考連結列表

1.  **ASHRAE TC 9.9 Publications**: [https://www.ashrae.org/technical-resources/bookstore/ashrae-datacenter-design-books-and-publications](https://www.ashrae.org/technical-resources/bookstore/ashrae-datacenter-design-books-and-publications)
2.  **NFPA Codes (75, 76, 2001)**: [https://www.nfpa.org/Codes-and-Standards](https://www.nfpa.org/Codes-and-Standards)
3.  **IEEE 519 Standard**: [https://ieeexplore.ieee.org/document/6826478](https://ieeexplore.ieee.org/document/6826478)
4.  **Open Compute Project ACS specifications**: [https://www.opencompute.org/projects/advanced-cooling-solutions](https://www.opencompute.org/projects/advanced-cooling-solutions)
5.  **Uptime Institute Tier Standards**: [https://uptimeinstitute.com/tiers](https://uptimeinstitute.com/tiers)
