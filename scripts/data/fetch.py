"""Rebuild the public course datasets (Python 3.11+, curl required).

Setup: python3 -m venv .venv && .venv/bin/python3 -m pip install -r scripts/data/requirements.txt
Run: npm run data

CLI Arguments:
--refresh: download current source files instead of using the raw cache.

Reads public CSV/ZIP/XLS/XLSX sources into ignored data-raw/ and rewrites all
src/data/series/*.json. Processing only. Each row follows the columns array;
column zero is an ISO date, all other cells are finite source-unit numbers or declared optional nulls.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import math
import re
import subprocess
from datetime import date
from decimal import Decimal
from io import StringIO
from pathlib import Path
from zipfile import ZipFile

import openpyxl
import xlrd
from rich.logging import RichHandler

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW = PROJECT_ROOT / "data-raw"
OUTPUT = PROJECT_ROOT / "src/data/series"
FRENCH = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/"
FRENCH_PAGE = (
    "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html"
)
FRED = "https://fred.stlouisfed.org/graph/fredgraph.csv?id="
LOG = logging.getLogger(__name__)


def download(filename: str, url: str, refresh: bool) -> Path:
    """Cache only successful responses; retain their actual retrieval date."""
    path = RAW / filename
    if refresh or not path.exists():
        temporary = path.with_suffix(path.suffix + ".tmp")
        LOG.info("Downloading %s", url)
        try:
            subprocess.run(
                [
                    "curl",
                    "--fail",
                    "--location",
                    "--silent",
                    "--show-error",
                    "--retry",
                    "2",
                    "--max-time",
                    "120",
                    url,
                    "--output",
                    str(temporary),
                ],
                check=True,
            )
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    return path


def column(name: str, unit: str, description: str) -> dict:
    return {"name": name, "unit": unit, "description": description, "required": True}


def numeric(value: object) -> float | None:
    if value is None or str(value).strip() in ("", "NA", "N/A", "."):
        return None
    try:
        number = float(value)
    except (ValueError, TypeError):
        return None
    return number if math.isfinite(number) else None


def complete(values: list) -> bool:
    return all(value is not None for value in values)


def series(
    identifier: str,
    title: str,
    source: str,
    url: str,
    citation: str,
    frequency: str,
    columns: list[dict],
    rows: list[list],
    inputs: list[Path],
) -> dict:
    if not rows:
        raise ValueError(
            f"{identifier}: source layout changed or no complete observations"
        )
    if rows != sorted(rows) or len({row[0] for row in rows}) != len(rows):
        raise ValueError(f"{identifier}: dates must be sorted and unique")
    if any(
        len(row) != len(columns) + 1
        or any(
            col["required"] and row[index + 1] is None
            for index, col in enumerate(columns)
        )
        for row in rows
    ):
        raise ValueError(f"{identifier}: incomplete or malformed row")
    return {
        "id": identifier,
        "title": title,
        "source": source,
        "url": url,
        "citation": citation,
        "retrieved": max(
            date.fromtimestamp(path.stat().st_mtime).isoformat() for path in inputs
        ),
        "frequency": frequency,
        "columns": [
            column("date", "ISO 8601", "Observation period; see docs/DATA.md"),
            *columns,
        ],
        "rows": rows,
    }


def french(
    filename: str, identifier: str, title: str, names: list[str], refresh: bool
) -> dict:
    path = download(filename + "_CSV.zip", FRENCH + filename + "_CSV.zip", refresh)
    with ZipFile(path) as archive:
        text = archive.read(archive.namelist()[0]).decode("utf-8-sig")
    records = list(csv.reader(StringIO(text)))
    start = next(
        i
        for i, row in enumerate(records)
        if row and re.fullmatch(r"\s*\d{6}\s*", row[0])
    )
    rows = []
    for record in records[start:]:
        if not record or not re.fullmatch(r"\s*\d{6}\s*", record[0]):
            break  # First monthly block only: excludes annual and equal-weighted tables.
        stamp = record[0].strip()
        values = [numeric(value) for value in record[1:]]
        if len(values) != len(names):
            raise ValueError(f"{filename}: unexpected columns")
        if complete(values) and not any(value in (-99.99, -999) for value in values):
            rows.append([f"{stamp[:4]}-{stamp[4:]}-01", *values])
    return series(
        identifier,
        title,
        "Kenneth French Data Library",
        FRENCH + filename + "_CSV.zip",
        "Fama and French (1993), Journal of Financial Economics 33, 3–56; "
        "Fama and French (2015), Journal of Financial Economics 116, 1–22. "
        "Momentum: Carhart (1997), Journal of Finance 52, 57–82.",
        "monthly",
        [
            column(
                name, "percent", "Monthly return; source units (not decimal returns)"
            )
            for name in names
        ],
        rows,
        [path],
    )


def fred(
    identifier: str,
    title: str,
    names: list[str],
    columns: list[dict],
    frequency: str,
    refresh: bool,
) -> dict:
    url = FRED + ",".join(names)
    path = download(identifier + ".csv", url, refresh)
    records = csv.DictReader(StringIO(path.read_text()))
    if records.fieldnames != ["observation_date", *names]:
        raise ValueError(f"{identifier}: unexpected FRED header {records.fieldnames}")
    rows = []
    for record in records:
        values = [numeric(record[name]) for name in names]
        if complete(values):
            rows.append([record["observation_date"], *values])
    return series(
        identifier,
        title,
        "FRED, Federal Reserve Bank of St. Louis",
        url,
        "Board of Governors of the Federal Reserve System (H.15) / U.S. Bureau of "
        "Economic Analysis (NIPA), retrieved from FRED, Federal Reserve Bank of St. Louis.",
        frequency,
        columns,
        rows,
        [path],
    )


def shiller(refresh: bool) -> dict:
    url = "http://www.econ.yale.edu/~shiller/data/ie_data.xls"
    path = download("ie_data.xls", url, refresh)
    sheet = xlrd.open_workbook(path).sheet_by_name("Data")
    names = [
        ("price", 1, "USD", "S&P composite stock price"),
        ("dividend", 2, "USD/year", "Annualized dividend per index unit"),
        ("earnings", 3, "USD/year", "Annualized earnings per index unit"),
        ("cpi", 4, "index 1982–84=100", "Consumer Price Index"),
        ("long_rate", 6, "percent", "Long-term interest rate"),
        ("cape", 12, "ratio", "Cyclically adjusted price/earnings ratio"),
    ]
    rows = []
    for record in sheet.get_rows():
        stamp = numeric(record[0].value)
        if stamp is None or not 1800 < stamp < 2200:
            continue
        # Decimal avoids interpreting October (e.g. 1881.10) as January.
        year_month = f"{Decimal(str(stamp)):.2f}"
        year, month = year_month.split(".")
        values = [numeric(record[index].value) for _, index, _, _ in names]
        if complete(values):
            rows.append(
                [
                    date(int(year), int(month), 1).isoformat(),
                    *[round(value, 6) for value in values],
                ]
            )
    return series(
        "shiller-monthly",
        "Shiller stock market data",
        "Robert Shiller, Yale University",
        url,
        "Robert J. Shiller, Irrational Exuberance, 3rd ed. (2015), "
        "updated online data, Yale University.",
        "monthly",
        [column(name, unit, description) for name, _, unit, description in names],
        rows,
        [path],
    )


def gsw(refresh: bool) -> dict:
    url = "https://www.federalreserve.gov/data/yield-curve-tables/feds200628.csv"
    path = download("feds200628.csv", url, refresh)
    text = path.read_text(encoding="utf-8-sig")
    header = text.index("Date,BETA0,")
    names = [f"SVENY{year:02}" for year in range(1, 31)]
    monthly = {}
    for record in csv.DictReader(StringIO(text[header:])):
        stamp = record["Date"]
        # Keep the last source observation, even if incomplete, before dropping missing months.
        monthly[stamp[:7]] = [
            stamp,
            *[
                round(value, 4)
                if (value := numeric(record[name])) is not None
                else None
                for name in names
            ],
        ]
    # Exclude the current, unfinished month; retain last trading-day date for auditability.
    rows = [
        row
        for month, row in sorted(monthly.items())
        if month < date.today().strftime("%Y-%m") and complete(row)
    ]
    return series(
        "gsw-zero-coupon",
        "GSW zero-coupon Treasury yields, end of month",
        "Board of Governors of the Federal Reserve System",
        url,
        "Gürkaynak, Sack and Wright (2007), The U.S. Treasury yield curve: 1961 "
        "to the present, Journal of Monetary Economics 54, 2291–2304; FEDS 2006-28.",
        "monthly",
        [
            column(
                name,
                "percent/year",
                f"{year}-year continuously compounded zero-coupon yield",
            )
            for year, name in enumerate(names, 1)
        ],
        rows,
        [path],
    )


def goyal_welch(refresh: bool) -> list[dict]:
    url = "https://docs.google.com/spreadsheets/d/1qwpl2R_DNujpU5YUkk8lacP1tTeMb9iJ/export?format=xlsx"
    path = download("PredictorData2025.xlsx", url, refresh)
    descriptions = {
        "Index": ("index", "S&P 500 index level"),
        "D12": ("USD/year", "Trailing 12-month dividends"),
        "E12": ("USD/year", "Trailing 12-month earnings"),
        "b/m": ("ratio", "Book-to-market ratio"),
        "tbl": ("decimal/year", "Treasury bill rate"),
        "AAA": ("decimal/year", "AAA-rated corporate bond yield"),
        "BAA": ("decimal/year", "BAA-rated corporate bond yield"),
        "lty": ("decimal/year", "Long-term government bond yield"),
        "cay": ("log ratio", "Consumption, wealth and income residual"),
        "ntis": ("ratio", "Net equity expansion"),
        "Rfree": ("decimal/period", "Risk-free return"),
        "infl": ("decimal/period", "Inflation rate"),
        "eqis": ("ratio", "Equity issuance share"),
        "ltr": ("decimal/period", "Long-term government bond return"),
        "corpr": ("decimal/period", "Long-term corporate bond return"),
        "svar": ("squared decimal returns", "Stock return variance"),
        "csp": ("ratio", "Cross-sectional premium (discontinued series)"),
        "ik": ("ratio", "Investment-to-capital ratio"),
        "CRSP_SPvw": (
            "decimal/period",
            "CRSP value-weighted S&P return with dividends",
        ),
        "CRSP_SPvwx": (
            "decimal/period",
            "CRSP value-weighted S&P return without dividends",
        ),
    }
    datasets = []
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        for sheet_name, frequency in [("Monthly", "monthly"), ("Annual", "annual")]:
            records = iter(workbook[sheet_name].values)
            header = list(next(records))
            names = [name for name in header[1:] if name is not None]
            if set(names) - descriptions.keys():
                raise ValueError(f"Unknown Goyal–Welch columns: {names}")
            columns = [column(name, *descriptions[name]) for name in names]
            # Preserve early and discontinued predictor histories rather than filling gaps.
            for col in columns:
                col["required"] = col["name"] in ("Index", "D12", "E12")
            rows = []
            for record in records:
                if numeric(record[0]) is None:
                    continue
                stamp = str(int(record[0]))
                observation = (
                    f"{stamp[:4]}-{stamp[4:]}-01"
                    if frequency == "monthly"
                    else f"{stamp}-01-01"
                )
                values = [
                    round(value, 8) if (value := numeric(cell)) is not None else None
                    for cell in record[1 : len(names) + 1]
                ]
                if complete(values[:3]):
                    rows.append([observation, *values])
            datasets.append(
                series(
                    f"goyal-welch-{frequency}",
                    f"Goyal–Welch equity premium predictors ({frequency})",
                    "Amit Goyal, updated Welch–Goyal data through 2025",
                    url,
                    "Welch and Goyal (2008), A Comprehensive Look at the Empirical Performance "
                    "of Equity Premium Prediction, Review of Financial Studies 21, 1455–1508; update through 2025.",
                    frequency,
                    columns,
                    rows,
                    [path],
                )
            )
    finally:
        workbook.close()
    return datasets


def build_all(refresh: bool) -> list[dict]:
    datasets = [
        french(
            "F-F_Research_Data_Factors",
            "ff3-monthly",
            "Fama–French three factors",
            ["Mkt-RF", "SMB", "HML", "RF"],
            refresh,
        ),
        french(
            "F-F_Research_Data_5_Factors_2x3",
            "ff5-monthly",
            "Fama–French five factors",
            ["Mkt-RF", "SMB", "HML", "RMW", "CMA", "RF"],
            refresh,
        ),
        french(
            "F-F_Momentum_Factor", "mom-monthly", "Momentum factor", ["Mom"], refresh
        ),
        french(
            "25_Portfolios_5x5",
            "ff25-size-bm-monthly",
            "25 size × book-to-market portfolios, value weighted",
            [f"ME{size}-BM{bm}" for size in range(1, 6) for bm in range(1, 6)],
            refresh,
        ),
        shiller(refresh),
    ]
    datasets.extend(goyal_welch(refresh))
    treasury = ["GS1", "GS2", "GS3", "GS5", "GS7", "GS10", "GS20", "GS30", "TB3MS"]
    datasets.append(
        fred(
            "fred-treasury-monthly",
            "Treasury constant-maturity yields and T-bills",
            treasury,
            [
                column(
                    name,
                    "percent/year",
                    "Monthly average yield; TB3MS is discount basis",
                )
                for name in treasury
            ],
            "monthly",
            refresh,
        )
    )
    datasets.append(gsw(refresh))
    datasets.append(
        fred(
            "fred-consumption-quarterly",
            "Real consumption and population",
            ["PCNDGC96", "PCESVC96", "B230RC0Q173SBEA"],
            [
                column(
                    "PCNDGC96",
                    "billions of chained 2017 USD/year",
                    "Real nondurable goods consumption; SAAR",
                ),
                column(
                    "PCESVC96",
                    "billions of chained 2017 USD/year",
                    "Real services consumption; SAAR",
                ),
                column(
                    "B230RC0Q173SBEA",
                    "thousands of persons",
                    "Total population including Armed Forces overseas",
                ),
            ],
            "quarterly",
            refresh,
        )
    )
    return datasets


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh", action="store_true", help="Download current raw sources"
    )
    args = parser.parse_args()
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        handlers=[RichHandler(show_path=False)],
    )
    RAW.mkdir(exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    datasets = build_all(args.refresh)
    # Validate every output before replacing any checked-in dataset.
    outputs = [
        (
            OUTPUT / f"{item['id']}.json",
            json.dumps(item, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
            + "\n",
        )
        for item in datasets
    ]
    for path, content in outputs:
        if len(content.encode()) >= 1_000_000:
            raise ValueError(f"{path.name}: exceeds 1 MB")
    for path, content in outputs:
        temporary = path.with_suffix(".json.tmp")
        temporary.write_text(content)
        temporary.replace(path)
        LOG.info("Wrote %s (%s bytes)", path.name, len(content.encode()))


if __name__ == "__main__":
    main()
