"""Extract a curated OEWS CSV from a BLS xlsx workbook without pandas/openpyxl.

Expected output:
  data/raw/bls/oews_may_2024_extract.csv
"""

from __future__ import annotations

import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    name = "xl/sharedStrings.xml"
    if name not in zf.namelist():
        return []
    root = ET.fromstring(zf.read(name))
    values: list[str] = []
    for si in root.findall("main:si", NS):
        values.append("".join((t.text or "") for t in si.iterfind(".//main:t", NS)))
    return values


def iter_rows(zf: zipfile.ZipFile, sheet_path: str, shared: list[str]):
    context = ET.iterparse(zf.open(sheet_path), events=("end",))
    for _, elem in context:
        if elem.tag != f"{{{NS['main']}}}row":
            continue
        row = []
        for c in elem.findall("main:c", NS):
            cell_type = c.attrib.get("t")
            value_elem = c.find("main:v", NS)
            value = value_elem.text if value_elem is not None else ""
            if cell_type == "s" and value:
                value = shared[int(value)]
            row.append(value)
        if row:
            yield row
        elem.clear()


def to_onet_soc(occ_code: str) -> str:
    occ_code = occ_code.strip()
    if re.fullmatch(r"\d{2}-\d{4}", occ_code):
        return f"{occ_code}.00"
    return occ_code


def main() -> int:
    xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/raw/bls/all_data_M_2024.xlsx")
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data/raw/bls/oews_may_2024_extract.csv")

    if not xlsx_path.exists():
        raise SystemExit(f"Missing workbook: {xlsx_path}")

    with zipfile.ZipFile(xlsx_path) as zf:
        shared = load_shared_strings(zf)
        rows = iter_rows(zf, "xl/worksheets/sheet1.xml", shared)
        header = next(rows)
        header_index = {name: idx for idx, name in enumerate(header)}

        required = [
            "AREA",
            "NAICS",
            "I_GROUP",
            "OWN_CODE",
            "OCC_CODE",
            "O_GROUP",
            "TOT_EMP",
            "A_MEDIAN",
            "A_PCT25",
            "A_PCT75",
        ]
        for col in required:
            if col not in header_index:
                raise SystemExit(f"Missing expected OEWS column: {col}")

        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(
                fh,
                fieldnames=[
                    "onet_soc_code",
                    "employment_us",
                    "median_wage_usd",
                    "wage_p25_usd",
                    "wage_p75_usd",
                ],
            )
            writer.writeheader()

            count = 0
            for row in rows:
                area = row[header_index["AREA"]]
                naics = row[header_index["NAICS"]]
                i_group = row[header_index["I_GROUP"]].lower()
                own_code = row[header_index["OWN_CODE"]]
                o_group = row[header_index["O_GROUP"]].lower()
                occ_code = row[header_index["OCC_CODE"]]
                if area != "99":
                    continue
                if naics != "000000":
                    continue
                if i_group != "cross-industry":
                    continue
                if own_code != "1235":
                    continue
                if o_group != "detailed":
                    continue
                if not re.fullmatch(r"\d{2}-\d{4}", occ_code):
                    continue

                writer.writerow(
                    {
                        "onet_soc_code": to_onet_soc(occ_code),
                        "employment_us": row[header_index["TOT_EMP"]],
                        "median_wage_usd": row[header_index["A_MEDIAN"]],
                        "wage_p25_usd": row[header_index["A_PCT25"]],
                        "wage_p75_usd": row[header_index["A_PCT75"]],
                    }
                )
                count += 1

    print(f"Wrote {count} rows to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
