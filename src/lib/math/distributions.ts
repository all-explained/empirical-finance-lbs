// The gamma and beta special functions and the F distribution, for test p-values.

// Lanczos coefficients for g = 7, n = 9 (Godfrey's set); relative error below 1e-15 for x > 0.
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

/** log Γ(x) for x > 0, by the Lanczos approximation (reflection Γ(x)Γ(1-x) = π/sin πx below 0.5). */
export function logGamma(x: number): number {
  if (!(x > 0)) throw new RangeError('logGamma: x must be positive');
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  const z = x - 1;
  let sum = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i++) sum += LANCZOS[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

// Continued fraction for I_x(a, b) by the modified Lentz method (Numerical Recipes, section 6.4).
// It converges fast for x < (a + 1)/(a + b + 2); the caller uses symmetry otherwise.
function betaFraction(x: number, a: number, b: number): number {
  const tiny = 1e-300;
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  const step = (num: number): number => {
    d = 1 + num * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + num / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    return d * c;
  };
  for (let m = 1; m <= 10000; m++) {
    const m2 = 2 * m;
    // Even coefficient d_{2m}, then odd coefficient d_{2m+1}.
    step(m * (b - m) * x / ((a + m2 - 1) * (a + m2)));
    const delta = step(-(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1)));
    if (Math.abs(delta - 1) < 1e-15) return h;
  }
  throw new Error('regularizedBeta: continued fraction did not converge');
}

/** The regularized incomplete beta function I_x(a, b) = B(x; a, b)/B(a, b), for 0 ≤ x ≤ 1 and a, b > 0. */
export function regularizedBeta(x: number, a: number, b: number): number {
  if (!(a > 0 && b > 0)) throw new RangeError('regularizedBeta: a and b must be positive');
  if (!(x >= 0 && x <= 1)) throw new RangeError('regularizedBeta: x must lie in [0, 1]');
  if (x === 0 || x === 1) return x;
  // x^a (1-x)^b / (a B(a, b)) is the leading factor of the continued fraction.
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  if (x < (a + 1) / (a + b + 2)) return front * betaFraction(x, a, b) / a;
  // I_x(a, b) = 1 - I_{1-x}(b, a).
  return 1 - front * betaFraction(1 - x, b, a) / b;
}

function checkDegrees(d1: number, d2: number): void {
  if (!(d1 > 0 && d2 > 0)) throw new RangeError('F distribution: degrees of freedom must be positive');
}

/** P(F ≤ x) for F ~ F(d1, d2): I_{d1 x/(d1 x + d2)}(d1/2, d2/2). */
export function fCdf(x: number, d1: number, d2: number): number {
  checkDegrees(d1, d2);
  if (Number.isNaN(x)) return NaN;
  if (x <= 0) return 0;
  if (x === Infinity) return 1;
  return regularizedBeta(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2);
}

/** P(F > x) = I_{d2/(d2 + d1 x)}(d2/2, d1/2), computed directly so small p-values keep their digits. */
export function fSurvival(x: number, d1: number, d2: number): number {
  checkDegrees(d1, d2);
  if (Number.isNaN(x)) return NaN;
  if (x <= 0) return 1;
  if (x === Infinity) return 0;
  return regularizedBeta(d2 / (d2 + d1 * x), d2 / 2, d1 / 2);
}
