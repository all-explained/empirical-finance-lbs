# Public data

These eleven datasets are small teaching extracts of public source files. They keep source units.
Public access does not imply an open licence. The site's code and content licences do not cover third-party data.

1. Install Node dependencies: `npm ci`.
2. Set up Python 3.11+ in one line: `python3 -m venv .venv && .venv/bin/python3 -m pip install -r scripts/data/requirements.txt`.
3. Rebuild every JSON file: `npm run data`.
4. Download current source files and rebuild: `npm run data -- --refresh`.
5. Check the results: `npm test && npm run build`.

The script also needs `curl`, included with macOS. It runs from the repository root.
Raw files stay in the ignored `data-raw/` directory. A normal run reuses this cache and rewrites all eleven outputs.
A fresh checkout downloads all sources without API keys. A failed download exits with an error.
Remove its raw cache file, or use `--refresh`, to try a source again.
The script validates all datasets and their sizes before replacing any JSON file.
Python dependencies, including indirect dependencies, are pinned in `scripts/data/requirements.txt`.

## Sources, terms and citations

Coverage below describes the checked-in extract retrieved on 2026-10-22 (`fred-cay-quarterly`: 2026-10-23).
Dates identify observation periods, not publication dates. Historical values can change after a source revision.
The source links provide the files or their download pages. Terms links give the available source notices.

| ID | Source URL | Terms of use | Citation | Coverage |
| --- | --- | --- | --- | --- |
| `ff3-monthly` | [French three-factor ZIP](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip) | Public academic download; © Eugene F. Fama and Kenneth R. French. No explicit open-data licence stated on the [library page](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html). | Fama and French (1993); Kenneth French Data Library. | 1926-07–2026-08 |
| `ff5-monthly` | [French five-factor ZIP](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_5_Factors_2x3_CSV.zip) | Public academic download; © Fama and French; no explicit open-data licence stated on the [library page](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html). | Fama and French (2015); Kenneth French Data Library. | 1963-07–2026-08 |
| `mom-monthly` | [French momentum ZIP](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Momentum_Factor_CSV.zip) | Public academic download; © Fama and French; no explicit open-data licence stated on the [library page](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html). | Carhart (1997); Kenneth French Data Library, momentum factor. | 1927-01–2026-08 |
| `ff25-size-bm-monthly` | [French 25-portfolio ZIP](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/25_Portfolios_5x5_CSV.zip) | Public academic download; © Fama and French; no explicit open-data licence stated on the [library page](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html). | Fama and French (1993); Kenneth French Data Library. | 1926-07–2026-08 |
| `shiller-monthly` | [Shiller XLS](http://www.econ.yale.edu/~shiller/data/ie_data.xls) | Public academic download; no explicit redistribution licence stated on the [source page](http://www.econ.yale.edu/~shiller/data.htm). Workbook disclaims accuracy and investment advice. | Shiller (2015), *Irrational Exuberance*, third edition; updated online data. | 1881-01–2023-06 |
| `goyal-welch-annual` | [Goyal source page](https://sites.google.com/view/agoyal145), [2025 workbook export](https://docs.google.com/spreadsheets/d/1qwpl2R_DNujpU5YUkk8lacP1tTeMb9iJ/export?format=xlsx) | Public research download; no explicit redistribution licence stated. Source notes that `ltr`/`corpr` use Bloomberg indices from 2022. | Welch and Goyal (2008); Amit Goyal's update through 2025. | 1871–2025; optional columns have gaps |
| `goyal-welch-monthly` | [Goyal source page](https://sites.google.com/view/agoyal145), [2025 workbook export](https://docs.google.com/spreadsheets/d/1qwpl2R_DNujpU5YUkk8lacP1tTeMb9iJ/export?format=xlsx) | Public research download; no explicit redistribution licence stated. Source notes that `ltr`/`corpr` use Bloomberg indices from 2022. | Welch and Goyal (2008); Amit Goyal's update through 2025. | 1871-01–2025-12; optional columns have gaps |
| `fred-treasury-monthly` | [FRED public CSV](https://fred.stlouisfed.org/graph/fredgraph.csv?id=GS1,GS2,GS3,GS5,GS7,GS10,GS20,GS30,TB3MS) | Board data are public domain unless indicated; cite the source. [Board terms](https://www.federalreserve.gov/disclaimer.htm), [FRED terms](https://fred.stlouisfed.org/legal/). | Board of Governors, H.15 Selected Interest Rates; retrieved from FRED, Federal Reserve Bank of St. Louis. | 1977-02–2026-09, complete months only |
| `gsw-zero-coupon` | [Federal Reserve GSW CSV](https://www.federalreserve.gov/data/yield-curve-tables/feds200628.csv) | [Board terms](https://www.federalreserve.gov/disclaimer.htm): public domain unless indicated; cite the Board. Staff research product, subject to revision. | Gürkaynak, Sack and Wright (2007), FEDS 2006-28. | 1985-11-29–2026-09-30, end of completed month |
| `fred-consumption-quarterly` | [FRED public CSV](https://fred.stlouisfed.org/graph/fredgraph.csv?id=PCNDGC96,PCESVC96,B230RC0Q173SBEA) | U.S. government BEA data; cite BEA and FRED. [BEA policy](https://www.bea.gov/about/policies-and-information), [FRED terms](https://fred.stlouisfed.org/legal/). | U.S. Bureau of Economic Analysis, NIPA; retrieved from FRED, Federal Reserve Bank of St. Louis. | 2007-Q1–2026-Q2 |
| `fred-cay-quarterly` | [FRED public CSV](https://fred.stlouisfed.org/graph/fredgraph.csv?id=PCND,PCESV,DNDGRG3Q086SBEA,DSERRG3Q086SBEA,TNWBSHNO,COE,A577RC1Q027SBEA,A061RC1Q027SBEA,PCECTPI,B230RC0Q173SBEA) | BEA data and Board Financial Accounts data; public domain unless indicated; cite BEA, the Board and FRED. [BEA policy](https://www.bea.gov/about/policies-and-information), [Board terms](https://www.federalreserve.gov/disclaimer.htm), [FRED terms](https://fred.stlouisfed.org/legal/). | U.S. Bureau of Economic Analysis, NIPA; Board of Governors, Financial Accounts of the United States (Z.1); retrieved from FRED, Federal Reserve Bank of St. Louis. Lettau and Ludvigson (2001). | 1951-Q4–2026-Q2 |

The French, Shiller and Goyal sources have no explicit redistribution licence located during this task.
These limited teaching extracts follow the goal's assumption that small derived public academic datasets may be included.
They do not grant broader reuse rights. Preserve source attribution and notices when using them.

Full paper citations:

- Fama, E. F., and K. R. French (1993). “Common risk factors in the returns on stocks and bonds.” *Journal of Financial Economics* 33, 3–56.
- Fama, E. F., and K. R. French (2015). “A five-factor asset pricing model.” *Journal of Financial Economics* 116, 1–22.
- Carhart, M. M. (1997). “On persistence in mutual fund performance.” *Journal of Finance* 52, 57–82.
- Shiller, R. J. (2015). *Irrational Exuberance*. Third edition. Princeton University Press.
- Welch, I., and A. Goyal (2008). “A comprehensive look at the empirical performance of equity premium prediction.” *Review of Financial Studies* 21, 1455–1508.
- Lettau, M., and S. Ludvigson (2001). “Consumption, aggregate wealth, and expected stock returns.” *Journal of Finance* 56, 815–849.
- Gürkaynak, R. S., B. Sack, and J. H. Wright (2007). “The U.S. Treasury yield curve: 1961 to the present.” *Journal of Monetary Economics* 54, 2291–2304.

## File contract and transformations

Each file has `id`, `title`, `source`, `url`, `citation`, `retrieved`, `frequency`, `columns` and `rows`.
`retrieved` is the raw file's download date, retained when the cache is reused.
Each column has `name`, `unit`, `description` and `required`. Each row is an array in column order.
Column zero is `date`, an ISO `YYYY-MM-DD` string. Other cells are numbers, or `null` for optional predictors.
Required columns cannot contain missing values. Dates are sorted and unique.
No gaps are filled, no returns are calculated, and no source units are converted.

- French: use the first monthly table only. Portfolio returns are value weighted.
  `ME1-BM1` means the smallest size group and lowest book-to-market group.
  Size varies from 1 to 5, then book-to-market varies from 1 to 5 within each size.
  Returns and factors are **percent per month**, including RF. Divide by 100 for decimal returns.
  Drop source missing-value markers `-99.99` and `-999`. Preserve source precision: two or four decimals.
- Shiller: use `Data` sheet columns A/B/C/D/E/G/M. Retain months with all six requested numeric fields.
  CAPE starts in 1881. Earnings and dividends end in June 2023 in the published workbook.
  Parse numeric `YYYY.MM` dates with two month digits; `1881.1` means October.
  Round workbook numbers to six decimal places to remove spreadsheet arithmetic noise.
  This endpoint currently needs HTTP; the HTTPS endpoint fails. These are public data without credentials.
- Goyal–Welch: use `Annual` and `Monthly`, retaining all source predictor columns and all periods with Index/D12/E12.
  Those three fields are required; other predictors are optional and keep source gaps as `null`.
  Monthly `csp` covers 1937-05–2002-12. Annual `csp` covers 1937–2002, `cay` starts in 1945, and `ik` in 1947.
  Monthly and annual schemas differ because the source provides more annual predictors.
  Rates and returns stay in **decimal** units. Round workbook numbers to eight decimal places.
  No logarithmic predictors, spreads or equity premiums are derived here.
- FRED Treasury: use monthly-average `GS1/2/3/5/7/10/20/30` and `TB3MS`, with no API key.
  Keep months where every yield is available. This excludes early history and the GS30 reporting gap in 2002–2006.
  GS yields use an investment basis; TB3MS uses a discount basis. Yields are percent per year.
- GSW: take the final daily source observation of each completed month, then require all 30 yields.
  Keep its trading-day date. Exclude the current unfinished month; do not substitute an earlier complete day.
  `SVENY01`–`SVENY30` are continuously compounded annual zero-coupon yields in percent.
  Round to four decimal places, consistent with the precision of recent source rows.
  Partial historical maturity coverage before November 1985 is excluded.
- Consumption: use quarterly real nondurable goods (`PCNDGC96`), real services (`PCESVC96`) and total population
  (`B230RC0Q173SBEA`). Keep quarters with all three fields. No monthly-to-quarterly averaging occurs.
  Real consumption is billions of chained 2017 dollars at a seasonally adjusted annual rate (SAAR).
  Population is thousands of persons, including Armed Forces overseas. These are levels, not per-person values.
  Chained-dollar components are not generally additive. Do not add them as an exact total real consumption series.
- cay inputs: ten quarterly FRED series for the Lettau–Ludvigson (2001) consumption–wealth–income residual.
  Keep quarters with all ten fields, from 1951-Q4. Before then Z.1 net worth has year-end values only,
  so those isolated fourth quarters are dropped and the script fails on any gap in the quarterly run.
  No deflating, per-person scaling, logs or `cay` estimation happens here; the library does that.
  - Consumption: nominal nondurable goods (`PCND`) and services (`PCESV`), billions of USD at SAAR, with their
    chain-type price indexes (`DNDGRG3Q086SBEA`, `DSERRG3Q086SBEA`, 2017=100). Lettau–Ludvigson use real
    nondurables and services in 1992 chained dollars and remove shoes and clothing; these totals keep them.
  - Asset wealth: household and nonprofit net worth (`TNWBSHNO`), Z.1, **millions** of USD, end of quarter,
    not seasonally adjusted. It stands in for the Board's household net worth series used in the paper.
  - Labour income parts, billions of USD at SAAR: compensation of employees (`COE`, wages and salaries plus
    supplements, which covers the paper's "other labour income"), personal current transfer receipts
    (`A577RC1Q027SBEA`) and contributions for government social insurance, domestic (`A061RC1Q027SBEA`,
    employee and employer parts). The paper's labour income is wages and salaries plus transfers plus other
    labour income, minus social insurance contributions, minus a labour share of personal taxes.
    **Labour taxes are not removed here**, so labour income built from these columns is pre-tax.
  - Deflator and scale: PCE chain-type price index (`PCECTPI`, 2017=100) and total population
    (`B230RC0Q173SBEA`, thousands, including Armed Forces overseas). The paper deflates wealth and income by
    the PCE deflator with 1992=100 and uses per-person values.
  - Two ID swaps, both checked against the FRED CSV header and titles on 2026-10-23.
    `W209RC1Q027SBEA` (compensation of employees received) is discontinued and ends in 2015-Q2. FRED has no
    current quarterly series for that NIPA Table 2.1 line, so `COE` (Table 1.12 line 2, compensation paid)
    stands in. In this vintage its quarters equal the three-month means of the monthly received series
    `W209RC1` within 0.001%. `PCTR` is monthly, so `A577RC1Q027SBEA`, the quarterly series for the same
    Table 2.1 line, replaces it.
  - FRED sends these series as a ZIP with one CSV per aggregation type (`quarterly.csv` and
    `quarterly,_end_of_period.csv`). The script joins the CSVs by observation date.

## Typed loaders and validation

```ts
import { loadSeries, getColumn, betweenDates, dateRange } from '../lib/data/series';

const factors = await loadSeries('ff3-monthly');
const sample = betweenDates(factors, '2000-01-01', '2020-12-01');
const marketPercent = getColumn(sample, 'Mkt-RF');
const coverage = dateRange(sample);
```

Dataset IDs and numeric column names are checked by TypeScript.
Loads are asynchronous; Vite creates a separate chunk for each requested JSON file.
`getColumn` returns `number | null` cells, so callers must handle optional predictors.
`betweenDates` includes both bounds and keeps source metadata. `dateRange` returns `null` for an empty sample.
Use full ISO date bounds. A slice ending on `2020-01-01` excludes the GSW observation on `2020-01-31`.

`src/lib/data/series.test.ts` checks each dataset's schema, dates, required values and three raw-source cells.
Comments identify the original workbook sheet and cell or CSV line and column.
Tests run offline against checked-in JSON. If a source revises a reference value, inspect the raw file before updating its test.
