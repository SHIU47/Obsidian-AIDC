// Phase 3：ASHRAE 風格設計條件統計計算
// 讀取 pipeline/cache/ 內已快取的 10 年 hourly 資料（透過 fetch-weather.js 的
// getHourlyDataForLocation），計算冷卻/加熱設計值、極端值、度日、自然冷卻時數、
// 高濕球時數、ASHRAE 169 氣候分區（僅 Zone 0-8 數字，不做 A/B/C 濕區）。
//
// 執行：node design-conditions.js          → 跑全部 11 城市，寫 output/<id>-stats.json + all-cities-stats.json
// 執行：node design-conditions.js --test    → 只跑 taipei，印出 sanity check，不寫檔
//
// 純本地計算，讀 pipeline/cache/ 快取，不呼叫任何網路 API。同步跑完才回傳，
// 不使用背景執行（資料量約 87,600 小時/城市，Node 排序極快，全部 11 城市應在數分鐘內跑完）。

'use strict';

const fs = require('fs');
const path = require('path');

const { START_YEAR, END_YEAR, getHourlyDataForLocation } = require('./fetch-weather');
const { pws, wetBulbTemperature } = require('./psychrometrics');

const LOCATIONS_FILE = path.join(__dirname, 'locations.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

const PERCENTILE_METHOD =
  '線性內插（linear interpolation between closest ranks，等同 numpy 預設 "linear" 方法 / Excel PERCENTILE.INC）：' +
  '陣列由小到大排序後，第 p 百分位的索引 = (p/100) × (N-1)，非整數索引取相鄰兩值線性內插。';

const FREE_COOLING_ASSUMPTION =
  '水側自然冷卻（濕球 < 12.8°C）門檻假設：冷卻水塔 approach 溫差 3.9K，' +
  '對應供應約 18°C 冷卻水可直接免主機自然冷卻；此為設計假設，非量測值，實際門檻依水塔選型與 approach 而異。';

const DATA_SOURCE_DISCLAIMER =
  'Open-Meteo ERA5 reanalysis 資料，非氣象站實測值（non station-observed ASHRAE data）。' +
  '與 ASHRAE 官方氣候設計條件表（氣象站資料為主）相比，預期會有小幅差異，僅供工程初估參考。';

const EXTREME_SPREAD_LABEL =
  '10年年度極值的平均與標準差（非官方 ASHRAE n-year return period 統計方法，僅為簡易變異度參考指標）';

// ------------------------------------------------------------------
// 基礎統計工具
// ------------------------------------------------------------------

function round(n, digits) {
  if (n == null || Number.isNaN(n)) return null;
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

// 排序後陣列的第 p 百分位（p: 0-100），線性內插（見 PERCENTILE_METHOD）。
function quantile(sortedArr, p) {
  const nMinus1 = sortedArr.length - 1;
  const idx = (p / 100) * nMinus1;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  const frac = idx - lo;
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * frac;
}

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// 樣本標準差（n-1 分母）——用於 10 個年度極值這種小樣本的變異度描述。
function sampleStdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const sqSum = arr.reduce((s, v) => s + (v - m) * (v - m), 0);
  return Math.sqrt(sqSum / (arr.length - 1));
}

// ------------------------------------------------------------------
// Mean-coincident 輔助：找出主變數落在 threshold ± 0.5 內的小時索引，
// 再對「同一組小時」平均其他共存變數。
// ------------------------------------------------------------------
function coincidentIndices(primaryArr, threshold, tol) {
  tol = tol === undefined ? 0.5 : tol;
  const idxs = [];
  for (let i = 0; i < primaryArr.length; i++) {
    const v = primaryArr[i];
    if (v != null && Math.abs(v - threshold) <= tol) idxs.push(i);
  }
  return idxs;
}

function averageOverIndices(arr, idxs) {
  let sum = 0;
  let count = 0;
  for (const i of idxs) {
    const v = arr[i];
    if (v != null) {
      sum += v;
      count += 1;
    }
  }
  return count ? sum / count : null;
}

// ------------------------------------------------------------------
// 冷卻設計條件（DB / WB / DP 的 0.4% / 1% / 2%，年百分位，全 10 年小時池化）
// ------------------------------------------------------------------
function coolingDesignConditions(hourly, P_Pa) {
  const DB = hourly.temperature_2m;
  const WB = hourly.wet_bulb_temperature_2m;
  const DP = hourly.dew_point_2m;

  const dbSorted = DB.filter((v) => v != null).slice().sort((a, b) => a - b);
  const wbSorted = WB.filter((v) => v != null).slice().sort((a, b) => a - b);
  const dpSorted = DP.filter((v) => v != null).slice().sort((a, b) => a - b);

  const percentiles = [0.4, 1, 2];

  const db = {};
  const wb = {};
  const dp = {};

  for (const pct of percentiles) {
    // 冷卻設計值 = 高尾百分位：n% 設計值 = 只有 n% 的時數超過該值 → 取 (100-n) 百分位
    const dbVal = round(quantile(dbSorted, 100 - pct), 1);
    const dbIdxs = coincidentIndices(DB, dbVal, 0.5);
    db[pct] = {
      value: dbVal,
      mcwb: round(averageOverIndices(WB, dbIdxs), 1),
      coincidentHours: dbIdxs.length,
    };

    const wbVal = round(quantile(wbSorted, 100 - pct), 1);
    const wbIdxs = coincidentIndices(WB, wbVal, 0.5);
    wb[pct] = {
      value: wbVal,
      mcdb: round(averageOverIndices(DB, wbIdxs), 1),
      coincidentHours: wbIdxs.length,
    };

    const dpVal = round(quantile(dpSorted, 100 - pct), 1);
    const dpIdxs = coincidentIndices(DP, dpVal, 0.5);
    // 濕度比：dew point 直接代表當下實際水蒸氣分壓 pw = pws(Tdp)，
    // 逐時以該小時實際站壓 P 算 W，再對 coincident 小時集合取平均（比用
    // humidityRatioFromRH(T,RH,P) 簡單，且不受 RH 量測本身內插誤差影響）。
    let wSum = 0;
    let wCount = 0;
    for (const i of dpIdxs) {
      const tdp = DP[i];
      const p = P_Pa[i];
      if (tdp == null || p == null) continue;
      const pw = pws(tdp);
      const w = (0.621945 * pw) / (p - pw);
      wSum += w;
      wCount += 1;
    }
    dp[pct] = {
      value: dpVal,
      mcdb: round(averageOverIndices(DB, dpIdxs), 1),
      humidityRatio_g_per_kg: wCount ? round((wSum / wCount) * 1000, 2) : null,
      coincidentHours: dpIdxs.length,
    };
  }

  return { db, wb, dp };
}

// ------------------------------------------------------------------
// 加熱設計條件（DB 99.6% / 99%，即低尾 0.4% / 1% 百分位）
// ------------------------------------------------------------------
function heatingDesignConditions(hourly) {
  const DB = hourly.temperature_2m;
  const dbSorted = DB.filter((v) => v != null).slice().sort((a, b) => a - b);
  return {
    99.6: round(quantile(dbSorted, 0.4), 1),
    99: round(quantile(dbSorted, 1), 1),
  };
}

// ------------------------------------------------------------------
// 極端值
// ------------------------------------------------------------------
function findExtreme(arr, time, mode) {
  let bestIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v == null) continue;
    if (bestIdx === -1) {
      bestIdx = i;
      continue;
    }
    if (mode === 'max' ? v > arr[bestIdx] : v < arr[bestIdx]) bestIdx = i;
  }
  return {
    value: round(arr[bestIdx], 1),
    yearMonth: time[bestIdx].slice(0, 7),
  };
}

function perYearExtremes(arr, time) {
  const byYear = new Map();
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v == null) continue;
    const year = Number(time[i].slice(0, 4));
    if (!byYear.has(year)) byYear.set(year, { max: -Infinity, min: Infinity });
    const y = byYear.get(year);
    if (v > y.max) y.max = v;
    if (v < y.min) y.min = v;
  }
  return byYear;
}

function extremeStats(hourly) {
  const DB = hourly.temperature_2m;
  const WB = hourly.wet_bulb_temperature_2m;
  const time = hourly.time;

  const maxDB = findExtreme(DB, time, 'max');
  const minDB = findExtreme(DB, time, 'min');
  const maxWB = findExtreme(WB, time, 'max');

  const byYear = perYearExtremes(DB, time);
  const yearlyMaxes = [...byYear.values()].map((y) => y.max);
  const yearlyMins = [...byYear.values()].map((y) => y.min);

  return {
    extremeMaxDB: maxDB,
    extremeMinDB: minDB,
    extremeMaxWB: maxWB,
    yearlyExtremeSpread: {
      label: EXTREME_SPREAD_LABEL,
      maxDB: { mean: round(mean(yearlyMaxes), 1), stdDev: round(sampleStdDev(yearlyMaxes), 2) },
      minDB: { mean: round(mean(yearlyMins), 1), stdDev: round(sampleStdDev(yearlyMins), 2) },
    },
  };
}

// ------------------------------------------------------------------
// 度日（由逐日均溫算，逐日均溫 = 該日 hourly temperature_2m 平均）
// ------------------------------------------------------------------
function dailyMeansByDate(hourly) {
  const byDate = new Map();
  const time = hourly.time;
  const DB = hourly.temperature_2m;
  for (let i = 0; i < time.length; i++) {
    const t = DB[i];
    if (t == null) continue;
    const date = time[i].slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, { sum: 0, count: 0, year: Number(date.slice(0, 4)) });
    }
    const d = byDate.get(date);
    d.sum += t;
    d.count += 1;
  }
  return byDate;
}

// mode: 'HDD' → sum(max(0, base - dailyMean))；'CDD' → sum(max(0, dailyMean - base))
// 逐年加總後取 10 年平均。
function degreeDaysAvg(dailyMeans, base, mode) {
  const perYear = new Map();
  for (const d of dailyMeans.values()) {
    const dm = d.sum / d.count;
    const val = mode === 'HDD' ? Math.max(0, base - dm) : Math.max(0, dm - base);
    perYear.set(d.year, (perYear.get(d.year) || 0) + val);
  }
  const years = [...perYear.values()];
  return {
    avg: round(mean(years), 1),
    perYear: Object.fromEntries([...perYear.entries()].map(([y, v]) => [y, round(v, 1)])),
  };
}

// ------------------------------------------------------------------
// 自然冷卻時數 / 高濕球時數（10 年平均，時/年）
// ------------------------------------------------------------------
function countHoursPerYearAvg(arr, time, predicate) {
  const perYear = new Map();
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v == null) continue;
    const year = Number(time[i].slice(0, 4));
    if (!perYear.has(year)) perYear.set(year, 0);
    if (predicate(v)) perYear.set(year, perYear.get(year) + 1);
  }
  const years = [...perYear.values()];
  return round(mean(years), 1);
}

function freeCoolingHours(hourly) {
  return {
    airSideHoursPerYear: countHoursPerYearAvg(hourly.temperature_2m, hourly.time, (v) => v < 15),
    waterSideHoursPerYear: countHoursPerYearAvg(
      hourly.wet_bulb_temperature_2m,
      hourly.time,
      (v) => v < 12.8
    ),
    assumption: FREE_COOLING_ASSUMPTION,
  };
}

function highWetBulbHours(hourly) {
  return {
    over24: countHoursPerYearAvg(hourly.wet_bulb_temperature_2m, hourly.time, (v) => v > 24),
    over26: countHoursPerYearAvg(hourly.wet_bulb_temperature_2m, hourly.time, (v) => v > 26),
    over28: countHoursPerYearAvg(hourly.wet_bulb_temperature_2m, hourly.time, (v) => v > 28),
  };
}

// ------------------------------------------------------------------
// ASHRAE 169 氣候分區（Zone 0-8，數字分區，門檻見 NOTES-dev.md 第2節）
// 注意：分區表用 CDD10°C / HDD18°C（base 18，非 18.3），與 Phase 3 度日輸出的
// HDD18.3 是不同 base，勿混用。
// ------------------------------------------------------------------
function classifyAshraeZone(cdd10, hdd18) {
  if (cdd10 > 6000) return { zone: 0, rule: 'Zone 0: 6000 < CDD10°C' };
  if (cdd10 > 5000 && cdd10 <= 6000) return { zone: 1, rule: 'Zone 1: 5000 < CDD10°C ≤ 6000' };
  if (cdd10 > 3500 && cdd10 <= 5000) return { zone: 2, rule: 'Zone 2: 3500 < CDD10°C ≤ 5000' };
  if (cdd10 < 3500 && hdd18 <= 2000) return { zone: 3, rule: 'Zone 3: CDD10°C < 3500 AND HDD18°C ≤ 2000' };
  if (cdd10 <= 2500 && hdd18 > 2000 && hdd18 <= 3000)
    return { zone: 4, rule: 'Zone 4: CDD10°C ≤ 2500 AND 2000 < HDD18°C ≤ 3000' };
  if (hdd18 > 3000 && hdd18 <= 4000) return { zone: 5, rule: 'Zone 5: 3000 < HDD18°C ≤ 4000' };
  if (hdd18 > 4000 && hdd18 <= 5000) return { zone: 6, rule: 'Zone 6: 4000 < HDD18°C ≤ 5000' };
  if (hdd18 > 5000 && hdd18 <= 7000) return { zone: 7, rule: 'Zone 7: 5000 < HDD18°C ≤ 7000' };
  if (hdd18 > 7000) return { zone: 8, rule: 'Zone 8: 7000 < HDD18°C' };
  return {
    zone: null,
    rule: '無對應門檻區間（表格在 CDD10≈2500-3500 且 HDD18≈2000-3000 一帶有落差，見 NOTES-dev.md）',
  };
}

// ------------------------------------------------------------------
// 主計算流程：單一城市
// ------------------------------------------------------------------
async function computeCityStats(loc) {
  const hourly = await getHourlyDataForLocation(loc);
  const P_Pa = hourly.surface_pressure.map((hpa) => (hpa == null ? null : hpa * 100));

  const cooling = coolingDesignConditions(hourly, P_Pa);
  const heating = heatingDesignConditions(hourly);
  const extremes = extremeStats(hourly);

  const dailyMeans = dailyMeansByDate(hourly);
  const hdd183 = degreeDaysAvg(dailyMeans, 18.3, 'HDD');
  const cdd183 = degreeDaysAvg(dailyMeans, 18.3, 'CDD');
  const cdd10 = degreeDaysAvg(dailyMeans, 10, 'CDD');
  const hdd18 = degreeDaysAvg(dailyMeans, 18, 'HDD'); // 僅供 ASHRAE 169 分區使用，base 與上面的 18.3 不同

  const freeCooling = freeCoolingHours(hourly);
  const highWb = highWetBulbHours(hourly);
  const zone = classifyAshraeZone(cdd10.avg, hdd18.avg);

  return {
    id: loc.id,
    name: loc.name,
    continent: loc.continent,
    country: loc.country,
    lat: loc.lat,
    lon: loc.lon,
    dataRange: { startYear: START_YEAR, endYear: END_YEAR, totalHours: hourly.time.length },
    methodology: {
      percentileInterpolation: PERCENTILE_METHOD,
      dataSourceDisclaimer: DATA_SOURCE_DISCLAIMER,
    },
    cooling,
    heating,
    extremes,
    degreeDays: {
      hdd18_3: hdd183.avg,
      cdd18_3: cdd183.avg,
      cdd10: cdd10.avg,
    },
    freeCooling,
    highWetBulbHours: highWb,
    ashraeZone: {
      ...zone,
      cdd10_for_zone: cdd10.avg,
      hdd18_for_zone: hdd18.avg,
    },
  };
}

// ------------------------------------------------------------------
// WB 交叉驗證：native wet_bulb_temperature_2m vs. wetBulbTemperature(T,RH,P)
// ------------------------------------------------------------------
function crossCheckWetBulb(hourly, loc, sampleCount) {
  const n = hourly.time.length;
  const diffs = [];
  const details = [];
  for (let k = 0; k < sampleCount; k++) {
    const i = Math.floor(Math.random() * n);
    const T = hourly.temperature_2m[i];
    const RH = hourly.relative_humidity_2m[i];
    const P = hourly.surface_pressure[i] * 100; // hPa → Pa
    const nativeWB = hourly.wet_bulb_temperature_2m[i];
    if (T == null || RH == null || P == null || nativeWB == null) continue;
    let computed;
    try {
      computed = wetBulbTemperature(T, RH, P);
    } catch (e) {
      continue;
    }
    const diff = Math.abs(computed - nativeWB);
    diffs.push(diff);
    details.push({ loc: loc.id, time: hourly.time[i], T, RH, nativeWB: round(nativeWB, 2), computedWB: round(computed, 2), diff: round(diff, 3) });
  }
  return { diffs, details };
}

// ------------------------------------------------------------------
// main
// ------------------------------------------------------------------
async function main() {
  const testOnly = process.argv.includes('--test');
  const locations = JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf-8'));

  if (testOnly) {
    const taipei = locations.find((l) => l.id === 'taipei');
    console.log(`=== 測試：${taipei.name} (${taipei.id}) ===`);
    const stats = await computeCityStats(taipei);
    console.log(JSON.stringify(stats, null, 2));
    const hourly = await getHourlyDataForLocation(taipei);
    const { diffs, details } = crossCheckWetBulb(hourly, taipei, 20);
    console.log('--- WB 交叉驗證（taipei, 20 抽樣） ---');
    console.log(details);
    console.log('平均絕對誤差(°C):', round(mean(diffs), 4), '最大誤差(°C):', round(Math.max(...diffs), 4));
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allStats = {};
  const allWbDiffs = [];
  const wbCheckDetails = [];

  for (const loc of locations) {
    console.log(`計算設計條件：${loc.name} (${loc.id}) ...`);
    const hourly = await getHourlyDataForLocation(loc);
    const stats = await computeCityStats(loc);
    allStats[loc.id] = stats;

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${loc.id}-stats.json`),
      JSON.stringify(stats, null, 2),
      'utf-8'
    );

    // 每城市抽 2 個小時做 WB 交叉驗證，11 城市共約 22 筆
    const { diffs, details } = crossCheckWetBulb(hourly, loc, 2);
    allWbDiffs.push(...diffs);
    wbCheckDetails.push(...details);

    console.log(`  完成，寫入 ${loc.id}-stats.json`);
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-cities-stats.json'),
    JSON.stringify(allStats, null, 2),
    'utf-8'
  );
  console.log(`已寫入 all-cities-stats.json（共 ${Object.keys(allStats).length} 城市）`);

  console.log('\n=== WB 交叉驗證（native wet_bulb_temperature_2m vs. wetBulbTemperature() 計算值） ===');
  console.log(`抽樣數：${allWbDiffs.length}`);
  console.log(`平均絕對誤差(°C)：${round(mean(allWbDiffs), 4)}`);
  console.log(`最大誤差(°C)：${round(Math.max(...allWbDiffs), 4)}`);
  console.log(JSON.stringify(wbCheckDetails, null, 2));

  console.log('\n=== 驗證摘要 ===');
  const taipei = allStats['taipei'];
  const singapore = allStats['singapore'];
  const london = allStats['london'];
  console.log('台北 0.4% 冷卻 DB:', taipei.cooling.db['0.4'].value, '(期望 33-36°C)');
  console.log('台北 0.4% 冷卻 WB:', taipei.cooling.wb['0.4'].value, '(期望 27-29°C)');
  console.log('新加坡 CDD10:', singapore.degreeDays.cdd10, '(期望 >7000)');
  console.log('新加坡 HDD18.3:', singapore.degreeDays.hdd18_3, '(期望 ≈0)');
  console.log('新加坡 ASHRAE zone:', singapore.ashraeZone.zone, '(期望 0 或 1)');
  console.log('倫敦 CDD18.3:', london.degreeDays.cdd18_3, '(期望 <400)');
  console.log('倫敦 HDD18.3:', london.degreeDays.hdd18_3, '(期望 >1500)');
}

module.exports = {
  quantile,
  coincidentIndices,
  averageOverIndices,
  computeCityStats,
  classifyAshraeZone,
  degreeDaysAvg,
  dailyMeansByDate,
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
