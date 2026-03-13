import csv
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile


BTOS_AI_SUPPLEMENT_URL = "https://www.census.gov/hfp/btos/downloads/AI_Supplement_Table.xlsx"
BTOS_REFERENCE_LABEL = "btos_ai_supplement_2026_03"
BTOS_REFERENCE_DATE = "2026-03-13"
BTOS_SOURCE_ID = "src_census_btos_2026_03"
XML_NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
BTOS_SECTOR_LABELS = {
    "11": "Agriculture, Forestry, Fishing and Hunting",
    "21": "Mining, Quarrying, and Oil and Gas Extraction",
    "22": "Utilities",
    "23": "Construction",
    "31": "Manufacturing",
    "42": "Wholesale Trade",
    "44": "Retail Trade",
    "48": "Transportation and Warehousing",
    "51": "Information",
    "52": "Finance and Insurance",
    "53": "Real Estate and Rental and Leasing",
    "54": "Professional, Scientific, and Technical Services",
    "55": "Management of Companies and Enterprises",
    "56": "Administrative and Support and Waste Management Services",
    "61": "Educational Services",
    "62": "Health Care and Social Assistance",
    "71": "Arts, Entertainment, and Recreation",
    "72": "Accommodation and Food Services",
    "81": "Other Services",
}


def clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def format_num(value):
    if value is None:
        return ""
    return f"{value:.3f}"


def parse_percent(value):
    text = str(value or "").strip()
    if not text or text.upper() in {"S", "N", "N/A"}:
        return None
    if text.endswith("%"):
        text = text[:-1]
    try:
        return float(text) / 100.0
    except ValueError:
        return None


def weighted_blend(components):
    numerator = 0.0
    denominator = 0.0
    for value, weight in components:
        if value is None or weight <= 0:
            continue
        numerator += value * weight
        denominator += weight
    if denominator <= 0:
        return None
    return clamp(numerator / denominator)


def fetch_xlsx(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "DLYJ2/btos-normalizer",
            "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def load_shared_strings(workbook):
    if "xl/sharedStrings.xml" not in workbook.namelist():
        return []
    root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    values = []
    for shared in root.findall("a:si", XML_NS):
        values.append("".join(node.text or "" for node in shared.iterfind(".//a:t", XML_NS)))
    return values


def resolve_sheet_path(target):
    clean = str(target or "").lstrip("/")
    if clean.startswith("xl/"):
        return clean
    return f"xl/{clean}"


def iter_sheet_rows(workbook, sheet_name):
    workbook_root = ET.fromstring(workbook.read("xl/workbook.xml"))
    rel_root = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    relationships = {row.attrib["Id"]: row.attrib["Target"] for row in rel_root}
    shared = load_shared_strings(workbook)

    target_path = None
    for sheet in workbook_root.find("a:sheets", XML_NS):
        if sheet.attrib.get("name") != sheet_name:
            continue
        rel_id = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        target_path = resolve_sheet_path(relationships.get(rel_id))
        break

    if not target_path:
        raise ValueError(f"Missing worksheet: {sheet_name}")

    worksheet_root = ET.fromstring(workbook.read(target_path))
    sheet_data = worksheet_root.find("a:sheetData", XML_NS)
    if sheet_data is None:
        return

    for row in sheet_data.findall("a:row", XML_NS):
        cells = []
        for cell in row.findall("a:c", XML_NS):
            value = ""
            value_node = cell.find("a:v", XML_NS)
            inline_node = cell.find("a:is", XML_NS)
            if value_node is not None:
                value = value_node.text or ""
                if cell.attrib.get("t") == "s":
                    value = shared[int(value)]
            elif inline_node is not None:
                value = "".join(node.text or "" for node in inline_node.iterfind(".//a:t", XML_NS))
            cells.append(value)
        yield cells


def build_sector_context():
    workbook_bytes = fetch_xlsx(BTOS_AI_SUPPLEMENT_URL)
    workbook = ZipFile(BytesIO(workbook_bytes))
    sector_rows = list(iter_sheet_rows(workbook, "Sector Response Estimates"))
    if not sector_rows:
        raise ValueError("BTOS sector worksheet was empty")

    header = sector_rows[0]
    rows = []
    for raw in sector_rows[1:]:
        if not raw or len(raw) < len(header):
            continue
        rows.append(dict(zip(header, raw[: len(header)])))

    by_sector = {}
    for row in rows:
        sector_code = str(row.get("Sector", "")).strip()
        if sector_code not in BTOS_SECTOR_LABELS:
            continue
        sector = by_sector.setdefault(sector_code, {})
        question_id = str(row.get("Question ID", "")).strip()
        answer_id = str(row.get("Answer ID", "")).strip()
        sector[f"q{question_id}_a{answer_id}_estimate"] = parse_percent(row.get("Estimate"))
        sector[f"q{question_id}_a{answer_id}_se"] = parse_percent(row.get("Standard Error"))

    output_rows = []
    for sector_code, metrics in sorted(by_sector.items()):
        current_ai_use = metrics.get("q1_a1_estimate")
        current_ai_use_se = metrics.get("q1_a1_se")
        current_llm_use = metrics.get("q2_a6_estimate")
        current_llm_use_se = metrics.get("q2_a6_se")
        current_task_substitution = metrics.get("q3_a1_estimate")
        current_task_substitution_se = metrics.get("q3_a1_se")
        current_workflow_change = metrics.get("q7_a6_estimate")
        current_workflow_change_se = metrics.get("q7_a6_se")
        planned_ai_use = metrics.get("q8_a1_estimate")
        planned_ai_use_se = metrics.get("q8_a1_se")
        planned_llm_use = metrics.get("q9_a6_estimate")
        planned_llm_use_se = metrics.get("q9_a6_se")
        planned_task_substitution = metrics.get("q10_a1_estimate")
        planned_task_substitution_se = metrics.get("q10_a1_se")
        planned_workflow_change = metrics.get("q14_a6_estimate")
        planned_workflow_change_se = metrics.get("q14_a6_se")

        current_task_substitution_intensity = None
        if current_ai_use is not None and current_task_substitution is not None:
            current_task_substitution_intensity = clamp(current_ai_use * current_task_substitution)

        planned_task_substitution_intensity = None
        if planned_ai_use is not None and planned_task_substitution is not None:
            planned_task_substitution_intensity = clamp(planned_ai_use * planned_task_substitution)

        current_workflow_change_intensity = None
        if current_ai_use is not None and current_workflow_change is not None:
            current_workflow_change_intensity = clamp(current_ai_use * current_workflow_change)

        planned_workflow_change_intensity = None
        if planned_ai_use is not None and planned_workflow_change is not None:
            planned_workflow_change_intensity = clamp(planned_ai_use * planned_workflow_change)

        workflow_change_intensity = weighted_blend(
            [
                (current_workflow_change_intensity, 0.5),
                (planned_workflow_change_intensity, 0.5),
            ]
        )
        llm_adoption_intensity = weighted_blend(
            [
                (current_llm_use, 0.55),
                (planned_llm_use, 0.45),
            ]
        )
        adoption_context_index = weighted_blend(
            [
                (current_ai_use, 0.30),
                (planned_ai_use, 0.20),
                (current_task_substitution_intensity, 0.20),
                (planned_task_substitution_intensity, 0.15),
                (workflow_change_intensity, 0.10),
                (llm_adoption_intensity, 0.05),
            ]
        )

        availability = sum(
            value is not None
            for value in [
                current_ai_use,
                planned_ai_use,
                current_task_substitution_intensity,
                planned_task_substitution_intensity,
                workflow_change_intensity,
                llm_adoption_intensity,
            ]
        ) / 6.0
        standard_errors = [
            current_ai_use_se,
            current_llm_use_se,
            current_task_substitution_se,
            current_workflow_change_se,
            planned_ai_use_se,
            planned_llm_use_se,
            planned_task_substitution_se,
            planned_workflow_change_se,
        ]
        standard_errors = [value for value in standard_errors if value is not None]
        mean_standard_error = (sum(standard_errors) / len(standard_errors)) if standard_errors else None
        se_quality = 0.65 if mean_standard_error is None else (1 - clamp(mean_standard_error / 0.06))
        btos_confidence = clamp((availability * 0.65) + (se_quality * 0.35), 0.40, 0.95)

        output_rows.append(
            {
                "btos_reference_date": BTOS_REFERENCE_DATE,
                "btos_release_label": BTOS_REFERENCE_LABEL,
                "btos_sector_code": sector_code,
                "btos_sector_label": BTOS_SECTOR_LABELS[sector_code],
                "current_ai_use_share": format_num(current_ai_use),
                "current_ai_use_se": format_num(current_ai_use_se),
                "current_llm_use_share": format_num(current_llm_use),
                "current_llm_use_se": format_num(current_llm_use_se),
                "current_task_substitution_share_conditional": format_num(current_task_substitution),
                "current_task_substitution_se": format_num(current_task_substitution_se),
                "current_workflow_change_share_conditional": format_num(current_workflow_change),
                "current_workflow_change_se": format_num(current_workflow_change_se),
                "planned_ai_use_share": format_num(planned_ai_use),
                "planned_ai_use_se": format_num(planned_ai_use_se),
                "planned_llm_use_share": format_num(planned_llm_use),
                "planned_llm_use_se": format_num(planned_llm_use_se),
                "planned_task_substitution_share_conditional": format_num(planned_task_substitution),
                "planned_task_substitution_se": format_num(planned_task_substitution_se),
                "planned_workflow_change_share_conditional": format_num(planned_workflow_change),
                "planned_workflow_change_se": format_num(planned_workflow_change_se),
                "current_task_substitution_intensity": format_num(current_task_substitution_intensity),
                "planned_task_substitution_intensity": format_num(planned_task_substitution_intensity),
                "workflow_change_intensity": format_num(workflow_change_intensity),
                "adoption_context_index": format_num(adoption_context_index),
                "btos_confidence": format_num(btos_confidence),
                "source_mix": BTOS_SOURCE_ID,
                "notes": (
                    "official_download=AI_Supplement_Table.xlsx|"
                    "worksheet=Sector Response Estimates|"
                    "conditional_scopes=q3_q7_scope2|q10_q14_scope4"
                ),
            }
        )

    return output_rows


def main():
    repo_root = Path(__file__).resolve().parents[2]
    normalized_dir = repo_root / "data" / "normalized"
    output_path = normalized_dir / "industry_ai_adoption_context.csv"
    rows = build_sector_context()
    fieldnames = [
        "btos_reference_date",
        "btos_release_label",
        "btos_sector_code",
        "btos_sector_label",
        "current_ai_use_share",
        "current_ai_use_se",
        "current_llm_use_share",
        "current_llm_use_se",
        "current_task_substitution_share_conditional",
        "current_task_substitution_se",
        "current_workflow_change_share_conditional",
        "current_workflow_change_se",
        "planned_ai_use_share",
        "planned_ai_use_se",
        "planned_llm_use_share",
        "planned_llm_use_se",
        "planned_task_substitution_share_conditional",
        "planned_task_substitution_se",
        "planned_workflow_change_share_conditional",
        "planned_workflow_change_se",
        "current_task_substitution_intensity",
        "planned_task_substitution_intensity",
        "workflow_change_intensity",
        "adoption_context_index",
        "btos_confidence",
        "source_mix",
        "notes",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(
        {
            "rows": len(rows),
            "output_path": str(output_path),
            "source": BTOS_SOURCE_ID,
            "reference_label": BTOS_REFERENCE_LABEL,
        }
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(exc, file=sys.stderr)
        sys.exit(1)
