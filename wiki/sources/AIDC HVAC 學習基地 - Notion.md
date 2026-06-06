---
tags: [source, notion, learning, primary-source]
created: 2026-05-20
updated: 2026-05-20
type: primary-source
---

# AIDC HVAC 學習基地 - Notion

東旭（Shiu）建立的 AIDC HVAC 系統性學習筆記，收錄 Module 01~08 的完整學習記錄與自我測驗結果。本 wiki 的原始資料來源。

## 涵蓋模組

| 模組 | 主題 | 完成日期 | 測驗分數 |
|------|------|---------|---------|
| [[Module 01 - Data Center 基礎概念]] | DC 定義、Tier、PUE、AI DC vs 傳統 DC | 2026-04-22 | 90/100 |
| [[Module 02 - AIDC 熱負荷與冷卻需求]] | 熱量換算、計算鏈、設計裕度 | 2026-04-27 | 93/100 |
| [[Module 03 - 空冷系統架構]] | CRAC/CRAH、熱通道封閉、RDHX | 2026-04-28 | 91/100 |
| [[Module 04 - 液冷系統深度解析]] | DLC Cold Plate、CDU、TIM、浸沒式 | 2026-04-29 | 92/100 |
| [[Module 05 - 冷源與冷凍機房]] | Chiller、冷卻塔、Free Cooling、LMTD | 2026-04-30 | 94/100 |
| [[Module 06 - 電力架構與機電整合]] | kW/kVA、UPS、發電機、A/B Feed | 2026-05-01 | 93/100 |
| [[Module 07 - 設計計算實務]] | 設計流程、CFD 驗證、Boss 關 | 2026-05-06 | 93/100 |
| [[Module 08 - 廠商生態系統]] | 廠商分層、TBE 評分矩陣 | — | — |

## 主要測驗錯誤修正記錄

| 模組 | 錯誤觀念 | 正確觀念 |
|------|---------|---------|
| M02 | 流量計算需除以 3,600 | Q 用 kW 計算，結果直接是 kg/s |
| M03 | 空間距離是進氣溫度偏高的主因 | Hot Air Recirculation 才是主因 |
| M03 | ASHRAE 量測點在排氣口 | 量測點在機架**進氣口** |
| M04 | TIM 只是輔助材料 | TIM 消除 Cold Plate 與 GPU Die 間的 0.026 W/m·K 空氣間隙，是關鍵 |
| M04 | 儲冷罐只有緩衝功能 | 三大功能：熱慣性緩衝 + 穩壓穩流 + 排氣補水 |
| M05 | 磁浮式冷凍機是磁浮螺桿 | 磁浮的是**轉軸軸承**，消除摩擦 |
| M05 | Chiller 台數直接用 IT Load 算 | 必須先乘設計裕度 1.2，再換算 RT |
| M06 | UPS kVA = IT Load ÷ 伺服器 PF | UPS kVA = IT Load ÷ **UPS 輸出 PF（0.9）** |
| M07 | CFD 在最後驗收階段做 | CFD 在**設備採購前**完成 |

## 與 Engineering-Wiki 的關係

Notion 學習基地保存**原始學習記錄**（含錯誤、修正、測驗），Engineering-Wiki 將知識**重組為可查詢的結構化頁面**，互為表裡。

本 wiki 所有 `module: "xx"` 概念頁面的原始來源均為此 Notion 學習基地。
