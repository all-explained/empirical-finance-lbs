const osapSignals = [
  'AM', 'AbnormalAccruals', 'Accruals', 'AccrualsBM', 'Activism1',
  'AnalystRevision', 'AnnouncementReturn', 'AssetGrowth', 'BM', 'BMdec',
  'BPEBM', 'BetaLiquidityPS', 'BetaTailRisk', 'BookLeverage', 'CBOperProf',
  'CF', 'CPVolSpread', 'Cash', 'CashProd', 'ChAssetTurnover',
  'ChEQ', 'ChForecastAccrual', 'ChInv', 'ChInvIA', 'ChNAnalyst',
  'ChNNCOA', 'ChNWC', 'ChTax', 'ChangeInRecommendation', 'CitationsRD',
  'CompEquIss', 'CompositeDebtIssuance', 'ConvDebt', 'CoskewACX', 'CredRatDG',
  'CustomerMomentum', 'DelBreadth', 'DelCOA', 'DelCOL', 'DelEqu',
  'DelFINL', 'DelLTI', 'DelNetFin', 'DivInit', 'DivOmit',
  'DivSeason', 'DivYieldST', 'DolVol', 'EBM', 'EP',
  'EarnSupBig', 'EarningsConsistency', 'EarningsForecastDisparity', 'EarningsStreak', 'EarningsSurprise',
  'EntMult', 'EquityDuration', 'ExchSwitch', 'ExclExp', 'FEPS',
  'FirmAgeMom', 'ForecastDispersion', 'Frontier', 'GP', 'Governance',
  'GrAdExp', 'Herf', 'HerfBE', 'IdioVol3F', 'IdioVolAHT',
  'Illiquidity', 'IndIPO', 'IndMom', 'IndRetBig', 'IntMom',
  'IntanBM', 'IntanCFP', 'IntanEP', 'IntanSP', 'InvGrowth',
  'InvestPPEInv', 'Investment', 'LRreversal', 'Leverage', 'MS',
  'MaxRet', 'MeanRankRevGrowth', 'Mom12m', 'Mom12mOffSeason', 'Mom6m',
  'Mom6mJunk', 'MomOffSeason', 'MomOffSeason06YrPlus', 'MomOffSeason16YrPlus', 'MomRev',
  'MomSeason', 'MomSeason06YrPlus', 'MomSeason11YrPlus', 'MomSeason16YrPlus', 'MomSeasonShort',
  'MomVol', 'NOA', 'NetDebtFinance', 'NetDebtPrice', 'NetEquityFinance',
  'NetPayoutYield', 'OPLeverage', 'OScore', 'OptionVolume1', 'OrderBacklog',
  'OrderBacklogChg', 'OrgCap', 'PS', 'PatentsRD', 'PayoutYield',
  'PctAcc', 'PctTotAcc', 'Price', 'PriceDelayRsq', 'RD',
  'RDAbility', 'RDIPO', 'RDS', 'RDcap', 'REV6',
  'RIO_Disp', 'RIO_MB', 'RIO_Turnover', 'RIO_Volatility', 'RIVolSpread',
  'RealizedVol', 'Recomm_ShortInterest', 'ResidualMomentum', 'ReturnSkew', 'ReturnSkew3F',
  'RevenueSurprise', 'STreversal', 'ShareIss1Y', 'ShareIss5Y', 'ShareVol',
  'Size', 'SmileSlope', 'SurpriseRD', 'Tax', 'TotalAccruals',
  'TrendFactor', 'VolSD', 'XFIN', 'betaVIX', 'cfp',
  'dCPVolSpread', 'dNoa', 'dVolCall', 'fgr5yrLag', 'grcapx',
  'grcapx3y', 'hire', 'retConglomerate', 'roaq', 'sfe',
  'std_turn', 'tang', 'zerotrade12M', 'zerotrade1M', 'zerotrade6M',
] as const;

/** Public series retain source units. See docs/DATA.md before combining datasets. */
export const seriesColumns = {
  'osap-ls-monthly': osapSignals,
  'ff3-monthly': ['Mkt-RF', 'SMB', 'HML', 'RF'],
  'ff5-monthly': ['Mkt-RF', 'SMB', 'HML', 'RMW', 'CMA', 'RF'],
  'mom-monthly': ['Mom'],
  'ff25-size-bm-monthly': [
    'ME1-BM1', 'ME1-BM2', 'ME1-BM3', 'ME1-BM4', 'ME1-BM5',
    'ME2-BM1', 'ME2-BM2', 'ME2-BM3', 'ME2-BM4', 'ME2-BM5',
    'ME3-BM1', 'ME3-BM2', 'ME3-BM3', 'ME3-BM4', 'ME3-BM5',
    'ME4-BM1', 'ME4-BM2', 'ME4-BM3', 'ME4-BM4', 'ME4-BM5',
    'ME5-BM1', 'ME5-BM2', 'ME5-BM3', 'ME5-BM4', 'ME5-BM5',
  ],
  'shiller-monthly': ['price', 'dividend', 'earnings', 'cpi', 'long_rate', 'cape'],
  'goyal-welch-annual': [
    'Index', 'D12', 'E12', 'b/m', 'tbl', 'AAA', 'BAA', 'lty', 'cay', 'ntis',
    'Rfree', 'infl', 'eqis', 'ltr', 'corpr', 'svar', 'csp', 'ik', 'CRSP_SPvw', 'CRSP_SPvwx',
  ],
  'goyal-welch-monthly': [
    'Index', 'D12', 'E12', 'b/m', 'tbl', 'AAA', 'BAA', 'lty', 'ntis',
    'Rfree', 'infl', 'ltr', 'corpr', 'svar', 'csp', 'CRSP_SPvw', 'CRSP_SPvwx',
  ],
  'fred-treasury-monthly': ['GS1', 'GS2', 'GS3', 'GS5', 'GS7', 'GS10', 'GS20', 'GS30', 'TB3MS'],
  'gsw-zero-coupon': [
    'SVENY01', 'SVENY02', 'SVENY03', 'SVENY04', 'SVENY05', 'SVENY06',
    'SVENY07', 'SVENY08', 'SVENY09', 'SVENY10', 'SVENY11', 'SVENY12',
    'SVENY13', 'SVENY14', 'SVENY15', 'SVENY16', 'SVENY17', 'SVENY18',
    'SVENY19', 'SVENY20', 'SVENY21', 'SVENY22', 'SVENY23', 'SVENY24',
    'SVENY25', 'SVENY26', 'SVENY27', 'SVENY28', 'SVENY29', 'SVENY30',
  ],
  'fred-consumption-quarterly': ['PCNDGC96', 'PCESVC96', 'B230RC0Q173SBEA'],
  'fred-cay-quarterly': [
    'PCND', 'PCESV', 'DNDGRG3Q086SBEA', 'DSERRG3Q086SBEA', 'TNWBSHNO',
    'COE', 'A577RC1Q027SBEA', 'A061RC1Q027SBEA', 'PCECTPI', 'B230RC0Q173SBEA',
  ],
} as const;

export type SeriesId = keyof typeof seriesColumns;
export type ColumnName<I extends SeriesId> = (typeof seriesColumns)[I][number];
export type SeriesRow = readonly [date: string, ...values: (number | null)[]];
export interface Series<I extends SeriesId = SeriesId> {
  readonly id: I;
  readonly title: string;
  readonly source: string;
  readonly url: string;
  readonly citation: string;
  readonly retrieved: string;
  readonly frequency: 'monthly' | 'quarterly' | 'annual';
  readonly columns: readonly {
    readonly name: 'date' | ColumnName<I>;
    readonly unit: string;
    readonly description: string;
    readonly required: boolean;
  }[];
  readonly rows: readonly SeriesRow[];
}

// Vite emits separate chunks: a widget downloads only the dataset it requests.
const modules = import.meta.glob<{ default: unknown }>('../../data/series/*.json');

export async function loadSeries<I extends SeriesId>(id: I): Promise<Series<I>> {
  const load = modules[`../../data/series/${id}.json`];
  if (!load) throw new RangeError(`Unknown series: ${id}`);
  return (await load()).default as Series<I>;
}

export function getColumn<I extends SeriesId>(series: Series<I>, name: ColumnName<NoInfer<I>>): readonly (number | null)[] {
  const index = series.columns.findIndex((column) => column.name === name);
  if (index < 1) throw new RangeError(`Unknown numeric column: ${name}`);
  return series.rows.map((row) => row[index] as number | null);
}

/** Return the actual first/last observation; GSW dates are final trading days. */
export function dateRange(series: Series): { start: string; end: string } | null {
  const first = series.rows[0];
  const last = series.rows.at(-1);
  return first && last ? { start: first[0], end: last[0] } : null;
}

/** Inclusive bounds in ISO YYYY-MM-DD form. Source metadata stays with the slice. */
export function betweenDates<I extends SeriesId>(series: Series<I>, start: string, end: string): Series<I> {
  if (start > end) throw new RangeError('Start date must not follow end date');
  return { ...series, rows: series.rows.filter(([date]) => date >= start && date <= end) };
}
