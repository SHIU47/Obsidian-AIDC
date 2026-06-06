---
tags: [entity, equipment, air-cooling, CRAC]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# CRAC

**CRAC（Computer Room Air Conditioner，電腦室空調）** 是內建壓縮機的精密空調設備，以冷媒直膨式（DX）換熱方式冷卻機房空氣，可獨立運行，不需外部冷凍水系統。

## 工作原理

採用蒸氣壓縮循環（Vapor Compression Cycle）：
- 冷媒在蒸發器吸熱 → 壓縮機加壓 → 冷凝器排熱至戶外 → 膨脹閥降壓 → 循環

**類比：** CRAC = 大型分離式冷氣機（自帶壓縮機）

## 規格參數

| 參數 | 數值 |
|------|------|
| 單機容量 | 20~60 kW |
| 能效比（EER）| 2.5~3.5 |
| 適用機房規模 | < 500 kW |
| 冷源 | 自帶壓縮機，無需外部冷凍水 |
| 自然冷卻 | ❌ 不支援 |

## 優缺點

| 優點 | 缺點 |
|------|------|
| 無需外部冷凍水管路，部署彈性高 | EER 較低（2.5~3.5），能耗較高 |
| 單機故障影響範圍小 | 壓縮機維護成本高 |
| 適合小型機房或邊緣機房 | 單機容量有限 |
| 安裝簡單，工期短 | 無法支援 Free Cooling |

## CRAC vs CRAH 比較

| 項目 | CRAC | CRAH |
|------|------|------|
| 冷源 | 自帶壓縮機（冷媒）| 外部冷凍水 |
| 能效 | EER 2.5~3.5 | 配合高效 Chiller COP 5~7 |
| 適用規模 | < 500 kW | MW 級大型 AIDC |
| 自然冷卻 | ❌ | ✅ |
| 部署彈性 | 高 | 需整體規劃 |

## AIDC 應用場景

在高密度 AIDC（GB200 機架 120 kW）中，CRAC 幾乎不作為主力冷卻設備，僅用於：
- 邊緣機房或小型 IT 區域
- 維修走廊環境溫度控制
- 臨時或緊急補充冷卻

## 代表廠商

- **Vertiv**（Liebert 系列）
- Schneider Electric（APC）
- STULZ（CyberAir）
- Rittal

## Cross-References

- 比較：[[CRAH]]
- 系統：[[Module 03 - 空冷系統架構]]
- 替代方案：[[In-Row Cooling]]、[[RDHX]]
- 廠商：[[Module 08 - 廠商生態系統]]
