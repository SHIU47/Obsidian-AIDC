// 抓取各地點過去10個完整年度的歷史天氣資料（Open-Meteo Archive API，免費、不需 API key）
// 執行：node fetch-weather.js
// 輸出：直接注入 ../index.html 的 WEATHER_DATA 標記區塊（單一檔案，Obsidian HTML Viewer 才能載入）

const fs = require('fs');
const path = require('path');

const LOCATIONS_FILE = path.join(__dirname, 'locations.json');
const INDEX_FILE = path.join(__dirname, '..', 'index.html');
const NOTES_ROOT = path.join(__dirname, '..', '..', '..', '天氣統計'); // vault 根目錄下的筆記樹：天氣統計/洲/國家/城市.md
const CACHE_DIR = path.join(__dirname, 'cache'); // hourly 原始資料快取：cache/<city-id>/<year>.json（永久快取，不會過期，且已加入 .gitignore）

const DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
];

// Phase 1：hourly 變數（名稱已依 NOTES-dev.md 實測驗證，逐字勿改）
const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'dew_point_2m',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'precipitation',
  'wet_bulb_temperature_2m',
];

const HOURLY_API_CALL_DELAY_MS = 2000; // 逐年呼叫之間的延遲，避免觸發每分鐘流量限制（快取命中不需延遲）

const now = new Date();
const END_YEAR = now.getFullYear() - 1; // 只取完整年度，不含今年
const START_YEAR = END_YEAR - 9; // 共10個完整年度
const START_DATE = `${START_YEAR}-01-01`;
const END_DATE = `${END_YEAR}-12-31`;

function buildUrl(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: START_DATE,
    end_date: END_DATE,
    daily: DAILY_VARS.join(','),
    timezone: 'auto',
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
}

function aggregate(daily) {
  const { time, temperature_2m_max, temperature_2m_min, temperature_2m_mean, precipitation_sum } = daily;

  // 月統計（12個月，跨10年平均）
  const monthly = Array.from({ length: 12 }, () => ({
    highSum: 0, lowSum: 0, meanSum: 0, days: 0,
    precipByYear: {},
  }));

  // 年統計
  const yearly = {};

  for (let i = 0; i < time.length; i++) {
    const [yearStr, monthStr] = time[i].split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;

    const hi = temperature_2m_max[i];
    const lo = temperature_2m_min[i];
    const mean = temperature_2m_mean[i];
    const precip = precipitation_sum[i] ?? 0;

    if (hi == null || lo == null || mean == null) continue;

    const m = monthly[month];
    m.highSum += hi; m.lowSum += lo; m.meanSum += mean; m.days += 1;
    m.precipByYear[year] = (m.precipByYear[year] || 0) + precip;

    if (!yearly[year]) {
      yearly[year] = { year, meanSum: 0, days: 0, maxTemp: -Infinity, minTemp: Infinity, precipTotal: 0 };
    }
    const y = yearly[year];
    y.meanSum += mean; y.days += 1; y.precipTotal += precip;
    if (hi > y.maxTemp) y.maxTemp = hi;
    if (lo < y.minTemp) y.minTemp = lo;
  }

  const monthlyStats = monthly.map((m, idx) => {
    const years = Object.keys(m.precipByYear);
    const avgPrecip = years.reduce((s, y) => s + m.precipByYear[y], 0) / years.length;
    return {
      month: idx + 1,
      avgHigh: round1(m.highSum / m.days),
      avgLow: round1(m.lowSum / m.days),
      avgMean: round1(m.meanSum / m.days),
      avgPrecip: round1(avgPrecip),
    };
  });

  const yearlyStats = Object.values(yearly)
    .sort((a, b) => a.year - b.year)
    .map((y) => ({
      year: y.year,
      avgMean: round1(y.meanSum / y.days),
      maxTemp: round1(y.maxTemp),
      minTemp: round1(y.minTemp),
      precipTotal: round1(y.precipTotal),
    }));

  const overallAvgMean = round1(yearlyStats.reduce((s, y) => s + y.avgMean, 0) / yearlyStats.length);
  const overallAvgPrecip = round1(yearlyStats.reduce((s, y) => s + y.precipTotal, 0) / yearlyStats.length);
  const hottestYear = yearlyStats.reduce((a, b) => (b.avgMean > a.avgMean ? b : a));
  const coldestYear = yearlyStats.reduce((a, b) => (b.avgMean < a.avgMean ? b : a));

  return {
    monthly: monthlyStats,
    yearly: yearlyStats,
    summary: { overallAvgMean, overallAvgPrecip, hottestYear: hottestYear.year, coldestYear: coldestYear.year },
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

async function fetchLocation(loc) {
  const url = buildUrl(loc.lat, loc.lon);
  console.log(`抓取 ${loc.name} (${loc.id}) ...`);
  let res = await fetch(url);
  if (res.status === 429) {
    console.log('  達到每分鐘流量限制，等待 65 秒後重試...');
    await new Promise((r) => setTimeout(r, 65000));
    res = await fetch(url);
  }
  if (!res.ok) {
    throw new Error(`${loc.name} 抓取失敗：HTTP ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const stats = aggregate(json.daily);
  return {
    id: loc.id,
    name: loc.name,
    continent: loc.continent,
    country: loc.country,
    lat: loc.lat,
    lon: loc.lon,
    range: { startYear: START_YEAR, endYear: END_YEAR },
    ...stats,
  };
}

// ============================================================
// Phase 1：hourly 資料抓取 + 本地永久快取
// ============================================================

function buildHourlyUrl(lat, lon, year) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    hourly: HOURLY_VARS.join(','),
    timezone: 'auto',
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
}

function hourlyCachePath(cityId, year) {
  return path.join(CACHE_DIR, cityId, `${year}.json`);
}

// 抓取（或讀快取）單一城市單一年度的 hourly 原始資料。
// 回傳 { data, fromCache }：fromCache=true 表示直接讀本地快取，未呼叫 API。
async function fetchHourlyYear(loc, year) {
  const cachePath = hourlyCachePath(loc.id, year);
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return { data: cached, fromCache: true };
  }

  const url = buildHourlyUrl(loc.lat, loc.lon, year);
  console.log(`抓取 hourly ${loc.name} (${loc.id}) ${year} ...`);
  let res = await fetch(url);
  if (res.status === 429) {
    console.log('  達到每分鐘流量限制，等待 65 秒後重試...');
    await new Promise((r) => setTimeout(r, 65000));
    res = await fetch(url);
  }
  if (!res.ok) {
    throw new Error(`${loc.name} ${year} hourly 抓取失敗：HTTP ${res.status} ${await res.text()}`);
  }
  const json = await res.json();

  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(json), 'utf-8');

  return { data: json, fromCache: false };
}

// 取得單一地點跨 START_YEAR–END_YEAR（10個完整年度）合併後的 hourly 資料。
// 逐年抓取／讀快取後串接成單一陣列，供 Phase 3 的設計條件統計直接使用。
async function getHourlyDataForLocation(loc) {
  const merged = { time: [] };
  for (const v of HOURLY_VARS) merged[v] = [];

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const { data, fromCache } = await fetchHourlyYear(loc, year);
    const hourly = data.hourly;
    merged.time.push(...hourly.time);
    for (const v of HOURLY_VARS) {
      merged[v].push(...hourly[v]);
    }
    if (!fromCache) {
      await new Promise((r) => setTimeout(r, HOURLY_API_CALL_DELAY_MS));
    }
  }

  return merged;
}

// 對 locations.json 內所有地點依序抓取（或讀快取）hourly 資料。
// 主要用途是「跑一次把 10 年 × 11 城市的快取補齊」；回傳值目前不做聚合（那是 Phase 3 的工作）。
async function fetchAllLocationsHourly() {
  const locations = JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf-8'));
  for (const loc of locations) {
    await getHourlyDataForLocation(loc);
  }
  console.log('全部地點 hourly 快取抓取完成。');
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function buildNote(d) {
  const monthRows = d.monthly
    .map((m) => `| ${MONTH_NAMES[m.month - 1]} | ${m.avgHigh} | ${m.avgLow} | ${m.avgMean} | ${m.avgPrecip} |`)
    .join('\n');
  const yearRows = d.yearly
    .map((y) => `| ${y.year} | ${y.avgMean} | ${y.maxTemp} | ${y.minTemp} | ${y.precipTotal} |`)
    .join('\n');

  return `---
type: weather-stats
continent: ${d.continent}
country: ${d.country}
city: ${d.name}
lat: ${d.lat}
lon: ${d.lon}
years: ${d.range.startYear}-${d.range.endYear}
avg_temp: ${d.summary.overallAvgMean}
avg_precip: ${d.summary.overallAvgPrecip}
---

# ${d.name} — 10年天氣統計（${d.range.startYear}–${d.range.endYear}）

> 自動產生，請勿手動編輯。資料來源：Open-Meteo（ERA5）。更新方式：在 \`Tools/Weather-Stats/pipeline/\` 執行 \`node fetch-weather.js\`

## 總覽

| 指標 | 數值 |
|---|---|
| 10年平均氣溫 | ${d.summary.overallAvgMean} °C |
| 年均降雨量 | ${d.summary.overallAvgPrecip} mm |
| 最熱年份 | ${d.summary.hottestYear} |
| 最冷年份 | ${d.summary.coldestYear} |

## 月均統計（10年平均）

| 月份 | 平均高溫 °C | 平均低溫 °C | 均溫 °C | 平均降雨 mm |
|---|---|---|---|---|
${monthRows}

## 年度統計

| 年份 | 年均溫 °C | 極端高溫 °C | 極端低溫 °C | 年總雨量 mm |
|---|---|---|---|---|
${yearRows}

互動地球總覽：[[10年天氣統計]]
`;
}

function writeNotes(result) {
  for (const d of Object.values(result)) {
    const dir = path.join(NOTES_ROOT, d.continent, d.country);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${d.name}.md`), buildNote(d), 'utf-8');
  }
}

async function main() {
  const locations = JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf-8'));
  const result = {};
  for (const loc of locations) {
    result[loc.id] = await fetchLocation(loc);
    await new Promise((r) => setTimeout(r, 300));
  }
  const block = `/* WEATHER_DATA_START */\n// 自動產生，請勿手動編輯。重新產生：node pipeline/fetch-weather.js\nconst WEATHER_DATA = ${JSON.stringify(result, null, 2)};\n/* WEATHER_DATA_END */`;
  const html = fs.readFileSync(INDEX_FILE, 'utf-8');
  const markerRe = /\/\* WEATHER_DATA_START \*\/[\s\S]*?\/\* WEATHER_DATA_END \*\//;
  if (!markerRe.test(html)) throw new Error('在 index.html 找不到 WEATHER_DATA 標記區塊');
  fs.writeFileSync(INDEX_FILE, html.replace(markerRe, block), 'utf-8');
  console.log(`已注入 ${INDEX_FILE}`);
  writeNotes(result);
  console.log(`已產生 ${Object.keys(result).length} 份城市筆記於 ${NOTES_ROOT}`);
}

module.exports = {
  START_YEAR,
  END_YEAR,
  HOURLY_VARS,
  getHourlyDataForLocation,
  fetchAllLocationsHourly,
  fetchHourlyYear, // 供 smoke test / 除錯用：單一城市單一年度
  hourlyCachePath,
};

// 標準執行方式維持不變：`node fetch-weather.js` = 既有 daily 抓取 + index.html 注入 + 筆記產生。
// 新增 `node fetch-weather.js --hourly-cache` = Phase 1 的 hourly 逐年抓取／快取（不動 index.html、不動筆記）。
if (require.main === module) {
  if (process.argv[2] === '--hourly-cache') {
    fetchAllLocationsHourly().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else {
    main().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }
}
