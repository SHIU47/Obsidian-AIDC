// 抓取各地點過去10個完整年度的歷史天氣資料（Open-Meteo Archive API，免費、不需 API key）
// 執行：node fetch-weather.js
// 輸出：../weather-data.js（給 index.html 用 <script> 直接載入，避免 file:// fetch 的 CORS 問題）

const fs = require('fs');
const path = require('path');

const LOCATIONS_FILE = path.join(__dirname, 'locations.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'weather-data.js');

const DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
];

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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${loc.name} 抓取失敗：HTTP ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const stats = aggregate(json.daily);
  return {
    id: loc.id,
    name: loc.name,
    lat: loc.lat,
    lon: loc.lon,
    range: { startYear: START_YEAR, endYear: END_YEAR },
    ...stats,
  };
}

async function main() {
  const locations = JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf-8'));
  const result = {};
  for (const loc of locations) {
    result[loc.id] = await fetchLocation(loc);
    await new Promise((r) => setTimeout(r, 300));
  }
  const output = `// 自動產生，請勿手動編輯。重新產生：node pipeline/fetch-weather.js\nconst WEATHER_DATA = ${JSON.stringify(result, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`完成！已寫入 ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
