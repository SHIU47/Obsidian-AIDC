---
tags: [equipment, power, busbar, electrical, high-density]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# Busbar 匯流排

**Busbar（匯流排）** 是以裸露或絕緣導體棒（銅排/鋁排）取代傳統多芯電纜的大電流配電系統。在 GB200 等高密度 AI 機架（120 kW/rack）中，傳統電纜截面積不足以承載所需電流，Busbar 是唯一可行的配電方式。

> ⚠️ **HVAC 重點：Busbar I²R 發熱是 IT 熱負荷以外的額外熱源，佔 2~5%，CFD 模型必須納入計算。**

## 為什麼高密度機架必須用 Busbar？

**電流計算（GB200 × 120 kW，三相 480V）：**

$$I = \frac{P}{\sqrt{3} \times V} = \frac{120{,}000}{1.732 \times 480} \approx 144\ A$$

| 比較項目 | 傳統 DC（10 kW/rack）| AIDC（120 kW/rack）|
|---------|---------------------|-------------------|
| 電流 | ~20 A | **~250 A（含 A/B Feed 各一路）**|
| 配電方式 | 一般多芯電纜 | **Busbar 為主** |
| 單根電纜截面積 | 4~6 mm² | 需要 150~240 mm²，不現實 |
| 佈線彈性 | 高 | Busbar 需預先規劃路由 |

> 傳統電纜在 250A 下需用多根並聯或超大截面積電纜，重量、成本、施工難度均不可行。

## 系統架構

```
MSB（主配電盤）
↓
UPS
↓
【Busbar Trunking System（BTS）】
主幹匯流排沿機房走道天花板或地板下敷設
↓
插接箱（Tap-off Box）← 每個機架位置各一個
↓
PDU（電源分配單元）→ Rack
```

Busbar 的核心優勢是**插接箱（Tap-off Box）**：在主幹任意位置插入取電，機架位置調整時只需移動插接箱，不需重新拉電纜。

## I²R 發熱與 HVAC 的關係

Busbar 並非完美導體，電流通過時產生電阻熱：

$$P_{loss} = I^2 \times R$$

| 場景 | 主幹電流 | 估計發熱損耗 |
|------|---------|-----------|
| 100 台 GB200（12 MW IT）| 數千安培 | **240~600 kW 額外熱負荷** |
| 佔 IT 熱負荷比例 | — | **2~5%** |

**對 HVAC 的影響：**
- Busbar 通常沿走道敷設，發熱集中在走道天花板或地板下
- 若 CFD 模型未納入 Busbar 熱源，會低估走道局部熱量，可能出現設計外的 Hot Spot
- 設計冷卻容量時應在 IT Load 基礎上加 2~5% 作為 Busbar 熱補償

## 銅排 vs 鋁排

| 比較項目 | 銅排（Copper）| 鋁排（Aluminium）|
|---------|-------------|----------------|
| 導電率 | 100%（基準）| ~61% |
| 重量 | 重 | **輕 50~60%**（大截面積時優勢顯著）|
| 截面積需求 | 小 | 較大（同電流下）|
| 成本 | 高 | 低 |
| AIDC 使用 | 主幹段常用 | 長距離主幹（減輕建築荷重）|

## 代表廠商

- **Schneider Electric**（Canalis 系列，AIDC 市場主流）
- **ABB**（Zucchini 系列）
- **Siemens**（BD2 系列）
- Eaton（Pow-R-Way）

## Cross-References

- 電力系統：[[Module 06 - 電力架構與機電整合]]
- 上游設備：[[UPS]]（UPS 輸出接 Busbar 主幹）
- 末端設備：GB200 NVL72 雙 PSU → [[GB200 NVL72 冷卻需求]]
- HVAC 關聯：[[CFD 模擬]]（Busbar 熱源需納入 CFD 熱場分析）
- 廠商：[[Module 08 - 廠商生態系統]]
