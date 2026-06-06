---
tags: [concept, AI-workload, thermal-profile, GPU, power-management, training, inference]
sources: ["[[GB200 NVL72 冷卻需求]]", "[[Vera Rubin 機櫃物理與電力架構]]", "[[Cold Plate]]"]
created: 2026-06-06
updated: 2026-06-06
---

# AI 工作負載熱特性 (AI Workload Thermal Profile)

AIDC 的冷卻系統設計不能只看硬體規格上的 **TDP（Thermal Design Power）**，還必須理解 AI **工作負載的動態熱行為**。Training 和 Inference 的功耗模式截然不同，而瞬態功率尖波（Power Spike）對液冷系統的動態響應設計有著決定性的影響。

---

## 1. Training vs. Inference 的功耗差異

### 訓練（Training）— 接近 100% TDP 的持續高功耗

大型語言模型（LLM）訓練是最極端的熱負載場景：

- **GPU 使用率**：持續 95~100%（矩陣乘法 GEMM 運算幾乎不間斷）
- **平均功耗**：約 **TDP 的 90~100%**
- **持續時間**：GPT-4 等級訓練可連續運行 **數週至數月**
- **熱負載穩定性**：波動幅度小，是 CDU / Chiller 設計的**穩態設計點**

> 以 GB200（TDP ~1000W/GPU）為例：72 顆 GPU 持續訓練時，機架功耗接近 **100 kW**（有效功耗，含 CPU/網路/電源損耗後實際接近 120 kW）。

### 推論（Inference）— 高動態波動的間歇功耗

AI 服務推論（如 ChatGPT 每次對話）的功耗特性完全不同：

- **GPU 使用率**：隨請求量波動，**30~80% 平均**
- **平均功耗**：約 **TDP 的 40~70%**
- **波動周期**：秒級或分鐘級（使用者請求量隨時間變化）
- **熱負載動態性**：對 CDU 的流量控制系統提出更高要求（需快速響應 DP 控制）

**工程意義：**

| 場景 | 設計重點 |
|:---|:---|
| **Training 專用機房** | 穩態最高負載設計，CDU 可在恆定設定點運行，儲冷罐緩衝需求小 |
| **Inference 服務機房** | CDU 變頻泵需支援快速流量調節，儲冷罐容量需覆蓋功耗從 0 到峰值的過渡期 |
| **混合機房** | 最複雜，需要精確的工作負載排程（Scheduling）配合廠務側預測性控制 |

---

## 2. GPU 瞬態功率尖波（Power Spike / Power Transient）

### 現象

在 GPU 開始執行大型矩陣乘法（GEMM Kernel Launch）的瞬間，電流需求從待機狀態**在 < 1 毫秒內**急劇上升，造成瞬態功率尖波：

$$P_{peak} = P_{TDP} \times k_{spike}$$

| GPU 世代 | TDP | 實測峰值尖波 | $k_{spike}$ |
|:---|:---:|:---:|:---:|
| A100（80GB）| 400W | ~450W | ~1.12× |
| H100（SXM5）| 700W | ~850W | ~1.21× |
| **B200（GB200）**| **~1000W** | **~1,200~1,300W** | **~1.2~1.3×** |

### 對液冷系統的挑戰

1. **CDU 二次側壓差波動**：GPU 功率突增 → Cold Plate 內液體吸熱急劇增加 → 出水溫度短暫升高 → DP 感測器偵測壓差變化 → VFD 泵升速響應
   - **響應延遲**：從感測器偵測到泵達到新穩定轉速，典型需要 **5~15 秒**
   - 在這段延遲期間，GPU 結溫（Junction Temperature）可能短暫升高 **5~10°C**

2. **儲冷罐的緩衝角色**：[[儲冷罐]] 的熱慣性在這 5~15 秒響應過渡期內，提供臨時的熱緩衝，防止 GPU 因短暫過熱觸發熱節流（Thermal Throttle）

3. **PSU 電源輸出響應**：Vera Rubin 的 33 kW PSU 模組需支援 < 1 ms 的電流瞬態響應，確保電壓不因負載尖波而下垂（Voltage Droop）

### 設計裕度（Design Margin）

> **AIDC 工程原則：** CDU 容量設計不以**平均功耗**而以**設計功耗 = TDP × 1.2 × 1.1** 為基準：
> - 1.2：系統總體熱負載裕度（冷板效率非 100%，管路、泵等額外熱源）
> - 1.1：Power Spike 動態過載裕度

---

## 3. 熱節流（Thermal Throttling）機制

### GPU 熱保護層級

NVIDIA GPU 的熱保護分為三個層級（以 Hopper/Blackwell 架構為例）：

| 層級 | 觸發條件 | GPU 動作 | 算力損失 |
|:---:|:---|:---|:---:|
| **Slow Down（減速）** | GPU Core Tj > 83°C | 自動降低核心頻率（GPU Boost 退出）| ~5~15% |
| **Throttle（節流）** | Tj > 87°C | 進一步降頻，降低功耗 | ~20~40% |
| **HBM Thermal Limit** | HBM Tj > 85°C | 刷新率加倍，大幅降頻 | > 40% |
| **Emergency Shutdown** | Tj > 105°C（核心） | 強制斷電保護 | 100%（停機）|

### 工程影響

以 1,000 台 GB200 訓練集群為例，若因液冷設計裕度不足導致 GPU 普遍 Thermal Throttle：

$$\text{算力損失} = 1000 \text{ GPU} \times 120 \text{ kW/rack} \times 10\% \text{ throttle} = 12\text{ MW 等效算力}$$

> 按 H100 算力售價約 NTD 100,000/GPU·月，1,000 顆 GPU 損失 10% 算力 = **每月損失 NTD 1,000 萬**的算力收益。因此，充足的液冷設計裕度是 **直接的財務投資回報**。

---

## 4. Power Capping 與廠務協調

### nvidia-smi Power Capping

NVIDIA GPU 支援透過 `nvidia-smi -i [GPU_ID] -pl [WATT]` 指令設定功率上限：

| Power Cap 設定 | 功耗限制 | 算力保留 | 典型應用場景 |
|:---:|:---:|:---:|:---|
| TDP 100% | ~1000W (B200) | 100% | 有足夠 CDU 容量 |
| TDP 80% | ~800W | ~87% | CDU 容量臨界或冬季節能 |
| TDP 60% | ~600W | ~73% | 廠務電力限制（需求管理）|

**廠務與 IT 協調（Cooling-aware Scheduling）：**
- 現代 AI 雲（如 AWS、Google Cloud）已開始實施 **Power-Temperature Co-management**
- DCIM 系統即時監控 CDU 回水溫度 → 若回水溫度超標，自動透過管理平台下令降低 GPU Power Cap
- Vera Rubin 平台的 BMC（基板管理控制器）支援 OCP（開放計算專案）標準的遠端功率管理介面

---

## 5. 工作負載熱特性與冷凍機組容量計算的關係

傳統 Chiller 選型以**全年最大設計熱負載**為基準，但 AI 推論機房的峰值使用率可能只在部分時段出現：

- **訓練機房**：按峰值設計，Chiller 全年幾乎全載運行 → 磁浮冷凍機的高 COP 優勢難以發揮
- **推論機房**：平均負載率 40~60%，日夜差異明顯 → **磁浮冷凍機的部分負載高 COP** 優勢顯著（50% 負載時 COP = 8.0，見 [[磁浮式冷凍機]]）

---

## 6. Cross-References

- GPU 平台規格：[[GB200 NVL72 冷卻需求]]、[[Vera Rubin 機櫃物理與電力架構]]
- CDU 動態響應設計：[[液冷系統 - CDU 架構]]（恆定壓差 DP 控制）
- 熱緩衝機制：[[儲冷罐]]
- HBM 熱限制：[[HBM與晶片級光通訊熱管理]]
- 部分負載 COP 優勢：[[磁浮式冷凍機]]
