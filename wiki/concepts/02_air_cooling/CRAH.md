---
tags: [entity, equipment, air-cooling, CRAH]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# CRAH

**CRAH（Computer Room Air Handler，電腦室空氣處理機）** 使用外部冷凍水系統作為冷源，空氣吹過冷凍水盤管降溫，是大型 AIDC 的標準空冷設備。

## 工作原理

冷凍水（來自 Chiller）流經盤管（Coil）→ 空氣吹過盤管降溫 → 冷風送入冷通道 → 熱風回到 CRAH 盤管 → 回水至 Chiller

**類比：** CRAH = AHU 空氣處理機組（需外部冷源驅動）

## 規格參數

| 參數 | 數值 |
|------|------|
| 單機容量 | 50~300 kW |
| 能效 | 配合高效 Chiller，COP 5~7 |
| 適用規模 | MW 級大型 AIDC |
| 冷源 | 外部冷凍水系統 |
| 自然冷卻 | ✅ **支援**（冷凍機可停機節能）|

## 優缺點

| 優點 | 缺點 |
|------|------|
| 能效高，PUE 可低至 1.2 以下 | 必須配合 Chiller Plant |
| 單台容量大（50~300 kW）| 冷凍水管路設計複雜 |
| **支援 Free Cooling** | 需整體機房規劃 |
| 可搭配磁浮冷凍機大幅提升 COP | — |

## 氣流設計

典型 CRAH 送風參數：
- 送風溫度：17~22°C
- 回風溫度：30~40°C
- ΔT：15~20°C
- 每 1 kW 熱負荷所需風量：≈ **0.055 m³/s**

> ⚠️ ASHRAE 量測點在機架**進氣口**，不是 CRAH 出風口，也不是機架排氣口！

## 部署形式

- **地板送風式**：搭配架高地板靜壓箱，傳統主流
- **天花板送風式**：搭配熱通道封閉（HAC），現代 Hyperscaler 主流
- **微軟 DC 實際案例**：平地板 + CRAH 在兩側直吹冷通道，機架後方 HAC 封閉

## CRAC vs CRAH 比較

| 項目 | CRAC | CRAH |
|------|------|------|
| 冷源 | 自帶壓縮機（冷媒）| 外部冷凍水 |
| 能效 | EER 2.5~3.5 | COP 5~7 |
| 適用規模 | < 500 kW | MW 級 |
| Free Cooling | ❌ | ✅ |
| AIDC 首選 | 小型/邊緣 | ✅ 大型 AIDC |

## 在 AIDC 的角色

CRAH 在高密度 AIDC 中是**輔助冷卻**角色：
1. 維持白區整體環境溫度（ASHRAE A2：< 35°C）
2. 帶走非 GPU 設備（交換機、儲存）的熱量
3. CDU 周邊散熱輔助

主力冷卻由液冷（CDU + DLC）承擔。

## 代表廠商

- **Vertiv**（Liebert DSE 系列）
- Schneider Electric
- Munters
- STULZ

## Cross-References

- 比較：[[CRAC]]
- 系統：[[Module 03 - 空冷系統架構]]
- 冷源：[[Chiller Plant]]、[[Free Cooling]]
- 補強方案：[[In-Row Cooling]]、[[RDHX]]
- 標準：[[ASHRAE TC 9.9 Data Center 溫濕度標準]]
