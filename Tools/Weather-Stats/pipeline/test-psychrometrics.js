'use strict';

/**
 * test-psychrometrics.js
 *
 * Plain-assertion checkpoint test for psychrometrics.js. Run with:
 *   node test-psychrometrics.js
 *
 * Checkpoint sources are documented inline. No test framework — this is a
 * personal-tool sanity script, not a CI suite.
 */

const { pws, humidityRatioFromRH, wetBulbTemperature, enthalpy, dewPointFromRH } = require('./psychrometrics');

const P_STD = 101325; // Pa, standard atmosphere

let failures = 0;
let passes = 0;

function check(name, actual, expected, tolerance, note) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tolerance;
  const status = ok ? 'PASS' : 'FAIL';
  console.log(
    `[${status}] ${name}: actual=${actual.toFixed(4)} expected=${expected.toFixed(4)} ` +
      `(±${tolerance}) diff=${diff.toFixed(4)}${note ? '  — ' + note : ''}`
  );
  if (ok) {
    passes++;
  } else {
    failures++;
  }
}

function checkRange(name, actual, min, max, note) {
  const ok = actual >= min && actual <= max;
  const status = ok ? 'PASS' : 'FAIL';
  console.log(
    `[${status}] ${name}: actual=${actual.toFixed(4)} expected range=[${min}, ${max}]` +
      `${note ? '  — ' + note : ''}`
  );
  if (ok) {
    passes++;
  } else {
    failures++;
  }
}

console.log('=== psychrometrics.js checkpoint tests ===\n');

// --- Checkpoint A: saturation pressure sanity (steam-table reference values) ---
// pws(0°C) = 611.2 Pa is the standard triple-point-adjacent ice-point vapor
// pressure quoted in essentially every steam table / ASHRAE table.
check('pws(0°C) vs steam-table 611.2 Pa', pws(0), 611.2, 1.0, 'well-known reference value');

// pws(100°C): NOT exactly 101325 Pa. Under the modern ITS-90 temperature
// scale, the normal boiling point of water at 1 atm is 99.974°C (not
// 100.000°C — that was the old IPTS-68 definition). So pws(100.000°C) is
// slightly ABOVE 101325 Pa. Using the local Clausius-Clapeyron slope near
// 100°C (~3600 Pa/K), the expected offset is (100 - 99.974) * ~3600 ≈ 94 Pa,
// which matches this implementation's output (101418.7 Pa, i.e. +93.7 Pa)
// almost exactly — this is confirmation the formula is behaving correctly,
// not an error. Cross-referenced against instrumentationandcontrol.net's
// IAPWS-IF97 steam table FAQ ("at 100°C ... 1.01325 bar" refers to the older
// convention; IAPWS-IF97 itself computes ~101.42 kPa at exactly 100.000°C).
check('pws(100°C) vs IAPWS-IF97 101418 Pa (ITS-90 scale)', pws(100), 101418, 20, 'boiling pt at 1 atm is 99.974°C on ITS-90, not 100.000°C');

// pws(35°C) and pws(25°C): commonly cited ASHRAE psychrometric table values.
check('pws(35°C) vs ASHRAE table 5628 Pa', pws(35), 5628, 5, 'ASHRAE Fundamentals saturation table');
check('pws(25°C) vs ASHRAE table 3169 Pa', pws(25), 3169, 5, 'ASHRAE Fundamentals saturation table');

console.log('');

// --- Checkpoint 1: T=35°C, RH=40%, P=101325 Pa ---
// Cross-validated: airchange.com.au "The Art of the Chart" (HVAC psychrometric
// chart teaching reference) explicitly uses "35°C dry bulb, 24°C wet bulb,
// 40% relative humidity" as its worked chart-reading example point.
// https://www.airchange.com.au/cms/?technicalpaper=the-art-of-the-chart
// Expected 24.1°C (ASHRAE eq.35 iterative solution is slightly more precise
// than a hand-read chart), tolerance widened to cover chart-reading granularity.
{
  const twb = wetBulbTemperature(35, 40, P_STD);
  check('Twb(T=35°C, RH=40%)', twb, 24.1, 0.3, 'cross-checked vs airchange.com.au chart example (~24°C)');
}

// --- Checkpoint 2: T=30°C, RH=100%, P=101325 Pa ---
// At saturation, wet-bulb = dew-point = dry-bulb by definition.
{
  const twb = wetBulbTemperature(30, 100, P_STD);
  check('Twb(T=30°C, RH=100%)', twb, 30, 0.05, 'RH=100% => Twb=Tdb by definition');
}

// --- Checkpoint 3: T=0°C, RH=50%, P=101325 Pa ---
// Sanity range check: Twb must lie strictly between the dew point and the
// dry-bulb temperature (evaporative cooling can't cool past the dew point,
// and can't fail to cool at all below 100% RH).
{
  const twb = wetBulbTemperature(0, 50, P_STD);
  const tdp = dewPointFromRH(0, 50);
  console.log(`  (T=0°C, RH=50%: Tdp=${tdp.toFixed(2)}°C, Twb=${twb.toFixed(2)}°C, Tdb=0.00°C)`);
  checkRange('Twb(T=0°C, RH=50%) within (Tdp, Tdb)', twb, tdp, 0, 'must sit between dew point and dry bulb');
  // Also a tighter physical sanity band: at 0°C/50%RH, Twb should be a few
  // tenths to a couple of degrees below 0°C — not wildly negative.
  checkRange('Twb(T=0°C, RH=50%) plausible band', twb, -4, 0.2, 'near-zero, exercises ice/frost-bulb branch (eq.37)');
}

// --- Checkpoint 4: T=17.5°C, RH=82%, P=101325 Pa ---
// Cross-validated against Open-Meteo's NATIVE wet_bulb_temperature_2m hourly
// variable (independent physical source, not derived from this code), as
// recorded during Phase 0 API verification in pipeline/NOTES-dev.md:
// "同時段 T=17.5°C, RH=82% → Twb=15.4°C". Station pressure for that hour was
// not recorded, so P is assumed standard (101325 Pa); tolerance widened to
// ±0.5°C to absorb that assumption plus reanalysis-model vs. ASHRAE-equation
// differences.
{
  const twb = wetBulbTemperature(17.5, 82, P_STD);
  check('Twb(T=17.5°C, RH=82%)', twb, 15.4, 0.5, 'cross-checked vs Open-Meteo native wet_bulb_temperature_2m (NOTES-dev.md)');
}

// --- Checkpoint 5: T=25°C, RH=50%, P=101325 Pa ---
// General plausibility + internal consistency check: humidity ratio computed
// directly from (T,RH) must match the humidity ratio implied by feeding the
// solved Twb back through the saturation-at-Twb relation (round-trip check
// on the bisection solver itself, independent of any external source).
{
  // Tighter bisection tolerance here (0.0001°C instead of the default
  // 0.01°C) so the round-trip W-residual check below isn't dominated by
  // bisection granularity rather than actual formula correctness.
  const twb = wetBulbTemperature(25, 50, P_STD, { tolerance: 0.0001 });
  const W = humidityRatioFromRH(25, 50, P_STD);
  const Ws_twb = humidityRatioFromRH(twb, 100, P_STD);
  const Wcheck = ((2501 - 2.326 * twb) * Ws_twb - 1.006 * (25 - twb)) / (2501 + 1.86 * 25 - 4.186 * twb);
  console.log(`  (T=25°C, RH=50%: Twb=${twb.toFixed(4)}°C, W=${(W * 1000).toFixed(4)} g/kg)`);
  check('Twb(T=25°C, RH=50%) plausible (commonly ~18°C)', twb, 18.0, 1.0, 'general psychrometric-chart plausibility band');
  check('Round-trip W consistency at solved Twb', Wcheck, W, 1e-6, 'bisection solver self-consistency (eq.35 residual ~0)');
}

// --- Checkpoint 6: enthalpy sanity ---
// Standard indoor comfort condition ~24°C / ~50% RH has a well-known
// moist-air enthalpy around 47-50 kJ/kg dry air (commonly cited ASHRAE
// comfort-zone reference figure).
{
  const T = 24;
  const W = humidityRatioFromRH(T, 50, P_STD);
  const h = enthalpy(T, W);
  console.log(`  (T=24°C, RH=50%: W=${(W * 1000).toFixed(3)} g/kg, h=${h.toFixed(3)} kJ/kg)`);
  checkRange('Enthalpy at 24°C/50%RH plausible', h, 45, 52, 'typical indoor comfort enthalpy band');
}

console.log('');
console.log(`=== ${passes} passed, ${failures} failed ===`);

if (failures > 0) {
  console.error(`\nFAIL: ${failures} checkpoint(s) failed. Fix psychrometrics.js before proceeding to Phase 3.`);
  process.exit(1);
} else {
  console.log('\nPASS: all checkpoints within tolerance.');
  process.exit(0);
}
