---
tags: [tool, DCIM, BMS, monitoring, operations]
sources: ["[[AIDC HVAC 學習基地 - Notion]]"]
created: 2026-05-20
updated: 2026-05-20
---

# DCIM / BMS（資料中心基礎設施管理）

**DCIM（Data Center Infrastructure Management）** 和 **BMS（Building Management System）** 是 AIDC 的「神經系統」——把電力、冷卻、IT 三大系統的即時數據整合到單一平台，實現可視化監控、異常告警與能效優化。在 AIDC 生態系分層中屬於 **Layer 5**，決定運維品質。

## DCIM vs BMS 定位

| 項目 | BMS | DCIM |
|------|-----|------|
| 全名 | Building Management System | Data Center Infrastructure Management |
| 監控範圍 | 建築機電設備（HVAC、電力、消防、門禁）| IT 基礎設施（伺服器、機架、PDU）+ 機電設備 |
| 主要用戶 | 設施/機電工程師 | IT 運維 + 設施工程師 |
| 數據精細度 | 系統級（Chiller、AHU）| 設備級（每台伺服器、每個 PDU 插座）|
| 歷史 | 傳統建築管理系統 | AIDC 時代發展，整合 BMS |

> 實務上，現代 DCIM 平台（如 Schneider EcoStruxure、Vertiv Environet）已把 BMS 功能吸收整合。**兩者在 AIDC 語境中常互換使用。**

## 核心功能

### 1. 即時監控儀表板

| 監控對象 | 監控參數 |
|---------|---------|
| Chiller、CDU | 供/回水溫度、流量、COP |
| CRAH / In-Row Cooling | 送/回風溫度、風量、閥位 |
| 機架 | 進氣溫度、功耗（kW）、PDU 電流 |
| UPS | 電池電量、輸出電流、輸入/輸出電壓 |
| 發電機 | 啟動狀態、燃油存量、輸出功率 |
| 冷卻水塔 | 出水溫度、風扇轉速 |

### 2. 告警與事件管理

- 設備參數超出閾值 → 自動告警（Email、SMS、On-call 系統）
- 告警分級（Critical / Warning / Info）
- 歷史事件記錄，供 RCA（Root Cause Analysis）

### 3. PUE 即時計算與趨勢分析

$$PUE_{即時} = \frac{設施總用電（kW）}{IT\ Load（kW）}$$

- 識別 PUE 惡化時段（夏季高溫、節假日低負載）
- 與 Free Cooling 可用性關聯分析
- 長期趨勢報表供業主與 ESG 報告使用

### 4. 容量管理（Capacity Planning）

- 機架層級：哪個機架還有空間/電力/冷卻容量？
- 機房層級：未來 6 個月 IT Load 成長預測
- 預警：在容量耗盡前提醒擴充或遷移

### 5. 能效優化自動化

較先進的 DCIM 平台（含 AI 模組）可：
- 根據 IT Load 動態調整 Chiller 台數與 CRAH 風量
- 預測性維護：偵測設備性能衰退趨勢，在故障前預警
- 冷卻水溫度最佳化：在不超過 ASHRAE 上限的前提下，自動調高供水溫度提升 COP

## AIDC 典型架構

```
感測器層（Sensors）
溫度計、流量計、電表、壓力表
↓
控制層（Controllers）
PLC、BACnet/Modbus 閘道
↓
【DCIM 平台（Server / Cloud）】
數據整合、視覺化、告警、分析
↓
運維人員（Operations）/ 自動化控制迴路
```

## 通訊協定

| 協定 | 主要用途 |
|------|---------|
| **BACnet** | HVAC 設備（Chiller、CRAH、冷卻塔）標準協定 |
| **Modbus TCP/RTU** | UPS、PDU、發電機等電力設備 |
| **SNMP** | IT 設備（伺服器、網路設備）|
| **IPMI / Redfish** | 伺服器 BMC（Board Management Controller）|
| OPC-UA | 工業設備整合 |

## 代表廠商與平台

| 廠商 | 平台 | 特點 |
|------|------|------|
| **Schneider Electric** | EcoStruxure IT | 電力 + 冷卻整合，市場佔有率最高 |
| **Vertiv** | Environet Alert | 強於冷卻設備監控（自家 Liebert 產品）|
| **Siemens** | Desigo CC | 傳統 BMS 領導廠商，大型建築強項 |
| Nlyte（Broadcom）| Nlyte DCIM | IT 容量管理專精 |
| Sunbird | dcTrack | 中小型 AIDC，易部署 |

## Cross-References

- 生態系定位：[[Module 08 - 廠商生態系統]]（Layer 5）
- 監控對象：[[Chiller Plant]]、[[CDU 架構與選型]]、[[UPS]]、[[發電機]]
- 核心指標：[[PUE 計算]]（DCIM 是 PUE 即時計算的數據來源）
- 標準：[[ASHRAE TC 9.9 Data Center 溫濕度標準]]（DCIM 設定溫度告警閾值的依據）
