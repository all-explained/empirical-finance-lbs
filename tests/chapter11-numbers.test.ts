/**
 * Every number in the prose of chapter 11, recomputed from goyal-welch-annual through the
 * library and the widgets' sample module. If the data or the library changes, this test fails
 * before the chapter drifts.
 */
import { describe, expect, test } from 'vitest';
import gw from '../src/data/series/goyal-welch-annual.json';
import type { Series } from '../src/lib/data/series';
import { dogTailShares } from '../src/lib/finance/news';
import { longRunCoefficient } from '../src/lib/finance/presentValue';
import { ols } from '../src/lib/stats/ols';
import {
  DEFAULT_SEED, DOG_SAMPLES, dogDraws, dogInputs, presentValueSample, sampleNews,
} from '../src/components/plots/newsSample';
import { presentValueData } from '../src/components/plots/presentValueSample';

const series = presentValueData(gw as unknown as Series<'goyal-welch-annual'>);
const post = presentValueSample(series, '1926');
const full = presentValueSample(series, '1872');
const fixed = (v: number, digits: number) => v.toFixed(digits);
const percent = (v: number, digits: number) => (v * 100).toFixed(digits);
const tails = (s: typeof post, phi: number) => dogTailShares(dogDraws(s, phi, DEFAULT_SEED), dogInputs(s).estimates, s.rho);

describe('chapter 11 prose numbers', () => {
  test('samples', () => {
    expect([post.years[1], post.years.at(-1), post.years.length - 1]).toEqual([1927, 2025, 99]); // returns 1927–2025
    expect([full.years[0], full.years[1]]).toEqual([1872, 1873]);
    expect(fixed(post.rho, 3)).toBe('0.969');
  });

  test('hook and intuition: news in 2008 and 1996–1999', () => {
    expect(percent(1 - Math.exp(post.r[post.years.indexOf(2008)]), 1)).toBe('36.6');
    const news = sampleNews(post);
    const at = (y: number) => news.years.indexOf(y);
    expect([news.unexpected[at(2008)], news.cashFlow[at(2008)], -news.discountRate[at(2008)]].map((v) => fixed(v, 3)))
      .toEqual(['-0.523', '-0.271', '-0.251']);
    const sum = (f: (t: number) => number) => [1996, 1997, 1998, 1999].reduce((s, y) => s + f(at(y)), 0);
    expect(fixed(sum((t) => news.unexpected[t]), 2)).toBe('0.62');
    expect(fixed(sum((t) => -news.discountRate[t]), 2)).toBe('0.55');
    expect(fixed(sum((t) => news.cashFlow[t]), 2)).toBe('0.07');
  });

  test('variance shares and news weights', () => {
    const news = sampleNews(post);
    expect([news.shares.cashFlow, news.shares.discountRate, news.shares.covariance].map((v) => percent(v, 1)))
      .toEqual(['39.2', '39.8', '21.0']);
    expect(news.weights.discountRate.map((v) => fixed(v, 2))).toEqual(['0.28', '0.78']);
    const old = sampleNews(full).shares;
    expect([old.cashFlow, old.discountRate, old.covariance].map((v) => percent(v, 1))).toEqual(['64.5', '9.8', '25.8']);
  });

  test('three slopes and the identity', () => {
    const { estimates: e } = dogInputs(post);
    const x = [post.dp.slice(0, -1)];
    const [r, d, p] = [post.r, post.dd, post.dp].map((y) => ols(y.slice(1), x));
    expect([fixed(e.br, 3), fixed(r.standardErrors[1], 3), fixed(r.tStats[1], 2)]).toEqual(['0.046', '0.038', '1.21']);
    expect([fixed(e.bd, 3), fixed(d.standardErrors[1], 3), fixed(d.tStats[1], 2)]).toEqual(['-0.059', '0.022', '-2.75']);
    expect([fixed(e.phi, 3), fixed(p.standardErrors[1], 3), e.nobs]).toEqual(['0.924', '0.043', 99]);
    expect(Math.abs(e.gap)).toBeLessThan(0.0002);
    expect(fixed(post.rho * e.phi - 1, 3)).toBe('-0.105'); // b_d under the null
    expect(fixed(dogInputs(full).estimates.bd, 3)).toBe('-0.088');
  });

  test('dog test: seeded tail shares', () => {
    const { estimates: e } = dogInputs(post);
    expect([DEFAULT_SEED, DOG_SAMPLES]).toEqual([1, 2000]);
    const atData = tails(post, e.phi);
    expect([percent(atData.br, 1), atData.bd * DOG_SAMPLES, percent(atData.bd, 1), percent(atData.longRun, 1)])
      .toEqual(['34.1', 15, '0.8', '14.6']);
    expect(fixed(longRunCoefficient(e.br, post.rho, e.phi), 2)).toBe('0.44');
    expect(percent(tails(post, 0.95).bd, 1)).toBe('7.4');
    expect([fixed(post.rho * 0.99 - 1, 3), percent(tails(post, 0.99).bd, 1)]).toEqual(['-0.041', '73.6']);
    expect(percent(tails(full, dogInputs(full).estimates.phi).bd, 1)).toBe('4.2');
  });
});
