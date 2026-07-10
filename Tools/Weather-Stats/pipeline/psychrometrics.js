'use strict';

/**
 * psychrometrics.js
 *
 * Standalone, dependency-free ASHRAE-standard psychrometric functions.
 * Source: ASHRAE Handbook — Fundamentals (2017), Chapter 1, "Psychrometrics".
 *
 * Saturation pressure of water (Hyland-Wexler equations, Ch.1 eq. 5 & 6):
 * Coefficients verified against TWO independent sources that agree exactly:
 *   1. Open-source reference implementation "psychrolib" (BSD-3-Clause,
 *      ASHRAE RP-1485), SI branch of GetSatVapPres():
 *      https://github.com/psychrometrics/psychrolib/blob/master/src/c/psychrolib.c
 *   2. EngineersEdge "Water Vapor Saturation Pressure Formulae and Calculator"
 *      (liquid-water branch coefficients C8-C13, independently reproduced):
 *      https://www.engineersedge.com/calculators/water_vapor_saturation_pressure_15730.htm
 *
 * Wet-bulb iterative relation (Ch.1 eq. 33/35 above freezing, eq. 36/37 below
 * freezing / frost-bulb) also cross-checked against the same psychrolib
 * GetHumRatioFromTWetBulb() SI branch (identical coefficients: 2501/2.326/
 * 1.006/1.86/4.186 above 0°C, 2830/0.24/1.006/1.86/2.1 below 0°C).
 *
 * DO NOT use Stull's approximation (~arctan formula) anywhere in this module —
 * it is a fast empirical fit, not the ASHRAE thermodynamic solution, and the
 * intended user (HVAC engineer) will sanity-check against it.
 *
 * Units unless noted otherwise: T in °C, RH in % (0-100), P in Pa, W in kg/kg
 * dry air, h in kJ/kg dry air, pws/pw in Pa.
 */

const KELVIN_OFFSET = 273.15;

/**
 * Saturation vapor pressure of water, Pa.
 * Piecewise Hyland-Wexler: over ice for T < 0°C (eq. 5), over liquid water
 * for T >= 0°C (eq. 6). T in °C internally converted to Kelvin.
 */
function pws(T) {
  const TK = T + KELVIN_OFFSET;
  let lnPws;

  if (T < 0) {
    // ASHRAE Fundamentals 2017, Ch.1 eq.5 — saturation over ice, -100°C to 0°C
    const C1 = -5.6745359e3;
    const C2 = 6.3925247;
    const C3 = -9.677843e-3;
    const C4 = 6.2215701e-7;
    const C5 = 2.0747825e-9;
    const C6 = -9.484024e-13;
    const C7 = 4.1635019;
    lnPws =
      C1 / TK +
      C2 +
      C3 * TK +
      C4 * TK * TK +
      C5 * Math.pow(TK, 3) +
      C6 * Math.pow(TK, 4) +
      C7 * Math.log(TK);
  } else {
    // ASHRAE Fundamentals 2017, Ch.1 eq.6 — saturation over liquid water, 0°C to 200°C
    const C8 = -5.8002206e3;
    const C9 = 1.3914993;
    const C10 = -4.8640239e-2;
    const C11 = 4.1764768e-5;
    const C12 = -1.4452093e-8;
    const C13 = 6.5459673;
    lnPws =
      C8 / TK +
      C9 +
      C10 * TK +
      C11 * TK * TK +
      C12 * Math.pow(TK, 3) +
      C13 * Math.log(TK);
  }

  return Math.exp(lnPws);
}

/**
 * Humidity ratio W (kg water / kg dry air) from dry-bulb T (°C), RH (%),
 * and total/station pressure P (Pa). ASHRAE Ch.1 eq.22 (with eq.24 pw=RH*pws).
 */
function humidityRatioFromRH(T, RH, P) {
  const pw = (RH / 100) * pws(T);
  return (0.621945 * pw) / (P - pw);
}

/**
 * Humidity ratio implied by a candidate wet-bulb temperature Twb (°C), given
 * dry-bulb T (°C) and pressure P (Pa). ASHRAE Ch.1 eq.35 (Twb >= 0°C) or
 * eq.37 (Twb < 0°C, frost/ice bulb — uses sublimation latent heat 2830 kJ/kg
 * instead of vaporization 2501 kJ/kg).
 */
function humidityRatioFromTwb(T, Twb, P) {
  const Ws = humidityRatioFromRH(Twb, 100, P);
  if (Twb >= 0) {
    return ((2501 - 2.326 * Twb) * Ws - 1.006 * (T - Twb)) / (2501 + 1.86 * T - 4.186 * Twb);
  }
  return ((2830 - 0.24 * Twb) * Ws - 1.006 * (T - Twb)) / (2830 + 1.86 * T - 2.1 * Twb);
}

/**
 * Wet-bulb temperature Twb (°C) by bisection: find Twb such that
 * humidityRatioFromTwb(T, Twb, P) equals the actual humidity ratio W
 * implied by (T, RH, P). Monotonically increasing in Twb, so bisection is
 * well-posed on [-50°C, T].
 */
function wetBulbTemperature(T, RH, P, options) {
  options = options || {};
  const tolerance = options.tolerance !== undefined ? options.tolerance : 0.01;
  const maxIter = options.maxIter !== undefined ? options.maxIter : 100;

  if (RH >= 100) return T; // at saturation, wet-bulb = dry-bulb by definition

  const W = humidityRatioFromRH(T, RH, P);

  let lo = -50;
  let hi = T;
  let flo = humidityRatioFromTwb(T, lo, P) - W;
  let fhi = humidityRatioFromTwb(T, hi, P) - W;

  if (flo > 0 || fhi < 0) {
    throw new Error(
      `wetBulbTemperature: bisection bracket invalid for T=${T} RH=${RH} P=${P} ` +
        `(flo=${flo}, fhi=${fhi}). Lower bound may need to be < -50°C.`
    );
  }

  let mid = (lo + hi) / 2;
  for (let i = 0; i < maxIter; i++) {
    mid = (lo + hi) / 2;
    if (hi - lo < tolerance) break;
    const fm = humidityRatioFromTwb(T, mid, P) - W;
    if (fm > 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return mid;
}

/**
 * Moist-air enthalpy h (kJ/kg dry air). ASHRAE Ch.1 eq.32.
 */
function enthalpy(T, W) {
  return 1.006 * T + W * (2501 + 1.86 * T);
}

/**
 * Dew-point temperature (°C) from dry-bulb T (°C) and RH (%), by bisection
 * inversion of pws(). Not required by callers that already have dew_point_2m
 * from the API, but useful for cross-validation.
 */
function dewPointFromRH(T, RH, options) {
  options = options || {};
  const tolerance = options.tolerance !== undefined ? options.tolerance : 0.01;
  const maxIter = options.maxIter !== undefined ? options.maxIter : 100;

  if (RH >= 100) return T;

  const targetPw = (RH / 100) * pws(T);

  let lo = -80;
  let hi = T;
  let mid = (lo + hi) / 2;
  for (let i = 0; i < maxIter; i++) {
    mid = (lo + hi) / 2;
    if (hi - lo < tolerance) break;
    if (pws(mid) > targetPw) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return mid;
}

module.exports = {
  pws,
  humidityRatioFromRH,
  humidityRatioFromTwb,
  wetBulbTemperature,
  enthalpy,
  dewPointFromRH,
};
