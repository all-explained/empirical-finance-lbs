import { martinLowerBound, optionStrip, seededSmile, svixSquared, vixSquared, type SmileParams, type StripOption } from '../../lib/finance/optionBound';

/** One-year options on an index at 100, with a risk-free rate of 3% a year (style guide §5). */
export const MARKET = { S: 100, tau: 1, rfAnnual: 0.03 } as const;
/** Gross risk-free rate over the life of the options, as optionBound.ts expects. */
export const GROSS_RF = (1 + MARKET.rfAnnual) ** MARKET.tau;
export const FORWARD = MARKET.S * GROSS_RF;
export const DEFAULT_SEED = 1;
export const DEFAULT_LEVEL = 0.2;

// ponytail: listed strikes from 30 to 300 in steps of 1. The options beyond them are dropped,
// which only lowers SVIX, VIX and the bound (Martin 2017, p. 381); widen the grid if a chapter needs more.
export const STRIKES = Array.from({ length: 271 }, (_, i) => 30 + i);

/** The same smile with no skew and no curvature: one volatility at every strike (the lognormal case). */
export const flatSmile = (level: number): SmileParams => ({ level, skew: 0, curvature: 0, floor: 0.05 });

export interface StripBound {
  smile: SmileParams;
  strip: StripOption[];
  /** Annualised SVIX² and VIX². */
  svix2: number;
  vix2: number;
  /** Martin's lower bound on the expected excess return, annualised: Rf · SVIX². */
  bound: number;
}

/** The out-of-the-money strip of a smile (seeded by default), and what it implies. */
export function stripBound(level: number, seed: number, smile: SmileParams = seededSmile(seed, level)): StripBound {
  const { S, tau } = MARKET;
  const strip = optionStrip(S, GROSS_RF, tau, smile, STRIKES);
  return {
    smile,
    strip,
    svix2: svixSquared(strip, S, GROSS_RF, tau),
    vix2: vixSquared(strip, S, GROSS_RF, tau),
    bound: martinLowerBound(strip, S, GROSS_RF, tau) / tau,
  };
}
