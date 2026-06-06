---
tags: [concept, AIDC, BMS, DCIM, controls, SOO, dew-point, liquid-cooling, HVAC]
sources: ["[[AIDC 核心標準與規範指引]]", "[[液冷系統 - CDU 架構]]", "[[AIDC 驗收測試與調試實務]]"]
created: 2026-06-06
updated: 2026-06-06
---

# BMS與DCIM序列控制邏輯

在 AIDC 中，暖通與電力硬體的高效運行，完全依賴於 **BMS（Building Management System, 廠務監控系統）** 與 **DCIM（Data Center Infrastructure Management, 資料中心基礎設施管理系統）** 的**序列控制邏輯（Sequence of Operations, SOO）**。對於超高功率密度的直接液冷系統，控制迴路的反應時間與精準度決定了晶片是否會因為瞬間熱量積聚而燒毀。

---

## 1. CDU 二次側（TCS）水路恆壓差（DP）控制

TCS 迴路負責直接帶走 GPU 的熱量，系統水泵必須根據伺服器負載動態調整流量。

```
  [ CDU 供水主幹管 ] -------------------------> [ 機櫃伺服器節點 ]
         |                                           | (閥門開閉改變阻力)
  [ 差壓變送器 (DP Sensor) ]                   [ 差壓變送器 (DP Sensor) ]
         |                                           |
         +-----------------< [ BMS 控制器 ] <---------+
                                 | (PID 計算)
                     [ 變頻器 (VFD) 調整水泵轉速 ]
```

*   **控制目標**：維持機櫃進出口的**壓差（Differential Pressure, DP）恆定**，以確保即使部分伺服器節點拉出維護時，其餘在線運行的節點流量依然穩定。
*   **控制序列**：
    1.  BMS 實時讀取設置於最遠端（末端機櫃）進回水 Manifold 之間的差壓變送器數值。
    2.  將實測差壓 $DP_{act}$ 與設定目標值 $DP_{set}$（例如 $1.2 \text{ bar}$）進行比較。
    3.  透過 **PID 控制演算法**（比例-積分-微分，反應時間需 **$< 1.5 \text{ 秒}$**），輸出 $0 \sim 100\%$ 的頻率信號給二次側循環水泵的變頻器（VFD）：
        *   若 $DP_{act} < DP_{set}$ $\rightarrow$ VFD 頻率拉升 $\rightarrow$ 水泵加速。
        *   若 $DP_{act} > DP_{set}$ $\rightarrow$ VFD 頻率調降 $\rightarrow$ 水泵減速。

---

## 2. CDU 一次側三通調節閥與露點追蹤邏輯（Dew Point Tracking）

這是防止白區結露的核心邏輯防線。CDU 必須根據室內空氣溫度與濕度，動態調整送入伺服器的冷卻水溫 $T_{s2}$：

$$\text{TCS 送水溫度設定值 } T_{s2\_set} = \text{Dew Point } (T_{dew}) + 2^\circ\text{C} \text{ (安全裕度)}$$

```
 [ 白區溫濕度感測器 ] ---> [ BMS 計算露點 T_dew ] ---> [ 設定目標 Ts2_set = T_dew + 2°C ]
                                                               |
 [ 一次側三通電動閥開度 ] <--- [ PID 控制調節 ] <--- [ 比較實測 Ts2 與 Ts2_set ]
```

*   **控制序列**：
    1.  BMS 每 10 秒讀取白區（White Space）回風口的溫度（$T_{air}$）與相對濕度（$RH$），透過 Magnus-Tetens 公式動態計算當前露點溫度 $T_{dew}$。
    2.  CDU 控制器設定二次側供水溫度目標值 $T_{s2\_set} = T_{dew} + 2^\circ\text{C}$。
    3.  實時讀取二次側供水感測器數值 $T_{s2\_act}$。
    4.  PID 調節 CDU 一次側（Chilled Water 側）的**三通電動調節閥**（Modulating Three-Way Valve）：
        *   若 $T_{s2\_act} > T_{s2\_set}$ $\rightarrow$ 電動閥開啟，增加一次側低溫冰水流量，強化熱交換，拉低二次側水溫。
        *   若 $T_{s2\_act} < T_{s2\_set}$（接近露點危險區） $\rightarrow$ 電動閥關小，減少冰水流量，讓二次側水溫自然回升。

---

## 3. 冷源一次側控制邏輯（Chiller Staging & Pump VFD）

冷凍機房（Chiller Plant）的控制邏輯決定了系統整體的 PUE 能效：

### 冰機啟停控制（Chiller Staging）
BMS 根據全廠的**熱負載（Cooling Load）**來決定啟動幾台冰機，而非僅看回水溫度。

$$\text{Cooling Load (kW)} = \dot{m} \text{ (流量, kg/s)} \times C_p \text{ (比熱, 4.18)} \times \Delta T \text{ (溫差, } ^\circ\text{C} )$$

*   **載入序列 (Loading)**：當實測熱負載大於當前運行冰機總容量的 $90\%$，且持續 $10\text{ 分鐘}$ 以上時，BMS 發出指令啟動下一台備用冰機（按等電位循環累計運行時間最短的設備優先啟動）。
*   **卸載序列 (Unloading)**：當熱負載降至當前運行冰機總容量的 $45\%$ 以下時，BMS 關閉一台冰機，並自動將多餘流量旁路。

### 冷水泵變頻控制（Primary/Secondary Pump VFD）
採用**二次泵變頻系統**。一次泵（Chiller 側）維持恆定流量以保護 Chiller 蒸發器不結冰；二次泵（廠務幹管側）則根據廠務供回水主幹管的壓差動態調節轉速，降低泵浦功耗。

---

## 4. 冷卻水塔與冷凝水控制（Tower Fan Control）

*   **控制目標**：控制冷卻塔風扇轉速，將進入 Chiller 冷凝器（Condenser）的冷卻水溫維持在設定點（例如 $26^\circ\text{C}$），或接近環境濕球溫度（Wet Bulb Temperature）。
*   **控制序列**：
    1.  BMS 監測冷卻塔出口（進入 Chiller）的水溫 $T_{cw}$。
    2.  將 $T_{cw}$ 與目標值進行比較。
    3.  PID 控制**冷卻塔風扇的變頻馬達**：
        *   水溫升高時，風扇加速，增加蒸發散热量。
        *   水溫降低或冬季時，風扇減速甚至停轉，改用重力自然冷卻，省下風扇電能。

---

## 5. 緊急停機與安全聯鎖（ESD Interlock Logic）

當發生嚴重故障時，控制系統必須執行硬體防禦動作以阻止災害蔓延：

```
       [ 嚴重事件觸發 ]                               [ 控制器執行防禦動作 ]
  ==========================                  ====================================
  * 感漏電纜漏水報警 (>1.5s)  ====聯鎖動作====> * 關閉該分支 Manifold 電磁閥
  * 液冷管路壓力暴降 (>3.0 bar)                 * 關閉該機櫃 PDU 電源 (IT 降載)
  ==========================                  ====================================
  * 消防系統 VESDA 觸發 (L4) ===聯鎖動作====> * 白區空氣精密空調 (CRAH) 停轉關風機
  * 氣體消防噴放觸發                          * 關閉防火風門 (防止滅火氣體流失)
  ==========================                  ====================================
```

---

## Cross-References

*   露點與水路設計：[[液冷系統 - CDU 架構]]、[[CDU 架構與選型]]
*   驗收聯鎖測試：[[AIDC 驗收測試與調試實務]]
*   故障模式防範：[[AIDC FMEA 故障模式與效應分析]]
*   冰機水路基礎：[[Chiller Plant]]
