# Institute branding

`ait-logo.png` is the official logo of the Army Institute of Technology, Pune,
as provided for this project (175 × 150 px, white background). It is used,
unmodified, in:

* the app header (next to the institute and project name),
* the institutional header on the Home page,
* the footer of the Home page (a white band, matching the logo's background).

`components/InstituteLogo.jsx` loads whichever of these files is present:

    ait-logo.svg   (preferred, if the institute provides a vector version)
    ait-logo.png / ait-logo.webp / ait-logo.jpg

The logo is always shown at a fixed height with its original aspect ratio and
colors: it is never stretched, recolored or filtered. A higher-resolution
version (SVG, or a PNG at least 300 px tall) would look sharper on high-DPI
screens; drop it in with the same name to replace the current file.

If no logo file is present, the Home header shows a labeled placeholder and
the institution is identified by name only.
