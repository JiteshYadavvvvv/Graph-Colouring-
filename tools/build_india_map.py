"""
Development-time tool: turn a district-level GeoJSON of India into the local
SVG geometry used by the frontend (frontend/src/data/indiaGeometry.js).

The app itself NEVER runs this script and never downloads map data. It is kept
here so the committed geometry can be reproduced and audited.

Source data
    https://github.com/udit-001/india-maps-data  (geojson/india.geojson)
    36 states / union territories, district polygons.

Requirements (development only, NOT in backend/requirements.txt)
    pip install shapely>=2.1

Usage
    python tools/build_india_map.py path/to/india.geojson

What it does
    1. Dissolves district polygons into one shape per state / UT.
    2. Projects lon/lat with a Lambert Conformal Conic projection
       (standard parallels 12°28′N and 35°10′N, the usual choice for India).
    3. Simplifies all shapes together with shapely.coverage_simplify, so
       neighbouring states keep an identical shared border (no gaps/overlaps).
    4. Measures the length of every shared land border and prints the
       adjacency it implies, so backend/data/india_map.py can be checked
       against real geometry.
    5. Computes a label anchor (pole of inaccessibility) for each state.
    6. Writes frontend/src/data/indiaGeometry.js.
"""

import json
import math
import sys
from collections import defaultdict
from pathlib import Path

import shapely
from shapely.geometry import MultiPolygon, Polygon, shape
from shapely.ops import polylabel, transform, unary_union

ROOT = Path(__file__).resolve().parent.parent
OUT_JS = ROOT / "frontend" / "src" / "data" / "indiaGeometry.js"

# name in source data -> (id, display name, is a graph vertex?)
REGIONS = {
    "Jammu and Kashmir": ("JK", "Jammu and Kashmir", True),
    "Ladakh": ("LA", "Ladakh", True),
    "Himachal Pradesh": ("HP", "Himachal Pradesh", True),
    "Punjab": ("PB", "Punjab", True),
    "Chandigarh": ("CH", "Chandigarh", False),
    "Uttarakhand": ("UK", "Uttarakhand", True),
    "Haryana": ("HR", "Haryana", True),
    "Delhi": ("DL", "Delhi", True),
    "Rajasthan": ("RJ", "Rajasthan", True),
    "Uttar Pradesh": ("UP", "Uttar Pradesh", True),
    "Bihar": ("BR", "Bihar", True),
    "Sikkim": ("SK", "Sikkim", True),
    "Arunachal Pradesh": ("AR", "Arunachal Pradesh", True),
    "Assam": ("AS", "Assam", True),
    "Nagaland": ("NL", "Nagaland", True),
    "Manipur": ("MN", "Manipur", True),
    "Mizoram": ("MZ", "Mizoram", True),
    "Tripura": ("TR", "Tripura", True),
    "Meghalaya": ("ML", "Meghalaya", True),
    "West Bengal": ("WB", "West Bengal", True),
    "Jharkhand": ("JH", "Jharkhand", True),
    "Odisha": ("OD", "Odisha", True),
    "Chhattisgarh": ("CG", "Chhattisgarh", True),
    "Madhya Pradesh": ("MP", "Madhya Pradesh", True),
    "Gujarat": ("GJ", "Gujarat", True),
    "Dadra and Nagar Haveli and Daman and Diu": ("DH", "Dadra & Nagar Haveli and Daman & Diu", False),
    "Maharashtra": ("MH", "Maharashtra", True),
    "Goa": ("GA", "Goa", True),
    "Karnataka": ("KA", "Karnataka", True),
    "Telangana": ("TG", "Telangana", True),
    "Andhra Pradesh": ("AP", "Andhra Pradesh", True),
    "Tamil Nadu": ("TN", "Tamil Nadu", True),
    "Puducherry": ("PY", "Puducherry", False),
    "Kerala": ("KL", "Kerala", True),
    "Lakshadweep": ("LD", "Lakshadweep", False),
    "Andaman and Nicobar Islands": ("AN", "Andaman and Nicobar Islands", False),
}

# Target drawing width in SVG units (height follows from the projection).
WIDTH = 1000
PADDING = 20
SIMPLIFY_TOLERANCE = 0.9         # SVG units (≈ 3 km), applied to the whole coverage
MIN_RING_AREA = 6.0              # drop tiny specks (SVG units²)
ISLAND_RING_AREA = 0.15          # island territories keep much smaller islands
ISLAND_TERRITORIES = {"Lakshadweep", "Andaman and Nicobar Islands"}
MIN_SHARED_BORDER = 4.0          # SVG units (≈ 13 km): shorter contacts are not edges


def lambert_conformal_conic(lat1=12.4729, lat2=35.1728, lat0=24.0, lon0=80.0):
    """Return a (lon, lat) -> (x, y) function for a spherical LCC projection."""
    p1, p2, p0 = map(math.radians, (lat1, lat2, lat0))
    n = math.log(math.cos(p1) / math.cos(p2)) / math.log(
        math.tan(math.pi / 4 + p2 / 2) / math.tan(math.pi / 4 + p1 / 2)
    )
    f = math.cos(p1) * math.tan(math.pi / 4 + p1 / 2) ** n / n
    rho0 = f / math.tan(math.pi / 4 + p0 / 2) ** n

    def project(lon, lat, z=None):
        rho = f / math.tan(math.pi / 4 + math.radians(lat) / 2) ** n
        theta = n * math.radians(lon - lon0)
        return rho * math.sin(theta), -(rho0 - rho * math.cos(theta))  # y grows downward

    return project


def polygons_of(geom):
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon)]


def ring_path(coords):
    pts = [f"{x:.1f} {y:.1f}" for x, y in list(coords)[:-1]]
    return "M" + "L".join(pts) + "Z"


def to_path(geom, min_area=MIN_RING_AREA):
    parts = []
    for poly in polygons_of(geom):
        if poly.area < min_area:
            continue
        parts.append(ring_path(poly.exterior.coords))
        for hole in poly.interiors:
            if Polygon(hole).area >= min_area:
                parts.append(ring_path(hole.coords))
    return "".join(parts)


def main(source):
    data = json.loads(Path(source).read_text())
    districts = defaultdict(list)
    for feature in data["features"]:
        districts[feature["properties"]["st_nm"]].append(shape(feature["geometry"]).buffer(0))

    missing = set(REGIONS) - set(districts)
    if missing:
        sys.exit(f"Source data is missing: {sorted(missing)}")

    project = lambert_conformal_conic()
    names = list(REGIONS)
    # Dissolve districts; the tiny buffer closes slivers between district edges.
    raw = [unary_union(districts[n]).buffer(0.002).buffer(-0.002) for n in names]
    projected = [transform(project, g) for g in raw]

    # Scale to the target width.
    minx, miny, maxx, maxy = unary_union(projected).bounds
    scale = (WIDTH - 2 * PADDING) / (maxx - minx)
    height = round((maxy - miny) * scale + 2 * PADDING)

    def fit(x, y, z=None):
        return (x - minx) * scale + PADDING, (y - miny) * scale + PADDING

    fitted = [transform(fit, g) for g in projected]
    simplified = list(shapely.coverage_simplify(fitted, SIMPLIFY_TOLERANCE))
    simplified = [shapely.make_valid(g) for g in simplified]
    # Coverage simplification can collapse very small islands, so island
    # territories are simplified on their own with a finer tolerance.
    for i, n in enumerate(names):
        if n in ISLAND_TERRITORIES:
            simplified[i] = fitted[i].simplify(0.3)

    # ---- Adjacency from geometry ----
    print("Shared land borders (SVG units; 1 unit ≈ 3.3 km):")
    computed = defaultdict(list)
    for i, a in enumerate(names):
        for j in range(i + 1, len(names)):
            b = names[j]
            if not fitted[i].buffer(1.0).intersects(fitted[j]):
                continue
            shared = fitted[i].boundary.intersection(fitted[j].buffer(0.6)).length
            if shared <= 0:
                continue
            flag = "EDGE" if shared >= MIN_SHARED_BORDER else "touch (ignored)"
            print(f"  {a:>28} – {b:<28} {shared:8.1f}  {flag}")
            if shared >= MIN_SHARED_BORDER and REGIONS[a][2] and REGIONS[b][2]:
                computed[a].append(b)
                computed[b].append(a)

    print("\nComputed adjacency between graph vertices:")
    for n in names:
        if REGIONS[n][2]:
            print(f"  {n!r}: {sorted(computed[n])},")

    # ---- Label anchors ----
    regions = []
    for n, geom in zip(names, simplified):
        rid, display, is_vertex = REGIONS[n]
        largest = max(polygons_of(geom), key=lambda p: p.area)
        anchor = polylabel(largest, tolerance=0.5)
        cx, cy = geom.centroid.x, geom.centroid.y
        regions.append({
            "id": rid,
            "name": display,
            "source": n,
            "vertex": is_vertex,
            "path": to_path(geom, ISLAND_RING_AREA if n in ISLAND_TERRITORIES else MIN_RING_AREA),
            "anchor": [round(anchor.x, 1), round(anchor.y, 1)],
            "centroid": [round(cx, 1), round(cy, 1)],
            "area": round(geom.area),
        })

    print("\nLabel anchors / areas:")
    for r in regions:
        print(f"  {r['id']}  anchor={r['anchor']}  area={r['area']}")

    body = json.dumps(
        {"width": WIDTH, "height": height, "regions": regions},
        ensure_ascii=False, separators=(",", ":"),
    )
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "// GENERATED by tools/build_india_map.py. Do not edit by hand.\n"
        "// Source: udit-001/india-maps-data (district GeoJSON), dissolved to states,\n"
        "// Lambert Conformal Conic projection, coverage-simplified.\n"
        f"const INDIA_GEOMETRY = {body};\n\nexport default INDIA_GEOMETRY;\n"
    )
    print(f"\nWrote {OUT_JS.relative_to(ROOT)} ({OUT_JS.stat().st_size / 1024:.0f} KB), "
          f"viewBox 0 0 {WIDTH} {height}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
