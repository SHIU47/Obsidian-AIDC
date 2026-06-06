---
tags: [concept, AIDC, GPU, silicon-cooling, Blackwell, Rubin, packaging]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-06-06
updated: 2026-06-06
---

# NVIDIA GPU 晶片演進與散熱限值

在 AIDC（人工智慧資料中心）的散熱工程中，設計冷板或選型 CDU 時，必須深入了解最核心的發熱源 —— NVIDIA GPU 晶片。從 Hopper 世代到 Blackwell，再到次世代的 Rubin，晶片的發熱物理特性與極限工作溫度經歷了巨大的演進。

---

## 1. NVIDIA 歷代 GPU 晶片散熱參數對比

| 晶片世代 | 晶片型號 | 典型 TDP | 記憶體配置 | 晶片最高容許溫度 ($T_j$) | 封裝工藝 | 核心散熱難點 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hopper** | H100 SXM | 700 W | 80GB HBM3 | $\le 85^\circ\text{C}$ | CoWoS-S | 傳統單晶片發熱，局部微通道空冷可勉強支持。 |
| | H200 SXM | 700 W | 141GB HBM3e | $\le 85^\circ\text{C}$ | CoWoS-S | 記憶體升級，對溫度控制要求更高以防止刷新率衰減。 |
| **Blackwell** | B100 / B200 | 700W / 1000W-1200W | 192GB HBM3e | $\le 80^\circ\text{C}$ | CoWoS-L | 雙運算晶粒（Compute Die）一體化封裝，必須採用高效率液冷。 |
| | B300 (Blackwell Ultra) | 1200W+ | 288GB HBM3e (12/16-hi) | $\le 80^\circ\text{C}$ | CoWoS-L | 3D 堆疊 HBM3e 達 16 層，熱阻極高。 |
| **Rubin** | Vera Rubin (V100) | 1500W+ | HBM4 (3D TSV) | $\le 80^\circ\text{C}$ (DRAM $\le 85^\circ\text{C}$) | CoWoS-R | 3nm 製程，HBM4 介面改為矽穿孔直連運算晶粒，熱限制極端敏感。 |

> ⚠️ **重要：** 隨著晶片製程進步與電晶體密度增加，晶片最高容許節點溫度（Junction Temperature, $T_j$）不升反降。Blackwell 與 Rubin 要求水冷系統將 $T_j$ 控制在 **$\le 80^\circ\text{C}$**，以避免高溫引發的晶片內部漏電流（Leakage Current）飆升與算力熱節流。

---

## 2. 熱通量密度（Heat Flux Density）與局部熱點（Hotspot）

在散熱工程中，單純關注 TDP（瓦數）會產生盲點。真正的挑戰是**熱通量密度**（單位面積的散熱率，$\text{W/cm}^2$）：

$$\text{Heat Flux} = \frac{\text{TDP}}{\text{Die Area}}$$

*   **熱通量極限**：B200 的 Compute Die（運算晶粒）實際面積僅約 $4 \text{ cm}^2$，但卻要承載高達 $800\text{ W}$ 的發熱量，其發熱區域（Hotspot）的熱通量密度高達 **$100 \sim 150 \text{ W/cm}^2$**。
*   **散熱對策**：
    1.  傳統冷板流道已無法滿足此熱通量，必須採用 [[MCL與MCCP液冷技術]]（流道寬度僅 $80 \sim 100 \mu\text{m}$ 的微通道冷板）直接對準 Compute Die 的發熱投影區域。
    2.  需使用超高導熱率的 [[TIM 導熱介面材料]]（如銦箔，等效導熱率 $> 80 \text{ W/m·K}$），以儘可能降低介面熱阻。

---

## 3. 扣合壓迫力（Mounting Pressure）與板彎翹曲（Warpage）的工程天平

為了將晶片產生的熱量傳導至 [[Cold Plate]]，冷板扣具必須對晶片表面施加精確的壓迫力。這是一個極為精密的力學平衡：

```
   [ 壓緊力過小 ] <================== 理想區間 ==================> [ 壓緊力過大 ]
(TIM 導熱介面層過厚)           ( 50 ~ 80 psi 壓迫力 )            ( HBM/晶粒碎裂 )
( 局部接觸熱阻大 -> 燒毀 )                                      ( PCB 翹曲、TSV/微凸塊斷裂 )
```

*   **理想壓迫力**：工程實務上，冷板與 GPU 晶片的接觸面壓力需控制在 **$50 \sim 80 \text{ psi}$**（約 $345 \sim 550 \text{ kPa}$）。這需要使用精密彈簧螺絲扣具（Spring-loaded Buckle）以特定的扭力階梯式鎖緊。
*   **壓緊力過小的後果**：[[TIM 導熱介面材料]]（特別是相變材料或金屬銦箔）無法被均勻擠壓，導致接觸面存在微小氣隙，局部熱阻暴增，引發 GPU 熱節流。
*   **壓緊力過大的後果（機械失效）**：
    *   **晶圓碎裂（Die Cracking）**：HBM4 或 CoWoS 封裝內部的晶圓非常脆弱，過大的局部壓力會直接導致晶粒角部碎裂。
    *   **PCB 翹曲（PCB Warpage）**：在高溫環境下（運作時 80°C），基板若承受過大下壓力，會發生板彎。這會拉扯 CoWoS 封裝內部的 Microbumps（微凸塊）與矽穿孔（TSV），引發疲勞斷裂導致晶片報廢。

---

## 4. CTE（熱膨脹係數）錯位剪應力

在 AI 訓練的高拉載與輕載切換過程中，晶片會經歷劇烈的**熱循環（Thermal Cycling）**。各層材料的熱膨脹係數（CTE）差異，會產生極大的破壞性**剪應力**：

| 材料層 | 主要材質 | CTE (熱膨脹係數) | 熱循環下的物理反應 |
| :--- | :--- | :--- | :--- |
| **矽晶粒 / 中介層** | 單晶矽 (Silicon) | **$2.6 \text{ ppm/}^\circ\text{C}$** | 膨脹極慢。 |
| **封裝基板** | 有機樹脂 (FR4 / ABF) | **$15 \text{ ppm/}^\circ\text{C}$** | 膨脹較快。 |
| **液冷冷板** | 紫銅 (Copper) | **$17 \text{ ppm/}^\circ\text{C}$** | 膨脹最快。 |

*   **失效機制**：當 GPU 從待機的 35°C 瞬間上升到滿載的 80°C 時，紫銅冷板與矽晶片的相對位移會對中間的 [[TIM 導熱介面材料]] 與 CoWoS 焊點施加剪切力。
*   **防護對策**：
    1.  設計冷板扣具時，必須預留微小的水平滑動間隙（Thermal Float）。
    2.  TIM 材料必須具備極佳的剪切變形容忍度（如彈性銦箔或可蠕變的導熱膏），防止在高頻拉載拉鋸下乾涸或開裂。

---

## Cross-References

*   封裝級液冷：[[MCL與MCCP液冷技術]]
*   導熱介面材料：[[TIM 導熱介面材料]]
*   發熱負載特性：[[AI 工作負載熱特性]]
*   冷板設計原理：[[Cold Plate]]
*   下世代平台：[[Vera Rubin 機櫃物理與電力架構]]
