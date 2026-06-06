---
tags: [entity, vendor, chiller, cooling-plant, carrier, HVAC]
sources: ["[[Chiller Plant]]", "[[冷媒知識]]", "[[Module 08 - 廠商生態系統]]"]
created: 2026-06-06
updated: 2026-06-06
---

# Carrier（開利）

**Carrier Global Corporation** 是全球最大的 HVAC 設備製造商之一，成立於 1902 年（空調技術發明者 Willis Carrier 創立）。在 AIDC 領域，Carrier 以大型**離心式冷凍機（Centrifugal Chiller）** 和全球最廣的服務網絡著稱。

---

## 核心產品線

| 產品系列 | 技術特色 | AIDC 應用 |
|:---|:---|:---|
| **AquaEdge 19XR（R-134a）** | 雙級離心壓縮，300~1,750 RT，VFD 標配 | 大型資料中心主力 Chiller |
| **AquaForce Vision PUREtec（R-1234ze）** | **低 GWP 冷媒（GWP=7）**，磁浮軸承選配 | **新建 AIDC 環保法規合規首選** |
| **30XW 系列（螺桿式）** | 50~500 RT，部分負載穩定 | 中型機房、邊緣 DC |
| **AquaSnap 30RB/RQ** | 空冷式 Chiller，無需冷卻塔 | 小型或屋頂式 DC |

---

## AIDC 生態定位

**優勢：**
- 全球最大冷凍機製造商之一，**備件供應鏈最廣泛**（台灣各縣市均有服務中心）
- AquaForce Vision PUREtec 系列支援 **R-1234ze(E)**，GWP = 7，領先符合 EU F-Gas 2030 規範
- 雙級壓縮技術：在高冷凍水溫升（供 / 回水 6°C / 12°C 以外的大 ΔT 需求）下效率突出
- 提供**預製化冷凍機房模組（Carrier Total Energy Solutions）**，縮短建置工期

**弱勢：**
- 磁浮技術為選配（非標配），Turbocor 類型磁浮機在部分負載 COP 上落後 Daikin
- 售後服務費用偏高（美系定價）
- 台灣市場佔有率不如日系（Daikin、三菱重工）高

---

## SWOT 分析

| | 優勢（S）| 弱勢（W）|
|:---|:---|:---|
| | 全球服務網最廣、備件最快 | 磁浮機部分負載 COP 不如 Daikin |
| | R-1234ze 環保冷媒領先 | 美系定價偏高 |
| **機遇（O）**| EU F-Gas 法規推動低 GWP 機種需求 | |
| **威脅（T）**| | Daikin Turbocor 在 AIDC 效率市場侵蝕 |

---

## AIDC 工程選型建議

- **新建大型 AIDC（> 20 MW）**：AquaForce Vision PUREtec（R-1234ze）→ 10 年無需擔心冷媒法規問題
- **台灣中型 AIDC**：AquaEdge 19XR（R-134a）→ 成熟、備件充足、性價比優
- **評估 IPLV / NPLV 時**：要求廠商提供 ARI 550/590 認證測試數據，確認部分負載效率

---

## Cross-References

- 冷凍機房設計：[[Chiller Plant]]
- 冷媒選擇：[[冷媒知識]]（R-1234ze 趨勢）
- 對比廠商：[[Daikin]]（磁浮 COP 優勢）、[[Trane]]（模組化冷凍機房）
- 系統效率計算：[[Module 05 - 冷源與冷凍機房]]
