import { describe, expect, it } from 'vitest';
import { ols, type OLSOptions } from './ols';

/* Independent reference generation (outside the repository).
 * Versions: Python 3.15.0, numpy 2.5.4, statsmodels 0.15.0.
 * Exact commands (the Python program prints the values pasted below):
 * python3 -m venv /tmp/course-site-task-011-ols-venv
 * /tmp/course-site-task-011-ols-venv/bin/python3 -m pip install numpy==2.5.4 statsmodels==0.15.0
 * /tmp/course-site-task-011-ols-venv/bin/python3 - <<'PY'
import json
import numpy as np
import statsmodels.api as sm
from statsmodels.stats.sandwich_covariance import cov_hac, weights_uniform
t = np.arange(1, 41)
x = (t - 20) / 10 + ((t * 7) % 5) / 10
z = ((t * 3) % 11 - 5) / 5
e = []
for i in t:
    e.append(0.65 * (e[-1] if e else 0) + (((i * 13) % 17) - 8) / 10 * (1 + i / 40))
y = 0.7 + 1.3 * x - 0.4 * z + e
references = []
for columns, intercept in [([x], True), ([x, z], True), ([x, z], False), ([], True)]:
    fit = sm.OLS(y, np.column_stack(([np.ones(40)] if intercept else []) + columns)).fit()
    cases = {}
    for kind in ['classical', 'hc0', 'hc1', 'nw4', 'hh4']:
        if kind == 'classical':
            cov = fit.cov_params()
        elif kind in ['hc0', 'hc1']:
            cov = fit.get_robustcov_results(cov_type=kind.upper()).cov_params()
        elif kind == 'nw4':
            cov = cov_hac(fit, nlags=4, use_correction=False)
        else:
            cov = cov_hac(fit, nlags=4, weights_func=weights_uniform, use_correction=False)
        se = np.sqrt(np.diag(cov))
        cases[kind] = dict(covariance=cov.tolist(), standardErrors=se.tolist(), tStats=(fit.params/se).tolist())
    references.append(dict(coefficients=fit.params.tolist(), r2=fit.rsquared, adjR2=fit.rsquared_adj,
                           fitted=fit.fittedvalues[:3].tolist(), residuals=fit.resid[:3].tolist(), cases=cases))
print(json.dumps(references, indent=2))
PY
 */

const time = Array.from({ length: 40 }, (_, i) => i + 1);
const x = time.map((t) => (t - 20) / 10 + ((t * 7) % 5) / 10);
const z = time.map((t) => (((t * 3) % 11) - 5) / 5);
const shocks: number[] = [];
for (const t of time) shocks.push(0.65 * (shocks.at(-1) ?? 0) + (((t * 13) % 17) - 8) / 10 * (1 + t / 40));
const y = time.map((_, t) => 0.7 + 1.3 * x[t] - 0.4 * z[t] + shocks[t]);

function expectVector(actual: readonly number[], expected: readonly number[], digits = 10) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, j) => expect(value).toBeCloseTo(expected[j], digits));
}

const estimators: [string, OLSOptions][] = [
  ['classical', {}],
  ['hc0', { errors: 'white' }],
  ['hc1', { errors: 'white', hc1: true }],
  ['nw4', { errors: 'newey-west', lags: 4 }],
  ['hh4', { errors: 'hansen-hodrick', lags: 4 }],
];

describe.each([
  { name: 'one regressor with intercept', columns: [x], intercept: true, index: 0 },
  { name: 'two regressors with intercept', columns: [x, z], intercept: true, index: 1 },
  { name: 'two regressors without intercept', columns: [x, z], intercept: false, index: 2 },
  { name: 'intercept only', columns: [], intercept: true, index: 3 },
])('$name (statsmodels reference)', ({ columns, intercept, index }) => {
  it.each(estimators)('%s: coefficients, full covariance, SE, t statistics and fit', (kind, options) => {
    const expected = references[index];
    const uncertainty = expected.cases[kind as keyof typeof expected.cases];
    const result = ols(y, columns, { ...options, intercept });
    expectVector(result.coefficients, expected.coefficients);
    expectVector(result.standardErrors, uncertainty.standardErrors);
    expectVector(result.tStats, uncertainty.tStats);
    expect(result.covariance).toHaveLength(expected.coefficients.length);
    result.covariance.forEach((row, j) => expectVector(row, uncertainty.covariance[j]));
    expect(result.r2).toBeCloseTo(expected.r2, 12);
    expect(result.adjR2).toBeCloseTo(expected.adjR2, 12);
    expect(result.nobs).toBe(40);
    expect(result.fitted).toHaveLength(40);
    expect(result.residuals).toHaveLength(40);
    expectVector(result.fitted.slice(0, 3), expected.fitted);
    expectVector(result.residuals.slice(0, 3), expected.residuals);
  });
});

describe('OLS identities and numerical behavior', () => {
  it.each([[x], [x, z], []])('Newey–West and Hansen–Hodrick at zero lags equal HC0 (%j)', (...columns) => {
    const white = ols(y, columns, { errors: 'white' });
    for (const errors of ['newey-west', 'hansen-hodrick'] as const) {
      expect(ols(y, columns, { errors, lags: 0 })).toEqual(white);
      expect(ols(y, columns, { errors })).toEqual(white);
    }
  });

  it('residuals are orthogonal to the intercept and each regressor', () => {
    const result = ols(y, [x, z]);
    for (const column of [time.map(() => 1), x, z]) {
      expect(column.reduce((sum, value, t) => sum + value * result.residuals[t], 0)).toBeCloseTo(0, 11);
    }
    expectVector(result.fitted.map((value, t) => value + result.residuals[t]), y);
  });

  it('intercept-only OLS estimates the mean, with se = s / sqrt(T)', () => {
    const mean = y.reduce((sum, value) => sum + value, 0) / y.length;
    const s = Math.sqrt(y.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (y.length - 1));
    const result = ols(y, []);
    expectVector(result.coefficients, [mean]);
    expectVector(result.standardErrors, [s / Math.sqrt(y.length)]);
  });

  it('R squared equals squared correlation with one regressor and an intercept', () => {
    const meanX = x.reduce((a, b) => a + b) / x.length;
    const meanY = y.reduce((a, b) => a + b) / y.length;
    const cross = x.reduce((sum, value, t) => sum + (value - meanX) * (y[t] - meanY), 0);
    const xx = x.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
    const yy = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
    expect(ols(y, [x]).r2).toBeCloseTo(cross ** 2 / (xx * yy), 12);
  });

  it('scales regressors before QR and preserves fits across different units', () => {
    const result = ols(y, [x.map((value) => value * 1e-10), z.map((value) => value * 1e10)]);
    const expected = references[1];
    expectVector([result.coefficients[0], result.coefficients[1] * 1e-10, result.coefficients[2] * 1e10], expected.coefficients);
    expectVector(result.fitted.slice(0, 3), expected.fitted);
  });

  it('fits a nearly constant regressor without squaring its condition number', () => {
    const predictor = time.map((t) => 1e4 + t / 100);
    const result = ols(predictor.map((value) => 3 + 2 * value), [predictor]);
    expectVector(result.coefficients, [3, 2], 5);
    expectVector(result.residuals, time.map(() => 0), 8);
  });

  it('does not mutate caller arrays', () => {
    const response = Object.freeze([...y]);
    const columns = Object.freeze([Object.freeze([...x]), Object.freeze([...z])]);
    expect(() => ols(response, columns, { errors: 'newey-west', lags: 4 })).not.toThrow();
    expect(response).toEqual(y);
    expect(columns).toEqual([x, z]);
  });

  it('leaves negative Hansen–Hodrick variances visible instead of clipping them', () => {
    // T=6 alternating +/-1, mean=0: HC0=1/6, lag-one term=-2*5/36, total=-1/9.
    const result = ols([1, -1, 1, -1, 1, -1], [], { errors: 'hansen-hodrick', lags: 1 });
    expect(result.covariance[0][0]).toBeCloseTo(-1 / 9, 14);
    expect(result.standardErrors[0]).toBeNaN();
  });

  it('documents undefined R squared when the response has zero total variation', () => {
    const result = ols([0, 0, 0, 0], []);
    expect(result.r2).toBeNaN();
    expect(result.adjR2).toBeNaN();
  });
});

describe('input errors', () => {
  it('rejects unequal lengths, including a later column', () => {
    expect(() => ols(y, [x.slice(1)])).toThrow(/unequal lengths/);
    expect(() => ols(y, [x, z.slice(1)])).toThrow(/unequal lengths/);
  });

  it('rejects empty, underdetermined and zero residual-degree-of-freedom fits', () => {
    expect(() => ols([], [])).toThrow(/observations must exceed parameters/);
    expect(() => ols([1], [[2], [3]])).toThrow(/observations must exceed parameters/);
    expect(() => ols([1, 2], [[3, 4]])).toThrow(/observations must exceed parameters/);
    expect(() => ols(y, [], { intercept: false })).toThrow(/at least one parameter/);
  });

  it('rejects zero, duplicate, constant and dependent columns', () => {
    for (const columns of [[time.map(() => 0)], [x, x], [time.map(() => 2)], [x, z, x.map((value, t) => 2 * value + 3 * z[t])]]) {
      expect(() => ols(y, columns)).toThrow(/singular X'X/);
    }
  });

  it.each([NaN, Infinity, -Infinity])('rejects nonfinite input %s', (invalid) => {
    expect(() => ols([invalid, ...y.slice(1)], [x])).toThrow(/finite numbers/);
    expect(() => ols(y, [[invalid, ...x.slice(1)]])).toThrow(/finite numbers/);
  });

  it.each([-1, 0.5, 40, NaN, Infinity])('rejects invalid lag count %s', (lags) => {
    for (const errors of ['newey-west', 'hansen-hodrick'] as const) {
      expect(() => ols(y, [x], { errors, lags })).toThrow(/lags must be an integer/);
    }
  });

  it('rejects unknown covariance methods from untyped callers', () => {
    // @ts-expect-error Exercise the runtime guard for JavaScript callers.
    expect(() => ols(y, [x], { errors: 'typo' })).toThrow(/unknown covariance/);
  });
});

// Frozen statsmodels output. No Python or third-party numerical code runs in these tests.
const references = [
  {
    "coefficients": [0.7207807484044313, 1.2146226101937532],
    "r2": 0.7807805912524612,
    "adjR2": 0.7750116594433154,
    "fitted": [-1.344077688924949, -0.9796909058668231, -1.2226154279055736],
    "residuals": [0.5065776889249489, 0.2178159058668231, -0.5151033220944266],
    "cases": {
      "classical": {
        "covariance": [
          [0.01520629202577997, -0.0027251419401039404],
          [-0.0027251419401039404, 0.01090056776041575]
        ],
        "standardErrors": [0.12331379495328157, 0.10440578413294806],
        "tStats": [5.845094206025408, 11.633671642627377]
      },
      "hc0": {
        "covariance": [
          [0.01226554743022998, 0.002124642535510036],
          [0.002124642535510036, 0.007534200251700564]
        ],
        "standardErrors": [0.1107499319649, 0.0867997710348395],
        "tStats": [6.508182313221361, 13.993384956121954]
      },
      "hc1": {
        "covariance": [
          [0.012911102558136822, 0.002236465826852669],
          [0.0022364658268526688, 0.007930737107053224]
        ],
        "standardErrors": [0.11362703269089104, 0.08905468604769333],
        "tStats": [6.343391456549169, 13.639064535506428]
      },
      "nw4": {
        "covariance": [
          [0.011728662938651045, 0.0015650333735850452],
          [0.0015650333735850459, 0.0072274998068377625]
        ],
        "standardErrors": [0.10829895169691646, 0.0850147034743859],
        "tStats": [6.655472994988868, 14.287206336721589]
      },
      "hh4": {
        "covariance": [
          [0.016510916831188688, 0.0021809228443937924],
          [0.0021809228443937924, 0.008318374299194823]
        ],
        "standardErrors": [0.12849481246800856, 0.09120512211051977],
        "tStats": [5.609415155058377, 13.317482418607018]
      }
    }
  },
  {
    "coefficients": [0.7281655960451118, 1.2227494760184259, -0.3766625638739308],
    "r2": 0.8030808579045368,
    "adjR2": 0.7924365799534306,
    "fitted": [-1.19984348763664, -1.0590161831554705, -1.529563616683514],
    "residuals": [0.3623434876366398, 0.29714118315547056, -0.20815513331648616],
    "cases": {
      "classical": {
        "covariance": [
          [0.014041608983331441, -0.002499761638348922, -0.0006638502953175476],
          [-0.002499761638348922, 0.010072101849052642, -0.0007305529565695832],
          [-0.0006638502953175476, -0.0007305529565695832, 0.033859541378398306]
        ],
        "standardErrors": [0.11849729525745067, 0.10035986174289323, 0.18400962305922564],
        "tStats": [6.1449976091275165, 12.183650463279085, -2.0469720964142053]
      },
      "hc0": {
        "covariance": [
          [0.010793710482020484, 0.0021396018500999953, -8.062844140123294e-05],
          [0.0021396018500999953, 0.00858335698051331, -0.0012088196037404733],
          [-8.06284414012334e-05, -0.0012088196037404724, 0.022779746237490052]
        ],
        "standardErrors": [0.10389278358972044, 0.09264640835193402, 0.15092960689503584],
        "tStats": [7.0088178493771665, 13.19802351510047, -2.4956174711028116]
      },
      "hc1": {
        "covariance": [
          [0.011668876196778897, 0.002313083081189185, -8.716588259592761e-05],
          [0.0023130830811891848, 0.009279304843798172, -0.0013068320040437547],
          [-8.716588259592749e-05, -0.0013068320040437544, 0.02462675268917843]
        ],
        "standardErrors": [0.10802257262618262, 0.09632914846399387, 0.15692913269746453],
        "tStats": [6.74086515755336, 12.69345255839636, -2.4002080263839787]
      },
      "nw4": {
        "covariance": [
          [0.010641897113203073, 0.002575724089132796, -0.001970501366664359],
          [0.002575724089132795, 0.0076439287332894235, -0.007703376915373546],
          [-0.0019705013666643585, -0.007703376915373545, 0.037506886462985105]
        ],
        "standardErrors": [0.103159571117774, 0.08742956441209931, 0.19366694726510536],
        "tStats": [7.058633417676662, 13.985537778216477, -1.9448985446046598]
      },
      "hh4": {
        "covariance": [
          [0.014631175815542723, 0.0030548846748107536, -0.0022492462321229627],
          [0.003054884674810752, 0.0094529650859931, -0.010900905132597925],
          [-0.0022492462321229622, -0.010900905132597925, 0.05904585673027894]
        ],
        "standardErrors": [0.12095939738417484, 0.09722636003673645, 0.24299353228075626],
        "tStats": [6.0199175243276954, 12.576316500550023, -1.5500929606584446]
      }
    }
  },
  {
    "coefficients": [1.3523813740095907, -0.3422368120567094],
    "r2": 0.7191680893453383,
    "adjR2": 0.7043874624687771,
    "fitted": [-2.16215361099362, -1.9617812860247688, -2.4375996480607123],
    "residuals": [1.32465361099362, 1.1999062860247687, 0.6998808980607121],
    "cases": {
      "classical": {
        "covariance": [
          [0.0189402674504514, -0.0016697968785032691],
          [-0.0016697968785032691, 0.06655333272891609]
        ],
        "standardErrors": [0.13762364422747786, 0.25797932616571445],
        "tStats": [9.826664463079048, -1.326605573955456]
      },
      "hc0": {
        "covariance": [
          [0.01730632426627489, -0.0032420944759939565],
          [-0.0032420944759939565, 0.05171468925229555]
        ],
        "standardErrors": [0.13155350343595903, 0.2274086393528081],
        "tStats": [10.28008634272471, -1.5049419979412202]
      },
      "hc1": {
        "covariance": [
          [0.018217183438184088, -0.0034127310273620605],
          [-0.003412731027362061, 0.05443651500241637]
        ],
        "standardErrors": [0.1349710466662539, 0.2333163410531212],
        "tStats": [10.019788742941708, -1.4668360154798987]
      },
      "nw4": {
        "covariance": [
          [0.040009635417442416, -0.015904474609384538],
          [-0.01590447460938454, 0.04802561811371534]
        ],
        "standardErrors": [0.2000240870931359, 0.21914748028146558],
        "tStats": [6.761092594712807, -1.5616734977611975]
      },
      "hh4": {
        "covariance": [
          [0.06581805122998177, -0.027360278369344758],
          [-0.027360278369344758, 0.08594276514575291]
        ],
        "standardErrors": [0.256550289865324, 0.2931599651141897],
        "tStats": [5.271408481820553, -1.167406374616683]
      }
    }
  },
  {
    "coefficients": [1.02443640095287],
    "r2": 0.0,
    "adjR2": 0.0,
    "fitted": [1.02443640095287, 1.02443640095287, 1.02443640095287],
    "residuals": [-1.86193640095287, -1.78631140095287, -2.76215515095287],
    "cases": {
      "classical": {
        "covariance": [
          [0.06455893005306423]
        ],
        "standardErrors": [0.25408449392488364],
        "tStats": [4.031872961345408]
      },
      "hc0": {
        "covariance": [
          [0.06294495680173763]
        ],
        "standardErrors": [0.25088833532417887],
        "tStats": [4.083236471034697]
      },
      "hc1": {
        "covariance": [
          [0.06455893005306423]
        ],
        "standardErrors": [0.25408449392488364],
        "tStats": [4.031872961345408]
      },
      "nw4": {
        "covariance": [
          [0.23298387891431388]
        ],
        "standardErrors": [0.4826840363160086],
        "tStats": [2.1223747293813156]
      },
      "hh4": {
        "covariance": [
          [0.3962258510518079]
        ],
        "standardErrors": [0.629464733763384],
        "tStats": [1.6274722728755062]
      }
    }
  }
];
