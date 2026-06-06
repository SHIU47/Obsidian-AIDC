---
tags: [concept, thermal, calculation, AIDC]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
module: "02"
quiz_score: 93
---

# Module 02 - AIDC 熱負荷與冷卻需求

> **學習目標：** 理解 AI Data Center 的熱負荷從哪裡來、有多大、怎麼算。掌握 PUE、機架功率密度等核心指標，能從 IT 功耗推導出冷卻系統所需處理能力。這是所有設備選型的起點。

## 熱的本質：電功率 → 熱量

電能輸入 IT 設備後，幾乎全部轉換為熱能。IT 設備消耗的電功率（kW）≈ 散出的熱量（kW）。

**必背換算：**
- 1 kW = 3,412 BTU/hr
- 1 RT（冷凍噸）= 3.517 kW = 12,000 BTU/hr
- 熱量公式：**Q = ṁ × Cp × ΔT**
- 1 MW AI GPU 機群 ≈ 284 RT，相當於約 280 戶家庭冷氣用量

## IT 設備功耗參考

| 設備 | 功耗 |
|------|------|
| NVIDIA H100 SXM5（整機）| ~10~12 kW |
| NVIDIA H200 SXM（整機）| ~10~12 kW |
| **NVIDIA GB200 NVL72（整架）**| **120 kW** |
| AMD MI300X（整機）| ~9~11 kW |
| 400GbE ToR Switch | ~1~2 kW |
| NVIDIA InfiniBand NDR400 Switch | 最高 5.4 kW |

## 機架功率密度趨勢

| 時代 | 密度 | 冷卻方式 |
|------|------|---------|
| 傳統 DC | 3~8 kW/rack | 傳統空冷 |
| H100 時代 | 20~40 kW/rack | 強化空冷或輔助液冷 |
| GB200 時代 | 100~120 kW/rack | **必須全液冷** |
| 下一代預測 | 200+ kW/rack | 更高流量液冷 |

## 冷卻需求計算鏈（必背）

```
台數 × 功耗 = IT Load
↓ × 設計裕度（1.2）
設計冷卻容量（kW）
↓ ÷ 3.517
設計 RT 數
↓ ÷ 單台容量，無條件進位，+ N+1
Chiller 台數
↓ ÷ COP
Chiller 耗電
↓ IT Load × PUE
設施總用電
↓
水量（L/s）、風量（m³/s）、UPS kVA
```

**設計裕度：1.15~1.25（AIDC 標準）**，原因：
- GPU 實際功耗可超過 TDP 標示值 105~110%
- 未來可能增加機台
- 系統老化損耗

## 冷凍水流量計算（重要單位觀念）

$$\dot{m} = \frac{Q}{Cp \times \Delta T}$$

> ⚠️ **Q 用 kW 計算，結果直接是 kg/s，不需除以 3,600！**
> kW = kJ/s，所以 kJ/s ÷ (kJ/kg·K × K) = kg/s

**範例（GB200 × 300 台 Boss 關）：**

| 項目 | 計算 | 答案 |
|------|------|------|
| IT 負載 | 300 × 120 kW | 36,000 kW |
| 設計容量 | 36,000 × 1.2 | 43,200 kW = 12,286 RT |
| 冷凍水流量 | 43,200 ÷ (4.186 × 8) | 1,290 L/s |
| 設施總用電 | 36,000 × 1.25 | 45,000 kW |
| Chiller 台數 | 12,286 ÷ 2,000 → 7台 + N+1 | **8 台** |

## AIDC vs 傳統 DC 熱負荷特性

- 熱密度：AIDC 可達 100+ kW/rack，相差 10~20 倍
- 負載穩定度：AI 訓練 GPU 利用率可達 80~95%，幾乎全時間高負載
- 熱源集中：整個機架幾乎全是 GPU
- 規模：單一 AIDC 可達 100~500 MW IT 負載

## Cross-References

- 相關：[[PUE 計算]]、[[Chiller Plant]]、[[Free Cooling]]
- 相關：[[Module 01 - Data Center 基礎概念]]
- 下一模組：[[Module 03 - 空冷系統架構]]
- 計算工具：[[Module 07 - 設計計算實務]]

## Sources

- Notion「AIDC HVAC 學習基地」Module 02 — 含自我測驗（93/100，2026-04-27）
- 修正記錄：流量單位 kg/s 不需除以 3,600
