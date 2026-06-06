---
tags: [concept, tier, uptime-institute, reliability, redundancy, availability]
sources: ["[[Module 01 - Data Center 基礎概念]]"]
created: 2026-06-06
updated: 2026-06-06
---

# Tier 分級深度解析

**Uptime Institute Tier Standard** 是全球資料中心可靠性與備援設計的權威分級標準，分為 Tier I ~ IV。理解每個 Tier 的**核心技術定義**——尤其是「可同步維護（Concurrently Maintainable）」與「容錯（Fault Tolerant）」的本質差異——是設計 AIDC 電力與冷卻備援架構的基礎。

---

## 1. 四個 Tier 的核心定義與可用性

| Tier | 名稱 | 年停機時間上限 | 年可用性 | 設計哲學 |
|:---:|:---|:---:|:---:|:---|
| **I** | Basic Capacity | 28.8 hr/yr | 99.671% | 單一路徑，無備援 |
| **II** | Redundant Components | 22.0 hr/yr | 99.749% | N+1 組件備援，單一路徑 |
| **III** | Concurrently Maintainable | 1.6 hr/yr | **99.982%** | **雙路徑，可同步維護** |
| **IV** | Fault Tolerant | 0.4 hr/yr | **99.995%** | **雙路徑 + 容錯，任何單故障不中斷** |

---

## 2. Tier 核心概念深解

### A. Tier I / II — 單路徑（Single Path）

- IT 設備到冷源、IT 設備到電源，只有**一條路徑**
- 任何計畫性維護（更換過濾器、測試 UPS、清洗冷卻塔）都**必須停機**
- Tier II 多了 N+1 備用組件，發生意外故障時可切換，但**計畫維護仍需停機**

> ⚠️ 大多數傳統企業機房是 Tier I ~ II，不適合 24/7 要求 99.98%+ 的 AI 訓練工作。

### B. Tier III — 可同步維護（Concurrently Maintainable）

**關鍵定義：** 可在 IT 負載完全不中斷的情況下，對任何**單一**設備、組件或配電/配管路徑進行計畫性維護。

**實現機制：**
- 電力：A Feed + B Feed 雙路電力引入，每條路徑獨立承載 100% 負載
- 冷卻：雙組冷凍機、雙組冷卻塔、雙組 CDU，任一組可獨立離線維護
- 配電：雙組 UPS，雙組 PDU，雙路饋線

```
[市電 A 路] → UPS A → PDU A ─┐
                               ├→ IT 設備（雙 PSU）
[市電 B 路] → UPS B → PDU B ─┘
（任一路可獨立維護，IT 設備始終由另一路供電）
```

**限制：**
- Tier III 只能容忍**計畫性維護**不停機，但**非計畫性故障（意外）**仍可能造成中斷
- 若 A 路 UPS 故障的同時 B 路恰好在維護中，仍會停機（這需要 Tier IV 才能處理）

### C. Tier IV — 容錯（Fault Tolerant）

**關鍵定義：** 任何**單一** Tier III 所需的計畫維護，**加上** 任何**單一**非計畫性故障，均不造成 IT 負載中斷。

**實現機制（2N 全系統雙活）：**
- 電力：**2N** UPS + **2N** PDU，兩套系統同時運行，各承載 100% 負載
- 冷卻：**2N** 冷凍機房（兩套完全獨立）
- 網路：完全雙路獨立的入館光纖路由
- **機械與電氣系統完全獨立，無任何共用元件（Single Point of Failure = 0）**

---

## 3. 各子系統在 Tier III / IV 的具體差異

### 電力系統

| 子系統 | Tier III（可同步維護）| Tier IV（容錯）|
|:---|:---|:---|
| 市電引入 | 雙路電源（可同源）| **雙路電源（須不同路由、不同變電站）** |
| 主變壓器 | N+1 | **2N（兩組完全獨立）** |
| UPS 架構 | A/B Feed，各承 50% 或 100% | **2N，兩套完全獨立，各 100%** |
| 發電機 | N+1 共用母線 | **2N 分組，分接不同母線** |
| PDU/RPP | 雙路引入 | **雙路引入 + 雙 STS（靜態轉換開關）** |

### 冷卻系統

| 子系統 | Tier III | Tier IV |
|:---|:---|:---|
| 冷凍機（Chiller）| N+1，共用管路 | **2N，獨立管路路由** |
| 冷卻塔 | N+1，共用集水槽 | **2N，獨立系統** |
| CDU（液冷）| N+1，雙泵 VFD | **2N，兩套 CDU，分別接不同 Chiller 系統** |
| 泵組 | N+1 | **N+1 × 2 套** |

---

## 4. 建置成本 vs. 可用性分析

| Tier | 相對建置成本 | 年可用性 | 適用場景 |
|:---:|:---:|:---:|:---|
| I | 1.0× | 99.671% | 小型辦公室、非關鍵服務 |
| II | 1.3× | 99.749% | 中型企業機房 |
| **III** | **2.0~2.5×** | **99.982%** | **主流 Hyperscale AIDC 選擇** |
| IV | 3.5~4×+ | 99.995% | 金融核心系統、國防、電信交換節點 |

> **台灣 Foxconn AIDC 的策略：**
> 鴻海大型 AIDC 廠區設計以 **Tier III+** 為目標，即超越 Tier III 但不完全達到 Tier IV 的成本：
> - 電力系統達 Tier IV（2N UPS + 2N 發電機）
> - 冷卻系統採 Tier III（N+1 Chiller，但 CDU 採 2N）
> - 網路：雙路由（Tier IV 要求）
> 此策略在 99.99%+ 可用性與合理建設成本之間取得最佳平衡。

---

## 5. 常見誤解澄清

| 誤解 | 正確理解 |
|:---|:---|
| 「2N 就是 Tier IV」| 2N 是 Tier IV 的**必要條件之一**，但還需要系統獨立路由、無共用 SPOF |
| 「Tier III 可以容忍任何故障」| **Tier III 只能容忍計畫維護不停機**，非計畫故障仍可能停機 |
| 「高 Tier 一定比較好」| Tier IV 建置成本是 Tier I 的 4 倍，**過度設計是工程浪費**，需依 SLA 需求選型 |
| 「Tier 認證永久有效」| 每 3 年需 Uptime Institute 現場 re-certification，設備替換和架構修改後也需重新認證 |

---

## 6. Cross-References

- 電力備援系統：[[UPS]]、[[發電機]]、[[N+1 vs 2N vs N+2 備援架構]]
- 冷卻備援系統：[[Chiller Plant]]、[[CDU 架構與選型]]
- 基礎概念：[[Module 01 - Data Center 基礎概念]]
- 機電整合：[[Module 06 - 電力架構與機電整合]]
