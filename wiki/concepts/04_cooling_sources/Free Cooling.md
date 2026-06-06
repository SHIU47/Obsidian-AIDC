---
tags: [concept, free-cooling, economizer, energy, dry-cooler]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-06-06
---

# Free Cooling

**Free Cooling（自然冷卻）** 是利用戶外低溫直接或間接帶走機房熱量，使冷凍機停機或部分運轉，是降低 AIDC 運營電費最有效的手段之一。

## 三種主要形式

| 類型 | 原理 | 適用條件 | 效益 |
|------|------|---------|------|
| 直接空氣自然冷卻 | 戶外冷空氣直接送入機房 | 戶外溫度 < 18°C 且無污染 | PUE 最低，但受地點限制 |
| 間接蒸發冷卻（IEC）| 戶外空氣冷卻冷凍水，不直接接觸 IT | 戶外濕球溫度 < 16°C | 水質可控，適合大部分地點 |
| **冷凍水側（Waterside Economizer）**| 冷卻塔直接供冷凍水 | 戶外濕球 < 10°C | 最常見，台灣冬季可部分使用 |

## 關鍵公式

**冷卻塔出水溫度下限 = 當地濕球溫度 + 接近溫度（3~5°C）**

→ 這個溫度決定 Free Cooling 是否可行，**瓶頸在冷卻塔，不在 Chiller**。

## 全球各地 Free Cooling 可用時數

| 地點 | 濕球溫度 | Free Cooling 可用時數 | GB200 供水可行性 |
|------|---------|-------------------|----------------|
| 北歐（瑞典、芬蘭）| 年均 < 10°C | **> 6,000 hr/yr** | ✅ 冬季完全可行 |
| 台灣北部 | 夏 26~28°C / 冬 12~16°C | **1,000~2,000 hr/yr** | ⚠️ 僅冬季部分 |
| 新加坡 | 全年 25~27°C | **< 500 hr/yr** | ❌ 幾乎不可行 |

> Meta、Google 選址北歐的核心原因就是 Free Cooling 時數極長，年省電費以億計。

## 台灣策略

- 夏季：Chiller 全力運轉，Free Cooling 無法使用
- 冬季（12~2月）：加裝 Waterside Economizer，Chiller 部分停機，可節省 **15~25%** 電費
- GB200 供水 ≤ 17°C：台灣氣候全年均需 Chiller 輔助

## Free Cooling 不是開關，是光譜

冷卻塔出水越低 → Chiller 工作越輕鬆 → COP 越高 → PUE 越低。即使無法完全停 Chiller，低溫天氣仍可大幅提升 Chiller 效率。

## 乾冷器（Dry Cooler）— 溫水液冷時代的 Free Cooling 主力

傳統 Free Cooling（Waterside Economizer）仍需要冷卻塔，出水溫度受**濕球溫度**限制，台灣夏季仍無法免除 Chiller。

**Vera Rubin 平台 45°C 溫水方案的突破**：

- 供水溫度限制放寬至 45°C，回水最高 65°C
- 此時可改用**乾冷器（Dry Cooler）**取代冷卻水塔 + Chiller 的組合
- 乾冷器出水溫度受**乾球溫度**限制，台灣夏季 DBT = 35°C → 乾冷器出水 38~40°C，**仍低於 45°C 的供水要求**
- 全球任何氣候區均可 **100% Chiller-Free**，WUE = 0

| 冷源方案 | Free Cooling 可行溫度限制 | 台灣夏季 | WUE |
|:---|:---:|:---:|:---:|
| 冷卻塔 + Waterside Economizer | 需達到 ≤ 設計供水溫度 | ❌（GB200 ≤17°C 需求）| 高 |
| **乾冷器（Dry Cooler）**| 環境 DBT + 接近溫度 ≤ 45°C | ✅（Vera Rubin 可行）| **= 0** |

詳細說明見 [[乾冷器]]、[[Dry Cooler vs. 冷卻塔]]。

## Economizer Mode 控制邏輯

以 **Waterside Economizer（冷凍水側自然冷卻）** 為例，完整的控制模式：

```
模式 A：全機械冷卻（Pure Mechanical Cooling）
  條件：WBT > 12°C（台灣春夏秋）
  → Chiller 全開，冷卻塔輔助散熱

模式 B：部分 Free Cooling（Partial Economizer）
  條件：5°C < WBT < 12°C（台灣冬季）
  → Chiller 低負載 + Waterside Economizer 補助
  → 三通閥調節冷凍水比例

模式 C：全 Free Cooling（Full Economizer）
  條件：WBT < 5°C（台灣幾乎不出現，北歐常態）
  → Chiller 完全停機，冷卻塔直接供冷凍水
```

**控制關鍵參數：**
- 切換觸發條件：依「冷卻塔出水溫度」（而非 WBT），避免延遲
- 防結露保護：當 Free Cooling 供水溫度低於機房露點溫度時，三通閥限制最低供水溫度（通常 ≥ 13°C）

## Cross-References

- 相關：[[Chiller Plant]]、[[PUE 計算]]、[[LMTD 計算]]
- 乾冷器詳解：[[乾冷器]]（Vera Rubin 45°C 溫水方案核心）
- 比較：[[Dry Cooler vs. 冷卻塔]]
- 應用：[[Module 05 - 冷源與冷凍機房]]
- 設計：[[Module 07 - 設計計算實務]]
- 供水溫度限制：[[GB200 NVL72 冷卻需求]]、[[Vera Rubin 機櫃物理與電力架構]]
