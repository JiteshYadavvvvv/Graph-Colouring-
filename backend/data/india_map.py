"""
Map of India's 28 states and 3 mainland union territories (Jammu and Kashmir,
Ladakh, Delhi), modeled as a graph.

    Region          -> Vertex
    Shared border   -> Edge

This adjacency list is the SINGLE source of truth for which regions touch.
The frontend never stores its own copy: it fetches this graph through
GET /api/graph/india and only draws it.

Where the edges come from
-------------------------
Every edge below was checked against real boundary geometry with
tools/build_india_map.py, which measures the length of each shared land
border. Two regions are adjacent when they share a border of at least ~13 km.
That rule leaves out the Himachal Pradesh – Uttar Pradesh contact, which is
only a few kilometres long (a near tripoint), and point contacts such as
Uttarakhand – Haryana.

The small union territories Chandigarh, Puducherry, Dadra & Nagar Haveli and
Daman & Diu, Lakshadweep, and the Andaman & Nicobar Islands are drawn on the
map for geographic completeness but are not vertices: they are enclaves or
islands and add nothing to the coloring problem.
"""

KEY = "india"
NAME = "Indian States"
KIND = "map"
DESCRIPTION = (
    "28 states plus Jammu and Kashmir, Ladakh and Delhi. "
    "Two regions are connected when they share a land border."
)

# Listed roughly north to south, then the North-East. With the "natural"
# strategy, greedy coloring visits the vertices in exactly this order.
ADJACENCY = {
    "Jammu and Kashmir": ["Ladakh", "Himachal Pradesh", "Punjab"],
    "Ladakh":            ["Jammu and Kashmir", "Himachal Pradesh"],
    "Himachal Pradesh":  ["Jammu and Kashmir", "Ladakh", "Punjab", "Haryana", "Uttarakhand"],
    "Punjab":            ["Jammu and Kashmir", "Himachal Pradesh", "Haryana", "Rajasthan"],
    "Uttarakhand":       ["Himachal Pradesh", "Uttar Pradesh"],
    "Haryana":           ["Punjab", "Himachal Pradesh", "Delhi", "Rajasthan", "Uttar Pradesh"],
    "Delhi":             ["Haryana", "Uttar Pradesh"],
    "Rajasthan":         ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Gujarat"],
    "Uttar Pradesh":     ["Uttarakhand", "Haryana", "Delhi", "Rajasthan", "Madhya Pradesh",
                          "Chhattisgarh", "Jharkhand", "Bihar"],
    "Gujarat":           ["Rajasthan", "Madhya Pradesh", "Maharashtra"],
    "Madhya Pradesh":    ["Rajasthan", "Uttar Pradesh", "Chhattisgarh", "Maharashtra", "Gujarat"],
    "Bihar":             ["Uttar Pradesh", "Jharkhand", "West Bengal"],
    "Jharkhand":         ["Uttar Pradesh", "Bihar", "West Bengal", "Odisha", "Chhattisgarh"],
    "West Bengal":       ["Bihar", "Jharkhand", "Odisha", "Sikkim", "Assam"],
    "Sikkim":            ["West Bengal"],
    "Odisha":            ["West Bengal", "Jharkhand", "Chhattisgarh", "Andhra Pradesh"],
    "Chhattisgarh":      ["Uttar Pradesh", "Jharkhand", "Odisha", "Andhra Pradesh", "Telangana",
                          "Maharashtra", "Madhya Pradesh"],
    "Maharashtra":       ["Gujarat", "Madhya Pradesh", "Chhattisgarh", "Telangana", "Karnataka", "Goa"],
    "Goa":               ["Maharashtra", "Karnataka"],
    "Telangana":         ["Maharashtra", "Chhattisgarh", "Andhra Pradesh", "Karnataka"],
    "Andhra Pradesh":    ["Telangana", "Chhattisgarh", "Odisha", "Karnataka", "Tamil Nadu"],
    "Karnataka":         ["Goa", "Maharashtra", "Telangana", "Andhra Pradesh", "Tamil Nadu", "Kerala"],
    "Tamil Nadu":        ["Karnataka", "Andhra Pradesh", "Kerala"],
    "Kerala":            ["Karnataka", "Tamil Nadu"],
    "Assam":             ["West Bengal", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram",
                          "Tripura", "Meghalaya"],
    "Arunachal Pradesh": ["Assam", "Nagaland"],
    "Nagaland":          ["Assam", "Arunachal Pradesh", "Manipur"],
    "Manipur":           ["Nagaland", "Assam", "Mizoram"],
    "Mizoram":           ["Manipur", "Assam", "Tripura"],
    "Tripura":           ["Assam", "Mizoram"],
    "Meghalaya":         ["Assam"],
}

# Short labels (standard state codes) used on the map and on graph nodes.
# The map geometry in the frontend is keyed by these same codes.
LABELS = {
    "Jammu and Kashmir": "JK", "Ladakh": "LA", "Himachal Pradesh": "HP", "Punjab": "PB",
    "Uttarakhand": "UK", "Haryana": "HR", "Delhi": "DL", "Rajasthan": "RJ",
    "Uttar Pradesh": "UP", "Gujarat": "GJ", "Madhya Pradesh": "MP", "Bihar": "BR",
    "Jharkhand": "JH", "West Bengal": "WB", "Sikkim": "SK", "Odisha": "OD",
    "Chhattisgarh": "CG", "Maharashtra": "MH", "Goa": "GA", "Telangana": "TG",
    "Andhra Pradesh": "AP", "Karnataka": "KA", "Tamil Nadu": "TN", "Kerala": "KL",
    "Assam": "AS", "Arunachal Pradesh": "AR", "Nagaland": "NL", "Manipur": "MN",
    "Mizoram": "MZ", "Tripura": "TR", "Meghalaya": "ML",
}

# Default node positions for the node-link graph view. They are the map's
# label anchors, scaled down and nudged apart so nodes don't overlap (the
# North-East and the Delhi region are crowded). Users can drag nodes freely.
LAYOUT = {
    "Jammu and Kashmir": (157, 91), "Ladakh": (213, 78), "Himachal Pradesh": (210, 132),
    "Punjab": (170, 155), "Uttarakhand": (248, 174), "Haryana": (172, 200),
    "Delhi": (216, 210), "Rajasthan": (136, 247), "Uttar Pradesh": (274, 250),
    "Gujarat": (92, 323), "Madhya Pradesh": (254, 335), "Bihar": (385, 273),
    "Jharkhand": (363, 322), "West Bengal": (421, 330), "Sikkim": (429, 230),
    "Odisha": (359, 385), "Chhattisgarh": (312, 357), "Maharashtra": (159, 418),
    "Goa": (124, 509), "Telangana": (238, 454), "Andhra Pradesh": (233, 523),
    "Karnataka": (169, 501), "Tamil Nadu": (221, 612), "Kerala": (183, 638),
    "Assam": (518, 249), "Arunachal Pradesh": (554, 197), "Nagaland": (563, 243),
    "Manipur": (546, 285), "Mizoram": (532, 328), "Tripura": (491, 308),
    "Meghalaya": (471, 267),
}
