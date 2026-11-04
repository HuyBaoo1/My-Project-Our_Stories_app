"""Extract the supplied 3x5 drink sheet locally, retaining original RGB pixels.

Usage: python scripts/extract-stickers.py /path/to/download.jpg
Requires Pillow and NumPy. Does not upload or call a generative image service.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont


# Bounds follow the original 675x1200 reference, in reading order. A few rims
# touch in the source; the mask never synthesizes the occluded image underneath.
DRINKS = [
    ("Ly kem sô-cô-la", (17, 65, 238, 286)),
    ("Trà túi lọc", (230, 57, 445, 276)),
    ("Ly trà vàng", (440, 56, 660, 276)),
    ("Sữa kẹo dẻo", (14, 282, 232, 500)),
    ("Cà phê đá", (226, 275, 449, 497)),
    ("Ly đá viên", (440, 272, 660, 494)),
    ("Lon nước", (14, 493, 235, 719)),
    ("Cà phê đen", (227, 491, 445, 712)),
    ("Ly trà xanh", (443, 493, 663, 716)),
    ("Matcha đá", (15, 724, 238, 946)),
    ("Cà phê bọt", (232, 728, 446, 945)),
    ("Ly chanh dây", (444, 724, 661, 944)),
    ("Ly trà đỏ đá", (7, 938, 231, 1159)),
    ("Latte chiếc lá", (229, 944, 446, 1162)),
    ("Ly trà trái cây", (445, 953, 667, 1177)),
]


def bilinear(rgb: np.ndarray, xs: np.ndarray, ys: np.ndarray) -> np.ndarray:
    xs = np.clip(xs, 0, rgb.shape[1] - 1.001)
    ys = np.clip(ys, 0, rgb.shape[0] - 1.001)
    x0, y0 = xs.astype(int), ys.astype(int)
    dx, dy = (xs - x0)[..., None], (ys - y0)[..., None]
    return (
        rgb[y0, x0] * (1 - dx) * (1 - dy)
        + rgb[y0, x0 + 1] * dx * (1 - dy)
        + rgb[y0 + 1, x0] * (1 - dx) * dy
        + rgb[y0 + 1, x0 + 1] * dx * dy
    )


def alpha_for_drink(rgb: np.ndarray, bounds: tuple[int, int, int, int]) -> tuple[Image.Image, tuple[int, int, int, int]]:
    left, top, right, bottom = bounds
    cx, cy = (left + right - 1) / 2, (top + bottom - 1) / 2
    rx, ry = (right - left) / 2, (bottom - top) / 2
    angles = np.linspace(0, math.tau, 1440, endpoint=False)
    # Search only a narrow band around each hand-inspected circular rim. A
    # whole-image dark threshold would erase the dark liquid inside the glasses.
    radii = np.linspace(1.025, 0.945, 161)
    xs = cx + np.cos(angles)[:, None] * rx * radii
    ys = cy + np.sin(angles)[:, None] * ry * radii
    bg = np.median(np.concatenate([rgb[:25].reshape(-1, 3), rgb[-15:].reshape(-1, 3)]), axis=0)
    distances = np.linalg.norm(bilinear(rgb, xs, ys) - bg, axis=-1)
    foreground = distances > 30
    # Three contiguous samples reject isolated JPEG flecks outside the rim.
    sustained = foreground[:, :-2] & foreground[:, 1:-1] & foreground[:, 2:]
    indices = sustained.argmax(axis=1)
    detected = radii[indices]
    detected[~sustained.any(axis=1)] = 0.985
    # Neighboring rim pixels must not become part of this drink. Conservative
    # ellipse clipping also keeps the algorithm deterministic at source overlaps.
    detected = np.clip(detected, 0.945, 1.015)
    valid = sustained.any(axis=1) & (distances[:, 0] < 30) & (detected < 1.015)
    # Fit the visible rim sections rather than extending a dark/background wedge
    # into a neighboring cup where the source rims touch. All fifteen objects
    # are nearly elliptical drink tops, so this only defines their alpha silhouette.
    normalized_x = np.cos(angles) * detected
    normalized_y = np.sin(angles) * detected
    design = np.column_stack([normalized_x**2, normalized_x * normalized_y, normalized_y**2, normalized_x, normalized_y])
    coefficients, *_ = np.linalg.lstsq(design[valid], np.ones(valid.sum()), rcond=None)
    a, b, c, d, e = coefficients
    quadratic = np.array([[a, b / 2], [b / 2, c]])
    center_offset = -0.5 * np.linalg.solve(quadratic, np.array([d, e]))
    level = 1 + center_offset @ quadratic @ center_offset
    eigenvalues, vectors = np.linalg.eigh(quadratic)
    if (eigenvalues <= 0).any():
        raise RuntimeError("Rim fit is not an ellipse.")
    axes = np.sqrt(level / eigenvalues)
    if (axes < 0.91).any() or (axes > 1.05).any():
        raise RuntimeError("Rim fit exceeds the inspected source bounds.")
    # A quarter source pixel inside the measured transition avoids retaining the
    # original black matte fringe on light application backgrounds.
    axes -= 0.25 / min(rx, ry)
    unit_circle = np.column_stack([np.cos(angles), np.sin(angles)])
    normalized_contour = (unit_circle * axes) @ vectors.T + center_offset
    contour = normalized_contour * np.array([rx, ry]) + np.array([cx, cy])
    padding = 5
    crop = (max(0, left - padding), max(0, top - padding), min(rgb.shape[1], right + padding), min(rgb.shape[0], bottom + padding))
    width, height = crop[2] - crop[0], crop[3] - crop[1]
    scale = 4
    mask = Image.new("L", (width * scale, height * scale))
    points = [((x - crop[0]) * scale, (y - crop[1]) * scale) for x, y in contour]
    ImageDraw.Draw(mask).polygon(points, fill=255)
    mask = mask.resize((width, height), Image.Resampling.LANCZOS)
    return mask, crop


def make_contact_sheet(output: Path, entries: list[dict]) -> None:
    tile_width, tile_height, header = 260, 260, 68
    sheet = Image.new("RGB", (tile_width * 3, tile_height * 5 + header), "#f1efe6")
    draw = ImageDraw.Draw(sheet)
    font_path = Path("C:/Windows/Fonts/segoeui.ttf")
    font = ImageFont.truetype(str(font_path), 15) if font_path.exists() else ImageFont.load_default()
    title_font = ImageFont.truetype(str(font_path), 24) if font_path.exists() else font
    draw.text((20, 12), "OUR STORIES / STICKER CONTACT SHEET", font=title_font, fill="#172bbd")
    draw.text((20, 43), "15 original-pixel crops | checkerboard = transparency", font=font, fill="#65677a")
    for index, entry in enumerate(entries):
        x, y = (index % 3) * tile_width, header + (index // 3) * tile_height
        for gy in range(0, 215, 12):
            for gx in range(0, tile_width, 12):
                color = "#fffefa" if (gx // 12 + gy // 12) % 2 else "#e9e8e2"
                draw.rectangle((x + gx, y + gy, x + min(gx + 11, tile_width - 1), y + min(gy + 11, 214)), fill=color)
        sticker = Image.open(output / f"{entry['id']}.png").convert("RGBA")
        sticker.thumbnail((202, 202), Image.Resampling.LANCZOS)
        sheet.paste(sticker, (x + (tile_width - sticker.width) // 2, y + (215 - sticker.height) // 2), sticker)
        draw.text((x + 12, y + 219), entry["id"], font=font, fill="#172bbd")
        draw.text((x + 12, y + 237), entry["name"], font=font, fill="#65677a")
    sheet.save(output / "contact-sheet.png", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/stickers"))
    parser.add_argument("--catalog", type=Path, default=Path("src/features/stickers/stickerCatalog.ts"))
    args = parser.parse_args()
    image = Image.open(args.source).convert("RGB")
    if image.size != (675, 1200):
        raise SystemExit("Expected the supplied original 675x1200 sheet; refusing to rescale or guess new bounds.")
    rgb = np.asarray(image).astype(float)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "thumbs").mkdir(exist_ok=True)
    entries = []
    for index, (name, bounds) in enumerate(DRINKS, start=1):
        sticker_id = f"sticker-{index:03}"
        alpha, crop = alpha_for_drink(rgb, bounds)
        if index == 10:
            # The brown drink to the right overlaps the green drink's visible
            # rim in the source. Exclude that foreground occluder rather than
            # inventing the hidden green rim or keeping a brown fragment.
            neighbor_alpha, neighbor_crop = alpha_for_drink(rgb, DRINKS[10][1])
            occluder = Image.new("L", alpha.size)
            occluder.paste(neighbor_alpha, (neighbor_crop[0] - crop[0], neighbor_crop[1] - crop[1]))
            alpha = ImageChops.subtract(alpha, occluder)
        sticker = image.crop(crop).convert("RGBA")
        sticker.putalpha(alpha)
        # Keep a two-pixel transparent margin around the detected contour.
        bbox = alpha.getbbox()
        if bbox is None:
            raise RuntimeError(f"No foreground found for {sticker_id}")
        actual = (max(0, bbox[0] - 2), max(0, bbox[1] - 2), min(sticker.width, bbox[2] + 2), min(sticker.height, bbox[3] + 2))
        sticker = sticker.crop(actual)
        source_crop = (crop[0] + actual[0], crop[1] + actual[1], crop[0] + actual[2], crop[1] + actual[3])
        path = args.output / f"{sticker_id}.png"
        sticker.save(path, optimize=True)
        thumbnail = sticker.copy()
        thumbnail.thumbnail((96, 96), Image.Resampling.LANCZOS)
        thumbnail.save(args.output / "thumbs" / f"{sticker_id}.png", optimize=True)
        # Assert every exported RGB pixel is the actual source sample, including
        # partially transparent edge pixels. Only the alpha channel was added.
        assert np.array_equal(np.asarray(sticker)[:, :, :3], np.asarray(image.crop(source_crop)))
        values = np.asarray(sticker)[:, :, 3]
        assert values.min() == 0 and values.max() == 255 and ((values > 0) & (values < 255)).any()
        entries.append({"id": sticker_id, "name": name, "src": f"/stickers/{sticker_id}.png", "thumbnailSrc": f"/stickers/thumbs/{sticker_id}.png", "width": sticker.width, "height": sticker.height,
            "sourceCrop": source_crop, "sourceBounds": bounds, "bytes": path.stat().st_size, "thumbnailWidth": thumbnail.width, "thumbnailHeight": thumbnail.height})
    make_contact_sheet(args.output, entries)
    metadata = {"sourceSha256": hashlib.sha256(args.source.read_bytes()).hexdigest(), "sourceWidth": image.width, "sourceHeight": image.height, "algorithm": "original-pixel-visible-rim-ellipse-mask-v1", "stickers": entries}
    (args.output / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    catalog_entries = [{key: entry[key] for key in ("id", "name", "src", "thumbnailSrc", "width", "height")} for entry in entries]
    catalog = "// User-supplied reference, locally extracted. See docs/STICKER_ASSETS.md for provenance and limitations.\n"
    catalog += "export const stickerCatalog = " + json.dumps(catalog_entries, ensure_ascii=False, indent=2) + " as const\n\n"
    catalog += "export type Sticker = (typeof stickerCatalog)[number]\nexport type StickerId = Sticker['id']\n\n"
    catalog += "export function getSticker(id: string | null | undefined): Sticker | undefined {\n  return stickerCatalog.find((sticker) => sticker.id === id)\n}\n\n"
    catalog += "export function isStickerId(value: unknown): value is StickerId {\n  return typeof value === 'string' && getSticker(value) !== undefined\n}\n"
    args.catalog.parent.mkdir(parents=True, exist_ok=True)
    args.catalog.write_text(catalog, encoding="utf-8")
    print(json.dumps({"count": len(entries), "fullPngBytes": sum(entry["bytes"] for entry in entries), "contactSheet": str(args.output / "contact-sheet.png"), "dimensions": [[entry["width"], entry["height"]] for entry in entries]}, indent=2))


if __name__ == "__main__":
    main()
