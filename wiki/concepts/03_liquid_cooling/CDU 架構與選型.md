---
tags: [concept, CDU, liquid-cooling, equipment, procurement, selection]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# CDU 架構與選型

**CDU（Coolant Distribution Unit，冷卻液分配裝置）** 是高功率 AI 資料中心（如 GB200 機架）液冷系統的核心換熱設備。本頁面專注於 CDU 的 **容量選型設計、熱力計算、TBE（技術投標評估）指標與商務採購決策**。

> 💡 關於 CDU 的內部細部水路、二次側變頻控制邏輯、故障切換以及水質電導度控制指標，請參考技術專頁：[[液冷系統 - CDU 架構]]。

---

## 1. CDU 選型容量與流量計算

在 AIDC 設計實務中，CDU 的容量選型必須嚴格匹配 IT 設備（如 GPU/CPU 機架）的最大發熱量。

### A. 核心物理公式
CDU 的熱力計算基於比熱容公式：

$$Q = \dot{m} \times C_p \times \Delta T$$

其中：
*   $Q$ = 散熱功率 / 熱負荷 ($\text{kW}$)
*   $\dot{m}$ = 質量流量 ($\text{kg/s}$)，對水而言流量可近似以體積流量 $\text{L/min}$ 表示：$\dot{m} \approx \frac{\text{Flow Rate (L/min)} \times 1.0}{60}$
*   $C_p$ = 水的比熱容 ($\approx 4.186 \text{ kJ/kg}\cdot\text{K}$)
*   $\Delta T$ = 供回水溫差 ($\text{K}$ 或 $^\circ\text{C}$)

---

### B. 實務設計選型範例（以單架 GB200 NVL72 為例）

*   **已知條件**：
    *   單一機架最大 IT 熱負荷 $Q = 120 \text{ kW}$
    *   二次側（IT 迴路）設計供水溫度 $T_{s2} = 16^\circ\text{C}$，設計回水溫度 $T_{r2} = 26^\circ\text{C}$（設計溫差 $\Delta T_2 = 10^\circ\text{C}$）
    *   冷卻液比熱容 $C_p = 4.186 \text{ kJ/kg}\cdot\text{K}$

*   **計算步驟**：
    1.  **計算二次側所需質量流量 $\dot{m}_2$**：
        $$\dot{m}_2 = \frac{Q}{C_p \times \Delta T_2} = \frac{120}{4.186 \times 10} \approx 2.867 \text{ kg/s}$$
    2.  **換算為二次側體積流量 $V_2$（以純水密度計）**：
        $$V_2 = 2.867 \text{ kg/s} \times 60 \text{ s/min} \approx 172 \text{ L/min}$$
    3.  **考量設計裕度 (Design Margin)**：
        機房設計通常會為 CDU 保留 **1.15 至 1.25 倍** 的安全係數（預留未來 GPU 溢價功耗或換熱效率衰減）：
        $$Q_{\text{design}} = 120 \text{ kW} \times 1.2 = 144 \text{ kW/rack}$$
        $$V_{2\text{, design}} = 172 \text{ L/min} \times 1.2 \approx 206 \text{ L/min/rack}$$

---

### C. 板式熱交換器與對數平均溫差 (LMTD)

CDU 內部板換（PHE）的尺寸選型取決於換熱面積與對數平均溫差。計算公式為：

$$Q = U \times A \times LMTD$$

*   $U$ = 總傳熱係數（316L 不鏽鋼板換一般在 $3,000 \sim 6,000 \text{ W/m}^2\cdot\text{K}$）
*   $A$ = 換熱面積 ($\text{m}^2$)
*   $LMTD$ = 對數平均溫差，公式與計算範例請詳見 [[LMTD 計算]]。
*   **工程選型要點**：LMTD 越小（一次側與二次側溫差越近，如接近溫差 $\Delta T_{\text{approach}} = 2 \sim 3^\circ\text{C}$），所需換熱面積 $A$ 越大，CDU 體積與 CAPEX 越高，但能提升系統整體能效（可拉高一次側供水溫度以實現 Free Cooling）。

---

## 2. CDU 關鍵機電組件選型計算

除了板式熱交換器（PHE）的熱力計算外，CDU 的選型還必須嚴格計算並核對以下四大核心機電組件：

### A. 二次側循環水泵選型（Pump Sizing）

循環水泵是整個二次側液冷水路的動力心臟。選型時必須精確核算「流量」與「揚程（壓力限制）」：

1.  **設計流量 ($\text{Flow Rate}$)**：
    *   由 IT 最大發熱量與供回水溫差決定（如前述計算，GB200 單架約需 $206 \text{ L/min}$）。
2.  **設計揚程 / 總水阻力壓降 ($\text{Total Pump Head, } \Delta P_{\text{total}}$)**：
    *   水泵必須克服二次側「最不利管路迴路」的所有流體阻力。總壓降計算公式：
        $$\Delta P_{\text{total}} = \Delta P_{\text{CDU internal}} + \Delta P_{\text{Manifold}} + \Delta P_{\text{Hoses}} + \Delta P_{\text{QDs}} + \Delta P_{\text{Cold Plate}} + \Delta P_{\text{Control Valves}} + \text{Margin}$$
    *   **典型壓降數值參考（以 $100\% \text{ Flow}$ 計）**：
        *   CDU 內部管路及板換（二次側）：$0.3 \sim 0.5 \text{ bar}$
        *   機櫃分配歧管（Manifold）：$0.15 \sim 0.25 \text{ bar}$
        *   晶片冷板微通道（Cold Plate）：$0.2 \sim 0.4 \text{ bar}$
        *   快速接頭（QDs, 包含機櫃進出與節點插拔，常為 2~3 對）：$0.3 \sim 0.6 \text{ bar}$（QDs 是二次側流阻的大頭！）
        *   **合計二次側總阻力**：通常落在 **$1.8 \sim 2.5 \text{ bar}$** 之間。
    *   **選型建議**：考量管路積垢與局部阻力變形，揚程通常會預留 **$15\% \sim 20\%$ 的安全裕度**。因此 CDU 二次側水泵設計揚程一般選定在 **$2.5 \sim 3.5 \text{ bar}$**（相當於 $25 \sim 35$ 米水柱揚程）。
3.  **水泵類型與控制**：
    *   為了杜絕機械密封磨損導致的漏液風險，AIDC 級 CDU **無條件採用「無軸封屏蔽泵（Canned Motor Pump）」或「磁力驅動泵（Magnetic Drive Pump）」**。
    *   控制方式必須配備變頻器（VFD），以二次側**恆定壓差（DP Control）**為反饋調節泵速。

---

### B. 膨脹罐與穩壓系統選型（Expansion Tank Sizing）

膨脹罐（又稱氣壓罐、穩壓罐）在二次側密閉水路中扮演「緩衝與定壓」的角色：

1.  **膨脹水量計算 ($V_e$)**：
    *   冷卻液會隨著溫度波動（例如開機 $10^\circ\text{C}$ 至滿載回水 $30^\circ\text{C}$ 或故障溫升）而熱脹冷縮。計算公式：
        $$V_e = V_{\text{system}} \times \Delta v$$
        *   $V_{\text{system}}$：整個二次側迴路（包含 CDU 內部、外管、Manifold 及所有冷板）的總充水量。
        *   $\Delta v$：水在溫差範圍內的比容變化率（水在 $10^\circ\text{C} \to 35^\circ\text{C}$ 時體積膨脹約 $0.6\%$）。
2.  **定壓與防氣蝕設計**：
    *   膨脹罐必須維持系統在最低工作溫度下的**最低充氣壓力（通常為 $1.0 \sim 1.5 \text{ bar}$）**。
    *   **核心安全指標（NPSHa）**：此預壓能確保水泵吸入口的「有效汽蝕餘量 (NPSHa)」大於水泵的「必須汽蝕餘量 (NPSHr)」，**徹底防止水泵在高溫下產生汽蝕（Cavitation）**進而損壞葉片。

---

### C. 雙聯精密過濾系統選型（Duplex Filter Sizing）

為了防止微小金屬碎屑、管道焊渣或雜質堵塞 Cold Plate 的微通道，過濾器的選型至關重要：

1.  **精度要求**：
    *   二次側總管過濾精度通常選用 **$50 \mu\text{m}$** 濾網，伺服器進口選用 **$5 \mu\text{m}$**。
2.  **不中斷維護設計（Duplex Configuration）**：
    *   CDU 必須選配**雙聯切換過濾器（Duplex Filter with Changeover Valve）**。
    *   當運轉中的濾芯因堵塞導致前後壓差大於設定值（如 $\Delta P_{\text{filter}} \ge 0.3 \text{ bar}$）時，廠務人員可手動或自動切換至備用濾芯水路，在**不斷機（Online）**的情況下安全更換髒污的過濾袋。

---

### D. 一次側調節閥選型與閥權度（Control Valve & Valve Authority）

一次側冷卻水流經 PHE 的量是由調節閥控制的，其選型決定了 PID 控溫的穩定度：

1.  **閥門流通能力計算 ($K_v$ 或 $C_v$)**：
    *   公式為：
        $$K_v = V \times \sqrt{\frac{S_g}{\Delta P_{\text{valve}}}}$$
        *   $V$ = 一次側最大體積流量 ($\text{m}^3\text{/h}$)
        *   $\Delta P_{\text{valve}}$ = 閥門全開時的設計壓力降 ($\text{bar}$)
2.  **閥權度（Valve Authority, $a$）**：
    *   調節閥全開時的壓降 $\Delta P_{\text{valve}}$ 必須佔整個一次側水路分支總壓降的 **$30\% \sim 50\%$**。
    *   **工程陷阱**：若調節閥選型過大（$K_v$ 過大，即閥權度太低），閥門稍微動一下流量就會產生劇烈變動，導致**二次側供水溫度產生劇烈 PID 震盪**，無法穩定在原廠要求的 $\pm 1^\circ\text{C}$ 精準區間內。

---

## 3. TBE（Technical Bid Evaluation）技術評估評分矩陣

在鴻海或其他 ODM/SI 的專案採購中，針對多家供應商提供的 CDU 進行技術評標時，通常使用以下加權評估矩陣：

| 評估維度 | 權重 | 技術指標與評估要點 |
|:---|:---:|:---|
| **技術成熟度與認證 (TRL)** | 20% | * 是否通過 NVIDIA 原廠的 GB200 生態系認證。<br>* 是否有 Tier-1 資料中心（如 AWS, Microsoft, Meta）的實際大規模部署案例。<br>* 水泵與閥件的 MTBF（平均無故障時間）。 |
| **冷卻效能與節能 (COP)** | 20% | * 板式熱交換器的接近溫差（Approach Temperature $\le 3^\circ\text{C}$）。<br>* 變頻泵在部分負載（Part-load）下的能耗曲線。<br>* 內部流阻（Pressure Drop），低流阻可降低水泵功耗。 |
| **可靠度與備援設計** | 15% | * 水泵 N+1 備援（如雙泵配置，各承載 100% 流量）。<br>* 雙電源輸入（ATS 雙路切換）。<br>* 控制系統（PLC）是否具備雙冗餘。 |
| **維護易用性與 MTTR** | 15% | * 水泵、過濾器、控制卡是否支援 **前維護**（不需移機即可正面抽換）。<br>* 平均修復時間 (MTTR < 30 分鐘)。<br>* 本地零件庫存與 24/7 原廠工程師響應時效。 |
| **交期 (Lead Time)** | **15%** | * **鴻海/AIDC 機房建置的核心命脈**。<br>* 生產交期是否能控制在 12~16 週內。<br>* 是否具備全球多產地製造能力以分散地緣政治風險。 |
| **CAPEX 成本** | 10% | * 單台設備採購單價。<br>* 耗損性配件（過濾芯、去離子罐）的後續營運成本。 |
| **可擴展性與模組化** | 5% | * 機架式 CDU 能否在不改動管路下，透過模組化升級容量。<br>* 軟體對 BMS/DCIM 的通訊協議兼容性（Modbus TCP, BACnet）。 |

---

## 3. 代表廠商生態系統比較

目前 AIDC 液冷市場上，CDU 的供應主要集中於幾家國際機電巨頭與液冷先驅：

```mermaid
radarchart
    title CDU 供應商能力綜合評估 (示意)
    labels: 技術成熟度, 產能交期, 本地售後服務, 電能整合度, 客製化彈性
    "Vertiv": [9.5, 8.5, 9.5, 9.5, 7.5]
    "CoolIT": [9.0, 7.5, 7.5, 5.0, 9.0]
```

### 1. [[Vertiv]] (維諦)
*   **代表產品**：Liebert XDU 系列（XDU450, XDU1350, 以及最新 600 kW+ 機架式/列間式）。
*   **優勢**：資料中心基礎設施龍頭，產品線橫跨電力、空冷、液冷與 DCIM。售後服務網點最密，交期與財務穩定度高。
*   **定位**：超大型 AIDC 專案的首選，偏向標準化、高可靠度的整套解決方案。

### 2. [[CoolIT]] (酷力)
*   **代表產品**：CHx 系列（如 CHx200, CHx750 列間式 CDU）。
*   **優勢**：液冷技術專門先驅，Cold Plate 與 CDU 技術底蘊極深。與 NVIDIA 合作緊密，具備極強的機櫃級客製化設計能力。
*   **定位**：高密度 HPC 及追求極限換熱效能專案的首選。

### 3. **Schneider Electric** (施耐德)
*   **優勢**：電能整合度地表最強，結合 APC 品牌在中大型機房配電與機櫃佈線上有壓倒性優勢，CDU 產品正與其 EcoStruxure 軟體架構深度整合。
*   **定位**：機電一體化需求極高、注重集中控制與配電安全的專案。

### 4. **Motivair** 與 **nVent**
*   **優勢**：專門提供高規格客製化工業級熱管理設備，在極端高壓、超高流量的氣候適應性系統中有獨特技術。

---

## 4. 廠商選型三大黃金原則

1.  **「不被單一廠商綁死 (No Vendor Lock-in)」**：
    *   在專案的 RFQ（報價需求書）中，必須至少指定兩家合格供應商（如 Vertiv + CoolIT 雙軌並行），以維持議價權與交期備案。
2.  **「交期凌駕微幅能效差異」**：
    *   若 A 廠 COP 略高 2%，但交期需 9 個月；B 廠交期僅 4 個月。在 AIDC 搶食算力紅利的商業邏輯下，**無條件選擇交期快的廠商**。
3.  **「認證先於價格」**：
    *   未通過 NVIDIA GB200 生態系相容性測試的廠商，縱使 CAPEX 便宜 30%，技術評標 TBE 階段亦應直接予以扣分或否決，防止高價 GPU 損毀責任釐清不清。

---

## 5. Cross-References

*   技術細節與水質：[[液冷系統 - CDU 架構]]
*   換熱面積計算：[[LMTD 計算]]
*   末端吸熱元件：[[Cold Plate]]、[[儲冷罐]]
*   上游冷源：[[Chiller Plant]]
*   實體廠商與選型：[[設備與廠商選型對照矩陣]]、[[Vertiv]]、[[CoolIT]]
*   廠商評估模組：[[Module 08 - 廠商生態系統]]
