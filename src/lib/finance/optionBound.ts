// Option prices, the strip of out-of-the-money options, SVIX, VIX and the Martin (2017) lower bound
// on the expected return. Rf is the GROSS risk-free rate over the whole horizon T (in years), so a
// riskless payoff of 1 at T costs 1/Rf; this differs from the net per-period R^f of the style guide.
// The underlying pays no dividends, so the forward price is F = S Rf and R_T = S_T / S.
// Page numbers refer to Martin (2017), "What is the expected return on the market?", QJE 132(1).
import { cdf } from '../math/normal';
import { mulberry32 } from '../math/rng';

export type OptionKind = 'call' | 'put';

export interface SmileParams {
  /** Implied volatility at the money (k = 0), annualised. */
  level: number;
  /** Slope dσ/dk; negative for equity indices, so low strikes have higher volatility. */
  skew: number;
  /** Convexity of the smile in k. */
  curvature: number;
  /** Smallest volatility the smile may reach. */
  floor: number;
}

export interface StripOption {
  strike: number;
  kind: OptionKind;
  price: number;
}

function requireFinite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError('Expected a finite number');
}

function requireMarket(S: number, Rf: number, T: number): void {
  [S, Rf, T].forEach(requireFinite);
  if (S <= 0) throw new RangeError('The spot price must be positive');
  if (Rf <= 0) throw new RangeError('The gross risk-free rate must be positive');
  if (T <= 0) throw new RangeError('The horizon must be positive');
}

/** Black–Scholes price with gross risk-free rate Rf over T: call = S N(d1) - (K/Rf) N(d2). */
export function blackScholes(kind: OptionKind, S: number, K: number, T: number, Rf: number, sigma: number): number {
  requireMarket(S, Rf, T);
  [K, sigma].forEach(requireFinite);
  if (K <= 0) throw new RangeError('The strike must be positive');
  if (sigma <= 0) throw new RangeError('Volatility must be positive');
  const sd = sigma * Math.sqrt(T);
  const d1 = (Math.log((S * Rf) / K) + 0.5 * sd * sd) / sd;
  const d2 = d1 - sd;
  return kind === 'call'
    ? S * cdf(d1) - (K / Rf) * cdf(d2)
    : (K / Rf) * cdf(-d2) - S * cdf(-d1);
}

/** Implied volatility at log-moneyness k = log(K/F): max(floor, level + skew k + curvature k²). */
export function smileVolatility(k: number, { level, skew, curvature, floor }: SmileParams): number {
  [k, level, skew, curvature, floor].forEach(requireFinite);
  return Math.max(floor, level + skew * k + curvature * k * k);
}

/**
 * A seeded equity-index smile around the given at-the-money level. Draws skew uniformly from
 * [-0.25, -0.10] and curvature from [0.05, 0.20] with mulberry32; the floor is 0.05.
 */
export function seededSmile(seed: number, level: number): SmileParams {
  requireFinite(level);
  if (level <= 0) throw new RangeError('The volatility level must be positive');
  const uniform = mulberry32(seed);
  return {
    level,
    skew: -0.25 + 0.15 * uniform(),
    curvature: 0.05 + 0.15 * uniform(),
    floor: 0.05,
  };
}

/** Out-of-the-money price at each strike: a put below the forward F = S Rf, a call at or above it. */
export function optionStrip(S: number, Rf: number, T: number, smile: SmileParams, strikes: readonly number[]): StripOption[] {
  requireMarket(S, Rf, T);
  const F = S * Rf;
  return strikes.map((strike) => {
    const kind: OptionKind = strike < F ? 'put' : 'call';
    return { strike, kind, price: blackScholes(kind, S, strike, T, Rf, smileVolatility(Math.log(strike / F), smile)) };
  });
}

// ponytail: trapezoid on the given grid, so the tails beyond the first and last strike are dropped.
// That only lowers SVIX, VIX and the bound (Martin 2017, p. 381), so a wide grid is the fix.
function trapezoid(strip: readonly StripOption[], weight: (K: number) => number): number {
  if (strip.length < 2) throw new RangeError('Need at least two strikes');
  let area = 0;
  for (let i = 1; i < strip.length; i++) {
    const a = strip[i - 1];
    const b = strip[i];
    [a.strike, a.price, b.strike, b.price].forEach(requireFinite);
    if (!(a.strike > 0 && b.strike > a.strike)) throw new RangeError('Strikes must be positive and increasing');
    area += 0.5 * (b.strike - a.strike) * (a.price * weight(a.strike) + b.price * weight(b.strike));
  }
  return area;
}

/**
 * SVIX² = 2/(T Rf S²) [∫_0^F put(K) dK + ∫_F^∞ call(K) dK] = (1/T) var*(R_T / Rf), annualised
 * (Martin 2017, eqs. 12–13, p. 382). Under lognormality it equals (e^{σ² T} - 1)/T (Result 4, p. 402).
 */
export function svixSquared(strip: readonly StripOption[], S: number, Rf: number, T: number): number {
  requireMarket(S, Rf, T);
  return (2 / (T * Rf * S * S)) * trapezoid(strip, () => 1);
}

/**
 * VIX² = (2 Rf/T) [∫_0^F put(K)/K² dK + ∫_F^∞ call(K)/K² dK] = (2/T) L*(R_T / Rf), twice the annualised
 * risk-neutral entropy of the return (Martin 2017, eqs. 24–25, Result 3, p. 401). Lognormal: σ² (p. 402).
 */
export function vixSquared(strip: readonly StripOption[], S: number, Rf: number, T: number): number {
  requireMarket(S, Rf, T);
  return ((2 * Rf) / T) * trapezoid(strip, (K) => 1 / (K * K));
}

/**
 * Lower bound on E_t[R_T] - Rf over the horizon (not annualised): var*(R_T)/Rf = (2/S²)[∫ puts + ∫ calls]
 * (Martin 2017, eq. 5, p. 371, and eq. 14, p. 382). Divide by T for eq. 15's annual Rf · SVIX².
 */
export function martinLowerBound(strip: readonly StripOption[], S: number, Rf: number, T: number): number {
  return Rf * T * svixSquared(strip, S, Rf, T);
}

/** Entropy L(X) = log E[X] - E[log X] of a positive X on finitely many states (Martin 2017, p. 401). */
export function entropy(values: readonly number[], probabilities: readonly number[]): number {
  if (values.length === 0 || values.length !== probabilities.length) {
    throw new RangeError('Every state needs one value and one probability');
  }
  [...values, ...probabilities].forEach(requireFinite);
  if (values.some((x) => x <= 0)) throw new RangeError('Entropy needs positive values');
  if (probabilities.some((p) => p < 0)) throw new RangeError('Probabilities must be nonnegative');
  if (Math.abs(probabilities.reduce((sum, p) => sum + p, 0) - 1) > 1e-9) throw new RangeError('Probabilities must sum to one');
  const mean = values.reduce((sum, x, s) => sum + probabilities[s] * x, 0);
  const meanLog = values.reduce((sum, x, s) => sum + probabilities[s] * Math.log(x), 0);
  return Math.log(mean) - meanLog;
}
