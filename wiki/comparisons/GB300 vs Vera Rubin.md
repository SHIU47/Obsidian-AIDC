---
tags: [comparison, NVIDIA, GPU, Blackwell, Rubin, cooling, rack-architecture, AIDC]
sources: ["[[GB300與Blackwell Ultra機櫃架構]]", "[[Vera Rubin 機櫃物理與電力架構]]", "[[NVIDIA GPU 晶片演進與散熱限值]]"]
created: 2026-06-17
updated: 2026-06-17
---

# 系統對比：GB300 (Blackwell Ultra) vs Vera Rubin

GB300 與 Vera Rubin 代表 NVIDIA 連續兩個世代的 AI 超級機架（NVL72 架構），兩者在晶片工藝、機櫃電力密度與冷卻設計哲學上存在**世代性的系統跳躍**，而非漸進式升級。本頁從架構、冷卻與設計整合三個維度進行橫向比較。

---

## 1. 晶片架構對比

| 對比項目 | GB300 (Blackwell Ultra) | Vera Rubin |
|:---|:---|:---|
| **GPU 型號** | B300 | Rubin (V100) |
| **CPU 型號** | Grace CPU | Vera CPU（88 核 Olympus） |
| **製程節點** | 4nm (CoWoS-L) | **3nm** (CoWoS-R) |
| **記憶體** | 288GB **HBM3e**（16-hi 堆疊） | **HBM4**（3D TSV 矽穿孔直連） |
| **GPU TDP** | 1,200 W+ | **1,500 W+** |
| **互連架構** | NVLink 5 | **NVLink 6（3.6 TB/s 雙向）** |
| **網路晶片** | ConnectX-8 | **ConnectX-9 SuperNIC（1.6 Tb/s）** |
| **封裝特徵** | 雙 Compute Die，水平整合 | CoWoS-R 重新設計，HBM4 介面直連晶粒 |

### 架構演進的核心差異

**GB300** 是 Blackwell 架構的「Ultra」強化版，核心設計未變：
- 維持雙運算晶粒（Dual Compute Die）的平面封裝
- HBM3e 疊高至 16-hi，提升頻寬但讓熱阻更難處理
- 主要改良點在於記憶體容量（+50%）與頻寬（+30%）

**Vera Rubin** 是架構層級的重新設計：
- CoWoS-R 重新排布中介層，HBM4 透過 TSV（矽穿孔）直連 Compute Die，消除傳統焊球瓶頸
- 3nm 製程使電晶體密度倍增，但漏電流管控要求更嚴苛（$T_j \le 80^\circ\text{C}$ 不得鬆動）
- Rubin Ultra 版更走向 **3-Die 多晶片整合**，單架機往 600 kW 推進

---

## 2. 冷卻技術對比

這是兩個平台**差異最鮮明**的維度。

| 對比項目 | GB300 (Blackwell Ultra) | Vera Rubin |
|:---|:---|:---|
| **液冷供水溫度（進）** | **40°C**（設計基準）/ 45°C（允許上限） | **45°C**（官方標準化） |
| **液冷回水溫度（出）** | ≈ 55°C（依流量而異） | **65°C**（官方標準化） |
| **Chiller 需求** | 過渡期：**部分機架仍可能需要 Chiller** | **100% Chiller-Free**（全球所有氣候） |
| **溫差 ΔT（進出水）** | ≈ 10~15°C | **≈ 20°C**（ΔT 更大，CDU 泵功耗更低） |
| **先前世代（GB200）對比** | GB200 要求 ≤ 17°C 低溫供水 | — |
| **Free Cooling 適用性** | 熱帶地區（台灣、新加坡）仍有邊界情況 | **全球 100% 全年乾冷器直排，不需冷凍機** |
| **PUE 目標** | 1.10 ~ 1.20 | **≤ 1.10（WUE = 0 目標）** |

### 冷卻世代定位

```
世代位置：
  GB200 ──────────────────────────────── GB300 ──────────── Vera Rubin
  ≤17°C 低溫冷水                    40°C 溫水（過渡）        45°C 溫水（標準化）
  Chiller 全年 100%              Chiller 部分仍存在        Chiller 完全消除
  PUE ≈ 1.20~1.30               PUE ≈ 1.10~1.20          PUE ≤ 1.10
```

> **GB300 是「暖身世代」**：技術上已能支援 45°C，但廠商實作存在差異（Supermicro 雙密度 16 節點方案退回 35°C），部分 OSFP 模組與儲存組件仍走氣冷需較低水溫。Vera Rubin 是真正意義上的 **全面溫水標準化**，消除了所有不一致性。

### 對 CDU 設計的影響

| CDU 設計項目 | GB300 | Vera Rubin |
|:---|:---|:---|
| **露點安全裕度** | 需要（供水 40°C 仍須防結露，尤其混合空冷場景） | **基本解除結露風險**（45°C 遠高於任何機房露點） |
| **一次側冷源** | 冷卻塔 / 乾冷器（仍需 Chiller 備援） | **純乾冷器（Dry Cooler）即可** |
| **換熱器 ΔT 設計** | 偏保守，需預留低溫段設計空間 | 換熱 ΔT 更大，換熱器可更緊湊高效 |

---

## 3. 機櫃設計面對比

| 對比項目 | GB300 (Blackwell Ultra) | Vera Rubin |
|:---|:---|:---|
| **單機櫃額定功耗** | **130 ~ 140 kW** | **190 ~ 230 kW**（Ultra：~600 kW） |
| **配電架構** | DC Busbar，54V DC | DC Busbar，**48V/50V DC，1,400A ~ 2,000A** |
| **互連中板** | NVLink 5 Cable | **無電纜銅纜中板（Cable Cartridge Midplane）** |
| **節點數量** | 72 GPU + 36 Grace CPU（NVL72） | 72 Rubin GPU + 36 Vera CPU（NVL72） |
| **Switch Tray 數量** | 9 NVLink Switch Trays | 9 NVLink Switch Trays（液冷） |
| **Power Shelf** | 電源機架整合 | **6~8 組 33 kW Power Shelf**（×6 模組） |
| **盲插公差** | 徑向 ±1.5 mm（UQD 無滴漏接頭） | 同規格 UQD（Flat-Face Dripless） |
| **Tray 重量** | 60~70 kg | **60~80 kg**（HBM4 + MCCP 組件更重） |

### Midplane 設計的世代跳躍

**GB300** 仍依賴實體 NVLink 線纜（Cable）在 Compute Tray 與 Switch Tray 間連接，機櫃內仍有線纜管理需求。

**Vera Rubin** 引入 **Cable Cartridge Midplane（無電纜銅纜中板）**：
- 所有 Compute Tray 與 Switch Tray 推入後，直接透過後部 Blind-mate 高速接頭插入中板
- 中板內部集成精密高頻銅導線（或光纖），實現 72 顆 GPU 之間 $3.6 \text{ TB/s}$ 全矩陣互連
- 徹底消除線纜對排風風道的阻礙，也大幅降低 MTTR（維護時間）

---

## 4. 總覽：一句話定位

| 平台 | 核心定位 |
|:---|:---|
| **GB300** | Blackwell 架構的「Ultra」強化版，**溫水冷卻的起點**，仍處技術過渡期，部分機架實作尚不統一 |
| **Vera Rubin** | 全新架構世代，**溫水冷卻的終點與標準化**，Chiller 徹底消除，機櫃整合度跳升一個數量級 |

---

## 5. 對 AIDC 設計選型的影響

| 設計決策 | 建議 |
|:---|:---|
| **新建機房冷源選型** | 若確定部署 Vera Rubin，可直接規劃純乾冷器廠房，省去 Chiller 機房與冷水管 |
| **現有 GB200 機房改建 GB300** | 需確認現有 CDU 二次側可否升溫至 40°C，並評估混合氣冷組件的管理方案 |
| **Busbar 容量預留** | Rubin NVL72 需支援 1,400~2,000A DC 電流，建議 Busbar 預留至少 20% 裕度 |
| **防結露策略** | GB300 部署仍需完整的露點追蹤邏輯；Vera Rubin 45°C 供水後結露風險大幅降低 |

---

## Cross-References

- 個別平台詳細解析：[[GB300與Blackwell Ultra機櫃架構]]、[[Vera Rubin 機櫃物理與電力架構]]
- 晶片演進與散熱限值：[[NVIDIA GPU 晶片演進與散熱限值]]
- 溫水冷卻技術完整解析：[[高溫冷卻液與溫水冷卻技術]]
- CDU 水路架構：[[液冷系統 - CDU 架構]]
- 盲插快接：[[快速接頭]]
- 配電架構：[[PDU與電力引線]]、[[Busbar 匯流排]]
