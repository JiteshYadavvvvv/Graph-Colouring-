"""
Simplified map of 20 Indian states, modeled as a graph.

    Region          -> Vertex
    Shared border   -> Edge

This adjacency list is the SINGLE source of truth for which states touch.
The frontend never stores its own copy: it fetches this graph through
GET /api/graph/india and only draws it.

The border relationships follow real Indian state borders, restricted to the
states included here (Delhi, Jammu & Kashmir and the North-East are left out
to keep the demonstration readable).
"""

KEY = "india"
NAME = "Indian States"
KIND = "map"
DESCRIPTION = (
    "20 Indian states. Two states are connected when they share a land border."
)

ADJACENCY = {
    "Punjab":           ["Himachal Pradesh", "Haryana", "Rajasthan"],
    "Himachal Pradesh": ["Punjab", "Haryana", "Uttarakhand", "Uttar Pradesh"],
    "Uttarakhand":      ["Himachal Pradesh", "Uttar Pradesh"],
    "Haryana":          ["Punjab", "Himachal Pradesh", "Rajasthan", "Uttar Pradesh"],
    "Rajasthan":        ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Gujarat"],
    "Uttar Pradesh":    ["Himachal Pradesh", "Uttarakhand", "Haryana", "Rajasthan",
                         "Madhya Pradesh", "Chhattisgarh", "Jharkhand", "Bihar"],
    "Bihar":            ["Uttar Pradesh", "Jharkhand", "West Bengal"],
    "West Bengal":      ["Bihar", "Jharkhand", "Odisha"],
    "Jharkhand":        ["Uttar Pradesh", "Bihar", "West Bengal", "Odisha", "Chhattisgarh"],
    "Odisha":           ["West Bengal", "Jharkhand", "Chhattisgarh", "Andhra Pradesh"],
    "Chhattisgarh":     ["Uttar Pradesh", "Jharkhand", "Odisha", "Madhya Pradesh",
                         "Maharashtra", "Telangana", "Andhra Pradesh"],
    "Madhya Pradesh":   ["Rajasthan", "Uttar Pradesh", "Chhattisgarh", "Maharashtra", "Gujarat"],
    "Gujarat":          ["Rajasthan", "Madhya Pradesh", "Maharashtra"],
    "Maharashtra":      ["Gujarat", "Madhya Pradesh", "Chhattisgarh", "Telangana",
                         "Karnataka", "Goa"],
    "Goa":              ["Maharashtra", "Karnataka"],
    "Telangana":        ["Maharashtra", "Chhattisgarh", "Andhra Pradesh", "Karnataka"],
    "Andhra Pradesh":   ["Telangana", "Chhattisgarh", "Odisha", "Karnataka", "Tamil Nadu"],
    "Karnataka":        ["Goa", "Maharashtra", "Telangana", "Andhra Pradesh",
                         "Tamil Nadu", "Kerala"],
    "Kerala":           ["Karnataka", "Tamil Nadu"],
    "Tamil Nadu":       ["Karnataka", "Andhra Pradesh", "Kerala"],
}

# Short labels used on the map and graph nodes.
LABELS = {
    "Punjab": "PB", "Himachal Pradesh": "HP", "Uttarakhand": "UK", "Haryana": "HR",
    "Rajasthan": "RJ", "Uttar Pradesh": "UP", "Bihar": "BR", "West Bengal": "WB",
    "Jharkhand": "JH", "Odisha": "OD", "Chhattisgarh": "CG", "Madhya Pradesh": "MP",
    "Gujarat": "GJ", "Maharashtra": "MH", "Goa": "GA", "Telangana": "TG",
    "Andhra Pradesh": "AP", "Karnataka": "KA", "Kerala": "KL", "Tamil Nadu": "TN",
}

# Default node positions for the node-link graph view (roughly geographic,
# so the graph visibly mirrors the map). Users can drag nodes freely.
LAYOUT = {
    "Punjab": (165, 115), "Himachal Pradesh": (243, 78), "Uttarakhand": (312, 112),
    "Haryana": (228, 165), "Rajasthan": (160, 225), "Uttar Pradesh": (335, 215),
    "Bihar": (448, 232), "West Bengal": (505, 262), "Jharkhand": (425, 293),
    "Odisha": (430, 365), "Chhattisgarh": (357, 350), "Madhya Pradesh": (268, 312),
    "Gujarat": (135, 322), "Maharashtra": (252, 395), "Goa": (200, 470),
    "Telangana": (325, 432), "Andhra Pradesh": (385, 470), "Karnataka": (275, 488),
    "Kerala": (240, 580), "Tamil Nadu": (315, 585),
}
