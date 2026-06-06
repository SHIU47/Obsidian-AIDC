---
tags: [entity, equipment, air-cooling, in-row]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# In-Row Cooling

**In-Row Cooling（IRC，列間冷卻）** 是將冷卻設備直接安裝在機架排列中間的近端冷卻方案，大幅縮短冷風路徑，降低熱氣混合風險。

## 工作原理

```
機架（熱）→ IRC（帶走熱量）→ 機架（熱）→ IRC → 機架
```

IRC 安裝在機架之間，熱風從機架後方排出後立刻被 IRC 吸入冷卻，不需穿越整個機房。

## 關鍵規格

| 參數 | 數值 |
|------|------|
| 單機容量 | 10~50 kW |
| 適用機架功耗 | 20~30 kW/rack |
| 溫度控制精度 | ±2°C |
| 冷源 | 冷凍水直接進入 IRC 盤管 |
| 地板依賴 | 不依賴架高地板或天花板回風 |

## 優缺點

| 優點 | 缺點 |
|------|------|
| 氣流路徑極短，溫度控制精準 | 佔用機架空間（需 1U 寬度）|
| 不依賴架高地板 | 冷凍水管路需配到每個 IRC |
| 可精準對應高熱密度區域 | 成本高於傳統 CRAH |
| 適合局部高密度升級 | 對 GB200（120 kW）仍不夠用 |

## 空冷極限補強

IRC 是在空冷框架下把熱密度上限從 **15 kW → 30 kW/rack** 的補強手段。

超過 40 kW/rack 後，IRC 也無法應對，必須轉向液冷（CDU + DLC）。

## 與其他方案比較

| 方案 | 適用功耗 | 改造難度 | 成本 |
|------|---------|---------|------|
| CRAH | < 20 kW/rack | 低 | 低 |
| **IRC** | 20~30 kW/rack | 中 | 中 |
| RDHX | 20~60 kW/rack | 低 | 中 |
| CDU + DLC | > 40 kW/rack | 高 | 高 |

## 代表廠商

- **Vertiv**（Liebert XD 系列）
- **Schneider Electric**（APC InRow）
- Rittal（LCP）

## Cross-References

- 比較：[[CRAH]]、[[RDHX]]、[[CDU 架構與選型]]
- 系統：[[Module 03 - 空冷系統架構]]
- 觸發條件：[[Module 03 - 空冷系統架構]]（空冷轉液冷觸發條件）
- 冷源：[[Chiller Plant]]
