---
tags: [comparison, air-cooling, CRAC, CRAH, HVAC-design]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# 系統對比：CRAC vs CRAH

在資料中心白區環境的精密空冷（Precision Air Cooling）設計中，**CRAC（電腦室精密空調）** 與 **CRAH（電腦室空氣處理機）** 是最常見的兩種末端送風冷卻設備。雖然它們的外觀極為相似，但其 **底層熱力學迴路、冷源配置與適用規模** 卻有著本質上的區別。

---

## 1. 系統架構與熱力循環原理

### A. CRAC (Computer Room Air Conditioner)
*   **本質**：自帶壓縮機的 **直膨式（Direct Expansion, DX）冷媒系統**。
*   **運作流程**：
    1.  白區熱風吸入 CRAC。
    2.  熱風流經內部的 **冷媒蒸發器（Evaporator）**，與低壓液態冷媒進行熱交換，空氣降溫後吹回白區。
    3.  汽化後的冷媒被內建的 **壓縮機（Compressor）** 壓縮成高壓高溫氣體。
    4.  高溫冷媒排至室外的 **冷凝器（Condenser）**，將熱量放給大氣並冷凝為液態。
    5.  冷媒流經膨脹閥降壓，回到蒸發器循環。
*   **類比**：商用超大型「分離式冷氣機」。

### B. CRAH (Computer Room Air Handler)
*   **本質**：無壓縮機的 **冷凍水（Chilled Water, CW）末端處理機組**。
*   **運作流程**：
    1.  室外集中式冷凍機房（[[Chiller Plant]]）產生 **7°C ~ 12°C** 的冷凍水。
    2.  冷凍水經由不鏽鋼/碳鋼管道泵送至白區機房的 CRAH 內部 **水盤管（Chilled Water Coil）**。
    3.  白區熱風經由 CRAH 內部的風扇吹過低溫水盤管，將熱量傳遞給冷凍水。
    4.  降溫後的空氣被吹回白區冷通道；升溫後的冷凍水（~17°C）回流到 Chiller Plant 重新冷卻。
*   **類比**：大型中央空調系統的「風機盤管 / 空氣處理機 (AHU)」。

---

## 2. 熱傳路徑對比 (Mermaid)

```mermaid
graph TD
    subgraph CRAC 直膨系統 (DX Loop)
        IT_Heat_CRAC["IT 設備發熱"] -->|對流風送| Evap["CRAC 內部蒸發器 (吸熱)"]
        Evap -->|冷媒蒸汽| Comp["內置壓縮機 (加壓)"]
        Comp -->|高溫高壓冷媒| Cond["室外風冷冷凝器 (排熱)"]
        Cond -->|散熱至大氣| Air_Out_1["大氣 (Ultimate Heat Sink)"]
    end

    subgraph CRAH 冷凍水系統 (CW Loop)
        IT_Heat_CRAH["IT 設備發熱"] -->|對流風送| CW_Coil["CRAH 水盤管 (吸熱)"]
        CW_Coil -->|冷凍回水| Chiller["室外冰水主機 Chiller"]
        Chiller -->|冷卻循環水| Tower["室外冷卻塔 Cooling Tower"]
        Tower -->|蒸發排熱| Air_Out_2["大氣 (Ultimate Heat Sink)"]
    end

    classDef dx fill:#fff3e0,stroke:#ffb74d,stroke-width:2px;
    classDef cw fill:#e3f2fd,stroke:#64b5f6,stroke-width:2px;
    class Evap,Comp,Cond dx;
    class CW_Coil,Chiller,Tower cw;
```

---

## 3. 技術規格與指標橫向對比

| 比較項目 | CRAC 直膨式系統 | CRAH 冷凍水系統 | 工程選型要點說明 |
|:---|:---|:---|:---|
| **冷源介質** | 氟系冷媒（R410A, R134a 等） | 高純度水 / 乙二醇水溶液 | — |
| **內部關鍵組件**| 壓縮機、蒸發器、膨脹閥、風扇 | 水盤管、水流量調節閥、風扇 | CRAH 內部無壓縮機，振動與噪音低 |
| **單機冷卻容量**| 較小 (通常 20 ~ 90 kW/台) | 較大 (可達 100 ~ 400+ kW/台) | AIDC 單架功耗高，需 CRAH 大風量支撐 |
| **綜合能效比 (COP)**| **較低 (COP ≈ 2.5 ~ 3.5)** | **極高 (配合 Chiller COP 可達 5.0 ~ 7.0)** | CRAH 省去末端壓縮機功耗，節能效果顯著 |
| **自然冷卻 (Free Cooling)**| ❌ **不支援** (或需額外增設氟泵迴路，極複雜) | ✅ **天然支援** (冬季冷卻水可直供，Chiller 停機) | AIDC 降低 PUE 的關鍵核心設計 |
| **初始 CAPEX** | 較低（中小機房，不需冷凍水管路與主機） | 較高（需建置冷凍機房、冷卻塔、雙環網鋼管）| 大型機房（>5 MW）折舊後，CRAH 較划算 |
| **運維 OPEX** | 較高（多台壓縮機維修率高、能耗大）| 較低（僅需維護集中式 Chiller 與水泵）| 集中化管理有利於降低長期的運維人工成本 |
| **漏液與水損風險**| 極低（冷媒洩漏僅為氣體，無泡水短路風險）| 有（管路破裂有水淹白區風險，需嚴格防漏）| 需於地板下安裝漏水感應線與排水溝槽 |
| **適用資料中心規模**| **小型、邊緣（Edge）資料中心（< 500 kW）**| **中大型、超大型 AI 資料中心（> 2 MW）** | AIDC 主力空冷基礎設施 |

---

## 4. 控制指標與調節特性對比

精密機房控制對於溫濕度的穩定度要求極高，兩者在控制調節上有顯著差異：

### A. 溫度與流量調節精準度
*   **CRAC 的調節**：
    *   傳統 CRAC 採用壓縮機「啟/停」控制，溫度波動較大。
    *   現代高階 CRAC 雖導入變頻壓縮機（Inverter Compressor）與電子膨脹閥，但因冷媒相位變化的延遲，PID 調節反應時間仍需 1~3 分鐘。
*   **CRAH 的調節**：
    *   CRAH 配置 **比例式雙通或三通調節閥（Modulating Control Valve）**。
    *   透過直接調節冷凍水流量，PID 控制精度可達 $\pm 0.5^\circ\text{C}$，且反應時間在秒級範圍內，對 AI 運算瞬間拉高功耗的因應力極佳。

### B. 濕度控制
*   **除濕邏輯**：資料中心需要維持適當相對濕度（40% ~ 60% RH）。
    *   **CRAC**：為進行局部除濕，壓縮機需強行運轉調低盤管溫度至露點以下，容易造成過度冷卻，隨後需要啟動電加熱器重熱（Re-heat），此為極大的電能浪費。
    *   **CRAH**：藉由中控 Chiller 供水溫度調節，或直接調節 CRAH 二通閥開度即可精準除濕，重熱需求極低。

---

## 5. AIDC 部署架構與實務選型原則

在高密度 AI 資料中心（如 GB200 機架達 120 kW）的混合散熱（Hybrid Cooling）設計中，CRAC 與 CRAH 的角色已完全定調：

1.  **CRAH 作為中大型 AIDC 白區唯一空冷主力**
    *   **定位**：白區環境冷風的「基本盤」。
    *   **任務**：帶走約 10~20% 無法進行液冷熱交換的 IT 設備熱量（如網卡、記憶體、硬碟、交換機、電源模組），並確保整體機房空氣溫度維持在 ASHRAE A1/A2 標準（< 27°C）。
    *   **架構**：CRAH 通常沿著白區牆側（Wall-mounted）或於列間（In-Row）部署，並強制實施 **HAC（熱通道封閉）**，避免冷熱風混合。
2.  **CRAC 退守至邊緣與配機灰區**
    *   **定位**：局部輔助與單獨隔離室的冷源。
    *   **任務**：部署於 **灰區的 UPS 電池房、中壓配電室、或獨立的網管調度室**。這些房間發熱量較小（約 20~50 kW），不值得拉設龐大的冷凍水管路，使用獨立的 CRAC 具有極佳的防護隔離效果。

---

## 6. Cross-References

*   概念頁面：[[CRAC]]、[[CRAH]]
*   系統整合：[[Module 03 - 空冷系統架構]]
*   冷源後台：[[Chiller Plant]]、[[Free Cooling]]
*   液冷邊界：[[CDU 架構與選型]]、[[液冷系統 - CDU 架構]]
*   環境標準：[[ASHRAE TC 9.9 Data Center 溫濕度標準]]
