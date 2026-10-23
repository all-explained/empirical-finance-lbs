import { describe, expect, it } from 'vitest';
import { normalRng } from '../math/rng';
import {
  blackScholes, entropy, martinLowerBound, optionStrip, seededSmile, smileVolatility, svixSquared, vixSquared,
} from './optionBound';

// A one-year market: spot 100, gross risk-free rate 1.02, so the forward is F = 102.
// Strikes 0.25, 0.5, ..., 500 cover the lognormal mass at σ ≤ 0.3 with negligible tails.
const S = 100;
const Rf = 1.02;
const T = 1;
const strikes = Array.from({ length: 2000 }, (_, i) => 0.25 * (i + 1));
const flat = (sigma: number) => ({ level: sigma, skew: 0, curvature: 0, floor: 0 });

describe('Black–Scholes', () => {
  it('prices the textbook point S = 42, K = 40, r = 10%, σ = 20%, T = 0.5', () => {
    // By hand: d1 = (ln 1.05 + 0.12 × 0.5)/(0.2 √0.5) = 0.7693, d2 = 0.6278, N(d1) = 0.7791, N(d2) = 0.7349,
    // K e^{-rT} = 38.049, call = 42 × 0.7791 - 38.049 × 0.7349 = 4.76, put = 4.76 - 42 + 38.049 = 0.81.
    const grossRf = Math.exp(0.1 * 0.5);
    expect(blackScholes('call', 42, 40, 0.5, grossRf, 0.2)).toBeCloseTo(4.76, 2);
    expect(blackScholes('put', 42, 40, 0.5, grossRf, 0.2)).toBeCloseTo(0.81, 2);
    expect(() => blackScholes('call', 42, 0, 0.5, grossRf, 0.2)).toThrow(RangeError);
    expect(() => blackScholes('call', 42, 40, 0.5, grossRf, 0)).toThrow(RangeError);
  });

  it('satisfies put–call parity C - P = S - K/Rf at three strikes', () => {
    for (const K of [80, 102, 130]) {
      const gap = blackScholes('call', S, K, T, Rf, 0.25) - blackScholes('put', S, K, T, Rf, 0.25);
      expect(gap).toBeCloseTo(S - K / Rf, 10);
    }
  });
});

describe('Smile', () => {
  const smile = { level: 0.2, skew: -0.2, curvature: 0.1, floor: 0.15 };

  it('is level + skew k + curvature k², cut at the floor', () => {
    // k = -0.5: 0.2 + 0.1 + 0.025 = 0.325. k = 3: 0.2 - 0.6 + 0.9 = 0.5. k = 1: 0.1, so the floor 0.15 binds.
    expect(smileVolatility(-0.5, smile)).toBeCloseTo(0.325, 14);
    expect(smileVolatility(3, smile)).toBeCloseTo(0.5, 14);
    expect(smileVolatility(1, smile)).toBe(0.15);
    expect(smileVolatility(0, smile)).toBe(0.2);
  });

  it('draws the same smile for the same seed, inside the documented ranges', () => {
    const a = seededSmile(42, 0.2);
    expect(seededSmile(42, 0.2)).toEqual(a);
    expect(seededSmile(43, 0.2)).not.toEqual(a);
    expect(a.level).toBe(0.2);
    expect(a.floor).toBe(0.05);
    for (let seed = 0; seed < 50; seed++) {
      const { skew, curvature } = seededSmile(seed, 0.2);
      expect(skew).toBeGreaterThanOrEqual(-0.25);
      expect(skew).toBeLessThanOrEqual(-0.1);
      expect(curvature).toBeGreaterThanOrEqual(0.05);
      expect(curvature).toBeLessThanOrEqual(0.2);
    }
    expect(() => seededSmile(1, 0)).toThrow(RangeError);
  });
});

describe('Option strip', () => {
  it('holds puts below the forward and calls at or above it, priced on the smile', () => {
    const smile = seededSmile(7, 0.2);
    const strip = optionStrip(S, Rf, T, smile, [90, 102, 110]);
    expect(strip.map((o) => o.kind)).toEqual(['put', 'call', 'call']);
    const sigma90 = smileVolatility(Math.log(90 / 102), smile);
    expect(strip[0].price).toBeCloseTo(blackScholes('put', S, 90, T, Rf, sigma90), 14);
    // At the forward the call and the put cost the same, so the strip is continuous there.
    expect(strip[1].price).toBeCloseTo(blackScholes('put', S, 102, T, Rf, 0.2), 12);
  });
});

describe('SVIX, VIX and the lower bound', () => {
  it('recovers the lognormal risk-neutral variance from a flat smile', () => {
    // Martin (2017) Result 4: var*(R_T) = Rf² (e^{σ² T} - 1) = 1.0404 × (e^{0.04} - 1) = 0.0424595.
    // The trapezoid rule with step 0.25 lands within 1e-4 relative error.
    const sigma = 0.2;
    const strip = optionStrip(S, Rf, T, flat(sigma), strikes);
    const variance = svixSquared(strip, S, Rf, T) * T * Rf * Rf;
    const reference = Rf * Rf * (Math.exp(sigma * sigma * T) - 1);
    expect(Math.abs(variance / reference - 1)).toBeLessThan(1e-4);
  });

  it('annualises SVIX² over a half-year horizon', () => {
    // Result 4 again: SVIX² = (e^{σ² T} - 1)/T = (e^{0.045} - 1)/0.5 = 0.0920563 for σ = 0.3, T = 0.5.
    const strip = optionStrip(S, 1.01, 0.5, flat(0.3), strikes);
    expect(Math.abs(svixSquared(strip, S, 1.01, 0.5) / ((Math.exp(0.045) - 1) / 0.5) - 1)).toBeLessThan(1e-4);
  });

  it('gives VIX² = σ² under a flat smile', () => {
    // Martin (2017) Result 4: VIX² = σ² = 0.04, within 1e-4 relative error.
    const strip = optionStrip(S, Rf, T, flat(0.2), strikes);
    expect(Math.abs(vixSquared(strip, S, Rf, T) / 0.04 - 1)).toBeLessThan(1e-4);
  });

  it('equals Rf (e^{σ² T} - 1) under lognormality and rises with the level of volatility', () => {
    // Flat σ = 0.2: 1.02 × (e^{0.04} - 1) = 0.0416270.
    const flatBound = martinLowerBound(optionStrip(S, Rf, T, flat(0.2), strikes), S, Rf, T);
    expect(Math.abs(flatBound / (Rf * (Math.exp(0.04) - 1)) - 1)).toBeLessThan(1e-4);
    const bounds = [0.1, 0.15, 0.2, 0.3].map((level) =>
      martinLowerBound(optionStrip(S, Rf, T, seededSmile(7, level), strikes), S, Rf, T));
    bounds.slice(1).forEach((b, i) => expect(b).toBeGreaterThan(bounds[i]));
  });

  it('rejects a grid that is too short or not increasing', () => {
    const strip = optionStrip(S, Rf, T, flat(0.2), [110, 90]);
    expect(() => svixSquared(strip, S, Rf, T)).toThrow(RangeError);
    expect(() => vixSquared(strip.slice(0, 1), S, Rf, T)).toThrow(RangeError);
  });
});

describe('Entropy', () => {
  it('is log E[X] - E[log X] for a two-point distribution', () => {
    // X = 1 or 4 with equal odds: log 2.5 - 0.5 log 4 = log 1.25.
    expect(entropy([1, 4], [0.5, 0.5])).toBeCloseTo(Math.log(1.25), 14);
    expect(entropy([3, 3], [0.5, 0.5])).toBeCloseTo(0, 14);
    expect(() => entropy([0, 1], [0.5, 0.5])).toThrow(RangeError);
    expect(() => entropy([1, 2], [0.5, 0.6])).toThrow(RangeError);
  });

  it('is about σ²/2 for a lognormal sample', () => {
    // X = e^{σ Z} with σ = 0.3: L(X) = σ²/2 = 0.045. 200,000 seeded draws land within 2e-3.
    const z = normalRng(2017);
    const n = 200_000;
    const values = Array.from({ length: n }, () => Math.exp(0.3 * z()));
    expect(Math.abs(entropy(values, new Array(n).fill(1 / n)) - 0.045)).toBeLessThan(2e-3);
  });
});
