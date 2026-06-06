---
tags: [equipment, power, UPS, electrical, reliability, modular-UPS, STS, eco-mode]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-06-06
---

# UPS（不斷電系統）

**UPS（Uninterruptible Power Supply，不斷電系統）** 是 AIDC 電力路徑中位於市電與 IT 設備之間的緩衝保護設備，在市電中斷時維持供電，直到發電機接手。

## 三種 UPS 類型

| 類型 | 切換時間 | 運作原理 | AIDC 適用性 |
|------|---------|---------|------------|
| **Online Double Conversion** | **0 ms（真正零中斷）**| 市電 → AC/DC → 電池 → DC/AC → 負載，始終走電池路徑 | ✅ **唯一選擇** |
| Line Interactive | 2~4 ms | 平時旁路供電，市電異常才切換 | ⚠️ 有中斷風險 |
| Offline（Standby）| 10~20 ms | 平時旁路，中斷後才接上 UPS | ❌ 伺服器 PSU 電容撐不住 |

> **為什麼只能選 Online Double Conversion？** 伺服器 PSU 內部電容只能撐住 8~20 ms，Line Interactive 的 2~4 ms 切換仍有部分設備當機風險；Offline 的 10~20 ms 基本確定讓設備重啟。

## 容量計算

$$UPS_{kVA} = \frac{IT\ Load\ (kW)}{UPS\ 輸出\ PF}$$

> ⚠️ 分母使用 **UPS 輸出 PF（通常 0.9）**，不是伺服器的 PF（0.92~0.95）！

| IT Load | UPS 輸出 PF | UPS 需求容量 |
|---------|-----------|------------|
| 1 MW | 0.9 | **1.11 MVA** |
| 10 MW | 0.9 | 11.1 MVA |
| 100 MW | 0.9 | 111 MVA |

## 電池技術比較

| 技術 | 體積（相對）| 壽命 | 充電時間 | 重量 | TCO |
|------|-----------|------|---------|------|-----|
| 鉛酸（VRLA）| 基準（100%）| 3~5 年 | 8~12 小時 | 重 | 高 |
| **鋰電池（LiFePO4）**| **小 40%** | **10~15 年** | **1~2 小時** | 輕 40% | 低 |

**工程意涵（100 MW AIDC 為例）：**
- 鉛酸：約 800 噸電池重量
- 鋰電池：約 320 噸，少 480 噸 → 建築結構荷重節省數千萬元
- LiFePO4 無熱失控風險（相比 NMC 鋰電池），安全性高

## 在電力路徑中的位置

```
台電高壓（161kV/69kV）
↓
高壓變電站 → 降壓變壓器
↓
主配電盤（MSB）
↓
【UPS】← 電池（Buffer）
↓
PDU / RPP
↓
Rack（IT Load）
```

## 備援架構

| 架構 | 說明 | 對應 Tier |
|------|------|---------|
| N+1 | 多一台備援，任一故障不影響供電 | Tier II~III |
| **2N（A/B Feed）**| 兩套完全獨立 UPS，各自承載 100% | **Tier III~IV** |

GB200 NVL72 機架內建雙 PSU，同時接 A Feed UPS 與 B Feed UPS，任一路中斷設備不停機。

## 與冷卻系統的關係

- Chiller 也需要 UPS 或緊急電源（備用電路），確保市電中斷時 Chiller 不立即停機
- UPS 切換那 30 秒（到發電機接手），Chiller 的冷卻慣性（蓄冷槽）必須能撐住
- CDU 二次側儲冷罐提供額外 10~30 分鐘緩衝

## 代表廠商

- **Schneider Electric**（APC Smart-UPS、Symmetra 系列）
- **Vertiv**（Liebert EXL S1、APM 系列）
- **Eaton**（9395、93PM 系列）
- ABB（PowerWave 系列）

## 模組化 UPS（Modular UPS）架構

傳統大型 UPS（如 500 kVA 一體機）的缺點：
- 整機故障 → 整個 UPS 系統當機
- 擴容需購買更大容量新機，舊機報廢

**模組化 UPS** 的設計哲學：

```
[UPS 機架（Empty Frame，1~2U 管理模組）]
   ├─ Power Module 1（25 kVA / 50 kVA）
   ├─ Power Module 2
   ├─ Power Module 3
   ├─ ...（按需插入，最多 N 個）
   └─ Power Module N+1（備援模組）
```

- 每個 Power Module 可熱插拔（Hot-swappable）
- 任一模組故障，其餘模組繼續供電，不停機更換
- 擴容只需購買額外模組，舊框架繼續使用
- **代表產品：** Delta Modulon DPH、Vertiv Liebert APM、Schneider Galaxy VM

## 靜態轉換開關（STS, Static Transfer Switch）

**STS** 位於 A/B Feed 雙路電源的末端，確保負載能在 < 4 ms 內（甚至 < 1 ms）無感切換至備援電源路徑：

```
[UPS A Output]──┐
                ├──[STS]──→ [PDU / IT 設備]
[UPS B Output]──┘
（STS 持續監測兩路電源品質，品質差的路切換至品質好的路）
```

與 ATS（機械式）的差異：
| 項目 | ATS（機械接觸器）| STS（SCR 電子開關）|
|:---|:---:|:---:|
| 切換時間 | 20~100 ms | **< 4 ms（一般）< 1 ms（高速）**|
| 切換衝擊 | 有電弧、機械磨損 | 無機械接觸，無電弧 |
| 成本 | 低 | 高 |
| 適用場景 | 市電 / 發電機切換 | **A/B Feed UPS 末端切換** |

## Eco-Mode（節能旁路模式）的折衷分析

大型 UPS 提供 **Eco-Mode** 選項，讓負載旁路市電直接供電，省去整流器 / 逆變器的電力損耗（效率提升 2~5%）：

| 項目 | Online Double Conversion | Eco-Mode（旁路）|
|:---|:---:|:---:|
| 效率 | 94~97% | **98~99%** |
| 切換至電池時間 | **0 ms** | 2~8 ms（需切換）|
| 諧波隔離 | **完全隔離** | 無隔離，市電諧波直通 |
| 電壓失真保護 | **完全保護** | 無保護 |

> **AIDC 工程建議：** 高密度 GPU 機房不建議使用 Eco-Mode。伺服器 PSU 雖然電容可支撐 2~8 ms，但在大型叢集中，即便微小的電壓下垂也可能觸發部分 PSU 過流保護，導致節點暫時下線，影響訓練任務。Eco-Mode 適合電力品質穩定、對 IT 設備保護要求較低的非關鍵負載區域。

## Cross-References

- 電力系統：[[Module 06 - 電力架構與機電整合]]
- 電力品質：[[電力品質與諧波]]（Online Double Conversion 的諧波隔離）
- 備援切換：[[發電機]]（發電機在 UPS 供電期間啟動）
- 液冷緩衝：[[CDU 架構與選型]]（儲冷罐配合 UPS 供電中斷）
- 中壓電力引入：[[中壓電力引入]]（UPS 上游架構）
- 備援架構選型：[[N+1 vs 2N vs N+2 備援架構]]
- 效率計算：[[PUE 計算]]（UPS 損耗納入 PUE）
- 廠商：[[Schneider]]、[[Vertiv]]、[[Delta]]
