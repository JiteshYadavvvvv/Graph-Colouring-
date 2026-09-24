"""
Map of India's 28 states and 3 mainland union territories (Jammu and Kashmir,
Ladakh, Delhi), modeled as a graph.

    Region          -> Vertex
    Shared border   -> Edge

This adjacency list is the SINGLE source of truth for which regions touch.
The frontend never stores its own copy: it fetches this graph through
GET /api/graph/india and only draws it.

Identifiers
-----------
Every region has a stable ID of the form "IN-XX", where XX is its two-letter
state code (the code on vehicle registration plates). IDs are what the
algorithm, the API and the frontend use internally; display names are only
for people. The map geometry in the frontend uses the same IDs, which is how
a map region and its graph vertex are matched.

Where the edges come from
-------------------------
Every edge below was checked against real boundary geometry with
tools/build_india_map.py, which measures the length of each shared land
border. Two regions are adjacent when they share a border of at least ~10 km.
That keeps the short Himachal Pradesh – Uttar Pradesh border (listed in
official border descriptions) and leaves out mere point contacts such as
Uttarakhand – Haryana.

The small union territories Chandigarh, Puducherry, Dadra & Nagar Haveli and
Daman & Diu, Lakshadweep, and the Andaman & Nicobar Islands are drawn on the
map for geographic completeness but are not vertices: they are enclaves or
islands and add nothing to the coloring problem.
"""

KEY = "india"
NAME = "Indian States"
KIND = "map"
GRAPH_TYPE = "Planar map graph"
DESCRIPTION = (
    "28 states plus Jammu and Kashmir, Ladakh and Delhi. "
    "Two regions are connected when they share a land border."
)
CHARACTERISTICS = [
    "Planar: it comes from a map, so the Four Color Theorem guarantees that 4 colors suffice.",
    "Sparse: each state borders only a handful of others.",
    "Contains triangles such as Delhi – Haryana – Uttar Pradesh, so at least 3 colors are needed.",
]

# id: (state code, display name). Listed roughly north to south, then the
# North-East. With the "natural" strategy, greedy visits vertices in this order.
REGIONS = {
    "IN-JK": ("JK", "Jammu and Kashmir"),
    "IN-LA": ("LA", "Ladakh"),
    "IN-HP": ("HP", "Himachal Pradesh"),
    "IN-PB": ("PB", "Punjab"),
    "IN-UK": ("UK", "Uttarakhand"),
    "IN-HR": ("HR", "Haryana"),
    "IN-DL": ("DL", "Delhi"),
    "IN-RJ": ("RJ", "Rajasthan"),
    "IN-UP": ("UP", "Uttar Pradesh"),
    "IN-GJ": ("GJ", "Gujarat"),
    "IN-MP": ("MP", "Madhya Pradesh"),
    "IN-BR": ("BR", "Bihar"),
    "IN-JH": ("JH", "Jharkhand"),
    "IN-WB": ("WB", "West Bengal"),
    "IN-SK": ("SK", "Sikkim"),
    "IN-OD": ("OD", "Odisha"),
    "IN-CG": ("CG", "Chhattisgarh"),
    "IN-MH": ("MH", "Maharashtra"),
    "IN-GA": ("GA", "Goa"),
    "IN-TG": ("TG", "Telangana"),
    "IN-AP": ("AP", "Andhra Pradesh"),
    "IN-KA": ("KA", "Karnataka"),
    "IN-TN": ("TN", "Tamil Nadu"),
    "IN-KL": ("KL", "Kerala"),
    "IN-AS": ("AS", "Assam"),
    "IN-AR": ("AR", "Arunachal Pradesh"),
    "IN-NL": ("NL", "Nagaland"),
    "IN-MN": ("MN", "Manipur"),
    "IN-MZ": ("MZ", "Mizoram"),
    "IN-TR": ("TR", "Tripura"),
    "IN-ML": ("ML", "Meghalaya"),
}

ADJACENCY = {
    "IN-JK": ["IN-LA", "IN-HP", "IN-PB"],
    "IN-LA": ["IN-JK", "IN-HP"],
    "IN-HP": ["IN-JK", "IN-LA", "IN-PB", "IN-HR", "IN-UK", "IN-UP"],
    "IN-PB": ["IN-JK", "IN-HP", "IN-HR", "IN-RJ"],
    "IN-UK": ["IN-HP", "IN-UP"],
    "IN-HR": ["IN-PB", "IN-HP", "IN-DL", "IN-RJ", "IN-UP"],
    "IN-DL": ["IN-HR", "IN-UP"],
    "IN-RJ": ["IN-PB", "IN-HR", "IN-UP", "IN-MP", "IN-GJ"],
    "IN-UP": ["IN-UK", "IN-HP", "IN-HR", "IN-DL", "IN-RJ", "IN-MP", "IN-CG", "IN-JH", "IN-BR"],
    "IN-GJ": ["IN-RJ", "IN-MP", "IN-MH"],
    "IN-MP": ["IN-RJ", "IN-UP", "IN-CG", "IN-MH", "IN-GJ"],
    "IN-BR": ["IN-UP", "IN-JH", "IN-WB"],
    "IN-JH": ["IN-UP", "IN-BR", "IN-WB", "IN-OD", "IN-CG"],
    "IN-WB": ["IN-BR", "IN-JH", "IN-OD", "IN-SK", "IN-AS"],
    "IN-SK": ["IN-WB"],
    "IN-OD": ["IN-WB", "IN-JH", "IN-CG", "IN-AP"],
    "IN-CG": ["IN-UP", "IN-JH", "IN-OD", "IN-AP", "IN-TG", "IN-MH", "IN-MP"],
    "IN-MH": ["IN-GJ", "IN-MP", "IN-CG", "IN-TG", "IN-KA", "IN-GA"],
    "IN-GA": ["IN-MH", "IN-KA"],
    "IN-TG": ["IN-MH", "IN-CG", "IN-AP", "IN-KA"],
    "IN-AP": ["IN-TG", "IN-CG", "IN-OD", "IN-KA", "IN-TN"],
    "IN-KA": ["IN-GA", "IN-MH", "IN-TG", "IN-AP", "IN-TN", "IN-KL"],
    "IN-TN": ["IN-KA", "IN-AP", "IN-KL"],
    "IN-KL": ["IN-KA", "IN-TN"],
    "IN-AS": ["IN-WB", "IN-AR", "IN-NL", "IN-MN", "IN-MZ", "IN-TR", "IN-ML"],
    "IN-AR": ["IN-AS", "IN-NL"],
    "IN-NL": ["IN-AS", "IN-AR", "IN-MN"],
    "IN-MN": ["IN-NL", "IN-AS", "IN-MZ"],
    "IN-MZ": ["IN-MN", "IN-AS", "IN-TR"],
    "IN-TR": ["IN-AS", "IN-MZ"],
    "IN-ML": ["IN-AS"],
}

NAMES = {rid: name for rid, (_, name) in REGIONS.items()}

# Short labels (state codes) drawn on the map and on graph nodes.
LABELS = {rid: code for rid, (code, _) in REGIONS.items()}

# Default node positions for the node-link graph view. They are the map's
# label anchors, scaled down and nudged apart so nodes don't overlap (the
# North-East and the Delhi region are crowded). Users can drag nodes freely.
LAYOUT = {
    "IN-JK": (157, 91), "IN-LA": (213, 78), "IN-HP": (210, 132),
    "IN-PB": (170, 155), "IN-UK": (248, 174), "IN-HR": (172, 200),
    "IN-DL": (216, 210), "IN-RJ": (136, 247), "IN-UP": (274, 250),
    "IN-GJ": (92, 323), "IN-MP": (254, 335), "IN-BR": (385, 273),
    "IN-JH": (363, 322), "IN-WB": (421, 330), "IN-SK": (429, 230),
    "IN-OD": (359, 385), "IN-CG": (312, 357), "IN-MH": (159, 418),
    "IN-GA": (124, 509), "IN-TG": (238, 454), "IN-AP": (233, 523),
    "IN-KA": (169, 501), "IN-TN": (221, 612), "IN-KL": (183, 638),
    "IN-AS": (518, 249), "IN-AR": (554, 197), "IN-NL": (563, 243),
    "IN-MN": (546, 285), "IN-MZ": (532, 328), "IN-TR": (491, 308),
    "IN-ML": (471, 267),
}
