"""Build a curated OEWS extract for the repo.

Requirements:
- pandas
- openpyxl
- requests

This writes the file expected by normalize_bls.ps1:
  data/raw/bls/oews_may_2024_extract.csv
"""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pandas as pd
import requests

URL = "https://www.bls.gov/oes/special.requests/oesm23nat.zip"
OUTPUT = Path("data/raw/bls/oews_may_2024_extract.csv")
DEFAULT_CONFIDENCE = 0.85


def main() -> None:
    print("Downloading data from BLS...")
    response = requests.get(URL, timeout=60)
    response.raise_for_status()

    zf = zipfile.ZipFile(io.BytesIO(response.content))
    excel_file = next(name for name in zf.namelist() if name.endswith(".xlsx"))

    with zf.open(excel_file) as fh:
        df = pd.read_excel(fh)

    mapping = {
        "occ_code": "onet_soc_code",
        "tot_emp": "employment_us",
        "a_median": "median_wage_usd",
        "a_pct25": "wage_p25_usd",
        "a_pct75": "wage_p75_usd",
    }

    df_final = df[list(mapping.keys())].rename(columns=mapping)
    df_final["labor_market_confidence"] = DEFAULT_CONFIDENCE

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    df_final.to_csv(OUTPUT, index=False)
    print(f"File saved as: {OUTPUT}")


if __name__ == "__main__":
    main()
