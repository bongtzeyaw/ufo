# PURSUE UAP Map

An unofficial interactive map of the declassified UAP **videos and images**
published by the U.S. Department of War at [war.gov/UFO](https://www.war.gov/UFO/)
(the PURSUE program). The ETL keeps video and image records (130 of 334 as of
Release 04; audio and PDFs are deliberately excluded). Records appear on a dark
world map as bubbles sized by record count; clicking a bubble opens a panel
listing that location's videos and images together (a VIDEO/IMAGE badge per row
— no type toggle, since only one location has both types). Videos play inline
via the DVIDS embedded player; images hotlink from war.gov. No media files are
hosted or copied.

## Architecture

```
data/uap-data.csv        raw snapshot of war.gov's own data file (all record types)
etl/gazetteer.json       hand-curated map: location string -> lat/lng + precision
etl/build.py             CSV + gazetteer -> site/data/records.json (videos + images)
site/                    static site (plain HTML/CSS/JS + Leaflet from CDN)
```

The raw CSV keeps all record types so data refreshes stay a straight overwrite;
the type filtering happens in `etl/build.py`. The gazetteer likewise keeps
entries for locations that currently appear only on excluded record types —
they cost nothing and prevent build failures if a future video or image lands
there.

There is no backend. Deployment is via GitHub Pages: the workflow in
`.github/workflows/pages.yml` publishes the `site/` folder on every push to
main (Settings → Pages → Source: GitHub Actions). Any other static host
works too.

The site is served at https://ufo.bongtzeyaw.com via a CNAME record at the
registrar pointing to bongtzeyaw.github.io.

## Run locally

```sh
python3 -m http.server 8642 --directory site
# open http://localhost:8642
```

## Refresh the data (new PURSUE release, every few weeks)

war.gov sits behind bot protection, so the CSV must be fetched from a real
browser context:

1. Open https://www.war.gov/UFO/ in a browser and grab
   `https://www.war.gov/Portals/1/Interactive/2026/UFO/uap-data.csv`
   (visible in DevTools → Network; the `?release=N` query param increments per
   tranche). Save it over `data/uap-data.csv`.
   Headless alternative: fetch it with Playwright/puppeteer from a page context.
2. Rebuild: `python3 etl/build.py`
3. If the build fails with `locations missing from gazetteer`, add the new
   location strings to `etl/gazetteer.json` and rerun. This is intentional —
   new vocabulary should fail loudly rather than silently drop records.

## Design notes

- **Location precision is displayed, not hidden.** Official locations are
  coarse text ("Western United States", "CENTCOM"). Each gazetteer entry
  carries a `radius_km`; clicking a bubble draws it as a dashed circle, so
  approximate locations are never presented as exact points.
- **Off-world records** (Moon, Low-Earth Orbit images) and **records with no
  usable location** (blank or N/A) are reachable from the shelf buttons at
  bottom-right, so the map never silently drops records.
- **Videos** embed via `https://www.dvidshub.net/video/embed/<id>`; each record
  also links to its DVIDS page and (when present) the original file on war.gov.
- Year is parsed permissively from the messy `Incident Date` field; two-digit
  years pivot at 26 (…/49 → 1949, …/26 → 2026).

## Data & licensing

Records and media are works of the U.S. Government (17 U.S.C. § 105, public
domain), published for public release via PURSUE and DVIDS. Map tiles:
© OpenStreetMap contributors, © CARTO. This project is not affiliated with or
endorsed by the U.S. Government.
