---
tags: [vendors, ecosystem, TBE, procurement]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
module: "08"
---

# Module 08 - 廠商生態系統

> AIDC 競爭的本質不是設備，而是：**「誰能整合最多廠商，並讓系統穩定運作」**
> 工程師的價值：看懂每家廠商的強與弱，做出組合最佳解，而不是被業務牽著走。

## 生態系分層

| Layer | 類別 | 代表廠商 | 決定什麼 |
|-------|------|---------|---------|
| 1 | IT 設備（Heat Source）| NVIDIA、AMD、Intel | **熱密度上限（最關鍵）** |
| 2 | 機櫃/系統整合 | [[Foxconn]]、廣達、緯創、英業達、Supermicro | 機架功率密度/液冷形式 |
| 3 | 冷卻系統 | [[Vertiv]]、[[Schneider]]、[[CoolIT]] | **PUE / 能否支撐高密度** |
| 4 | 電力系統 | [[Schneider]]、[[Vertiv]]、Eaton、ABB | 可靠度（Tier）|
| 5 | DCIM/BMS | Siemens、[[Schneider]]、[[Vertiv]] | 可視化與運維 |
| 6 | EPC/SI | AECOM、Arup、中鼎、漢唐 | 能不能真的蓋出來 |

## GPU / IT 設備

| 廠商 | 產品 | 優勢 | 劣勢 |
|------|------|------|------|
| **NVIDIA（絕對主導）**| H100/H200/GB200 | 生態完整（CUDA）| 高度 Vendor Lock-in |
| AMD | MI300X/MI350 | 高記憶體、成本競爭力 | 軟體生態較弱 |
| Intel | Gaudi 2/3 | 價格/開放性 | 市占低 |

## 空冷設備廠商

| 廠商 | 強項 |
|------|------|
| **[[Vertiv]]（市場龍頭）**| Liebert 系列（[[CRAC]]/[[CRAH]]/[[In-Row Cooling|InRow]]），完整產品線 + DC 專用 |
| **[[Schneider]] Electric（APC）**| EcoStruxure + [[In-Row Cooling|InRow]]，電力 + [[DCIM]] 整合 |
| [[STULZ]]（德國）| 精密空調專家，客製化能力高，支援高精度 PID 溫控 |
| [[Rittal]] | [[In-Row Cooling|InRow]] / Edge DC / [[RDHX]] 水門 |

## 液冷設備廠商（未來 AIDC 核心戰場）

### CDU
- **[[Vertiv]]**（Liebert XDU）
- **[[CoolIT]] Systems**（冷板液冷領導者）
- **[[Asetek]]**（自研自製 Pump-on-Cold Plate 技術）
- Motivair（高階 HPC）
- [[Rittal]] (VX IT 水門解決方案)、[[Schneider]]、[[Delta]] (自研高能效 CDU)

### Cold Plate
- [[CoolIT]]、[[Asetek]]、Boyd
- **[[Foxconn]]（自研 Cold Plates 與 Smart Manifold 能力）**

### Immersion Cooling
- Submer（歐洲）、GRC（Green Revolution Cooling）
- LiquidStack、Asperitas

## 冷源系統（Chiller Plant）

| 廠商系別 | 代表廠商 | 特點 |
|---------|---------|------|
| 美系 | [[Trane]]、Carrier | 大型系統整合能力強，CVHE 超低壓機組 |
| 日系 | [[Daikin]]、三菱重工 | 效率高、穩定，磁浮壓縮機領導者 |
| 其他 | Johnson Controls（York）| 磁浮機（[[Daikin]] Turbocor、Johnson Controls）|

## 電力系統廠商

| 類別 | 主要廠商 |
|------|---------|
| UPS | [[Schneider]]、[[Vertiv]]、Eaton、[[Delta]]、ABB |
| Switchgear/Transformer | ABB、Siemens、[[Schneider]]、GE |
| 發電機 | Cummins、Caterpillar、MTU（Rolls-Royce）|

## TBE（技術投標評估）評分矩陣

以液冷 CDU 為例：

| 評分項目 | 權重 | 說明 |
|---------|------|------|
| 技術成熟度（TRL）| 20% | 是否有實際 AIDC 案例、GB200 驗證 |
| 冷卻效能（COP/熱阻抗）| 20% | 熱交換器效率、泵能耗 |
| 可靠度與備援設計 | 15% | N+1 架構、故障安全機制 |
| 維護易用性（MTTR）| 15% | 零件備貨期、本地服務支援 |
| **交期（Lead Time）** | 15% | **鴻海搶單速度極快，這項權重很高** |
| CAPEX 成本 | 10% | 追求最低價不常是最佳策略 |
| 可擴展性 | 5% | 未來密度升級空間 |

## 廠商選型核心原則

- **核心設備（UPS、Chiller）**：優先 Tier-1 廠商，不賭關鍵設備
- **液冷新興設備（CDU、Cold Plate）**：可接受新創廠商，但需有 GB200 實際驗證資料
- **不要單一廠商綁死**：核心設備至少備選兩家
- **交期是鴻海的命脈**：無法 3~6 個月內交貨，TBE 直接失分

## 未來趨勢

- NVIDIA 往「整機櫃 Solution」走（GB200 NVL72）
- 液冷廠商快速崛起（CoolIT/Submer）
- 台灣 ODM 成為核心供應鏈（[[Foxconn]]/廣達/緯創）
- 電力設備往 HVDC（高壓直流）發展
- 軟體（DCIM + AI）成為新戰場

## Cross-References

- 設備詳解：[[Module 03 - 空冷系統架構]]、[[Module 04 - 液冷系統深度解析]]
- 冷源：[[Module 05 - 冷源與冷凍機房]]
- 電力：[[Module 06 - 電力架構與機電整合]]
- Layer 5 詳解：[[DCIM]]
- 廠商選型：[[設備與廠商選型對照矩陣]]、[[Vertiv]]、[[CoolIT]]、[[Schneider]]、[[Daikin]]、[[Trane]]、[[Foxconn]]、[[Asetek]]、[[STULZ]]、[[Delta]]、[[Rittal]]
- 採購流程：TBE、RFQ 文件（參考 CTCI 經驗）

## Sources

- Notion「AIDC HVAC 學習基地」Module 08 — 廠商生態系統
