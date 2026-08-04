#!/usr/bin/env python3
"""Build site/data/records.json from data/uap-data.csv + etl/gazetteer.json.

Only video (VID) and image (IMG) records are kept — audio and PDFs are
deliberately excluded from this site. Synthetic content ("Digital Rendering" /
"Digital Recreation" artistic interpretations, not real footage) is excluded by
title pattern.

Usage: python3 etl/build.py
Exits non-zero if any location string is missing from the gazetteer, or if a
kept record's title/blurb contains synthetic-content vocabulary that the title
filter did not catch, so schema/vocabulary drift in a new PURSUE release fails
loudly.
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "uap-data.csv"
GAZETTEER_PATH = ROOT / "etl" / "gazetteer.json"
OUT_PATH = ROOT / "site" / "data" / "records.json"

# Titles contain non-breaking spaces; \s matches them.
EXCLUDE_TITLE = re.compile(r"digital\s+(rendering|recreation|creation)", re.IGNORECASE)
# Tripwire: phrases (not bare words like "rendering", which genuine footage
# blurbs use in other senses) that suggest a synthetic record slipped past
# EXCLUDE_TITLE.
SUSPECT = re.compile(
    r"artistic\s+interpretation|artist'?s\s+impression|digital\s+(rendering|recreation|creation)",
    re.IGNORECASE,
)


def parse_year(raw: str) -> int | None:
    """Extract an incident year from the messy 'Incident Date' field."""
    raw = raw.strip()
    if not raw or raw.upper() == "N/A":
        return None
    m = re.search(r"\b(19|20)\d{2}\b", raw)
    if m:
        return int(m.group(0))
    # m/d/yy — pivot two-digit years around 2026 (the newest possible date)
    m = re.search(r"\d{1,2}/\d{1,2}/(\d{2})\b", raw)
    if m:
        yy = int(m.group(1))
        return 2000 + yy if yy <= 26 else 1900 + yy
    return None


def main() -> int:
    gazetteer = json.loads(GAZETTEER_PATH.read_text(encoding="utf-8"))
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r["Type"].strip().upper() in ("VID", "IMG")]

    n_synthetic = sum(1 for r in rows if EXCLUDE_TITLE.search(r["Title"]))
    rows = [r for r in rows if not EXCLUDE_TITLE.search(r["Title"])]

    records, locations = [], {}
    missing, suspect = set(), []
    for i, r in enumerate(rows):
        if SUSPECT.search(r["Title"]) or SUSPECT.search(r["Description Blurb"]):
            suspect.append(r["Title"].strip())
        loc_raw = r["Incident Location"].strip()
        entry = gazetteer.get(loc_raw)
        if entry is None:
            missing.add(loc_raw)
            continue

        kind = entry.get("kind", "place")
        loc_key = entry.get("label") or loc_raw or "Unknown"
        if kind != "unmappable" and loc_key not in locations:
            locations[loc_key] = {k: entry[k] for k in ("lat", "lng", "radius_km", "label") if k in entry}

        records.append({
            "id": i,
            "title": r["Title"].strip(),
            "type": r["Type"].strip().upper(),
            "agency": r["Agency"].strip() or "Unknown",
            "release": r["Release Date"].strip(),
            "date_raw": r["Incident Date"].strip(),
            "year": parse_year(r["Incident Date"]),
            "location_raw": loc_raw,
            "location": loc_key if kind != "unmappable" else None,
            "loc_kind": kind,
            "blurb": r["Description Blurb"].strip(),
            "dvids_id": r["DVIDS Video ID"].strip() or None,
            "img_link": r["PDF | Image Link"].strip() or None,
            "thumb": r["Modal Image"].strip() or None,
        })

    if missing:
        print("FATAL: locations missing from gazetteer:", sorted(missing), file=sys.stderr)
        return 1
    if suspect:
        print("FATAL: possible synthetic-content records not excluded:", suspect, file=sys.stderr)
        return 1

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps({"generated_from": "war.gov/UFO uap-data.csv (videos + images)",
                    "locations": locations, "records": records},
                   ensure_ascii=False),
        encoding="utf-8",
    )

    n_map = sum(1 for r in records if r["loc_kind"] == "place")
    n_off = sum(1 for r in records if r["loc_kind"] == "offworld")
    n_vid = sum(1 for r in records if r["type"] == "VID")
    print(f"{len(records)} records ({n_vid} videos, {len(records) - n_vid} images) -> {OUT_PATH.relative_to(ROOT)}")
    print(f"  excluded {n_synthetic} synthetic (digital rendering/recreation)")
    print(f"  mappable: {n_map}  off-world: {n_off}  without location: {len(records) - n_map - n_off}")
    print(f"  distinct map locations: {len(locations)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
