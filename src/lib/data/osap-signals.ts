/** OSAP metadata uses publication and sample years, not observation dates. */
export interface OsapSignal {
  readonly acronym: string;
  readonly authors: string;
  readonly publicationYear: number;
  /** OSAP's journal abbreviation, for example JF or JFE. */
  readonly journal: string;
  readonly sampleStartYear: number;
  readonly sampleEndYear: number;
  readonly category: 'Predictor';
  readonly predictability: '1_clear';
}

export interface OsapSignals {
  readonly id: 'osap-signals';
  readonly title: string;
  readonly source: string;
  readonly url: string;
  readonly citation: string;
  readonly retrieved: string;
  readonly release: string;
  readonly signals: readonly OsapSignal[];
}

/** Loaded separately so callers need not download the return matrix. */
export async function loadOsapSignals(): Promise<OsapSignals> {
  return (await import('../../data/series/osap-signals.json')).default as OsapSignals;
}
