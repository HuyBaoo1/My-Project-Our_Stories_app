# Sticker assets — Phase 1

## Source and scope

The user supplied `download.jpg`, **675 × 1200 px**, containing **15 drink tops** arranged in three columns and five rows. This request authorizes extracting and bundling that fixed catalog for the local Phase 1 prototype. It does not add user uploads, image storage, Firebase Storage, or any external image service.

Source SHA-256: `ff0b97e4839a9617389de2f7f851efb5bce502fd5620e15b677b605e728f3a5d`.

Extraction was performed locally with Pillow **12.3.0** and NumPy **2.4.6**. No image was uploaded, sent to a generative model, redrawn, recolored or completed with invented artwork.

## Output

- `public/stickers/sticker-001.png` through `sticker-015.png`: transparent RGBA crops, in source reading order.
- `public/stickers/thumbs/sticker-001.png` through `sticker-015.png`: aspect-preserving thumbnails, maximum **96 × 96 px**.
- `public/stickers/contact-sheet.png`: **780 × 1368 px** checkerboard sheet for manual review; not intended to be loaded by the calendar.
- `public/stickers/metadata.json`: dimensions, crop coordinates, byte counts, source hash and extraction algorithm identifier.
- `src/features/stickers/stickerCatalog.ts`: stable catalog IDs, display names, full/thumbnail URLs, dimensions, `getSticker()` and `isStickerId()`.
- `scripts/extract-stickers.py`: repeatable local extraction from the supplied source dimensions. It deliberately refuses a differently sized source rather than rescaling or guessing new crop bounds.

| ID | Display name | Full PNG dimensions | Full PNG bytes |
| --- | --- | --- | --- |
| sticker-001 | Ly kem sô-cô-la | 227 × 229 | 102,688 |
| sticker-002 | Trà túi lọc | 221 × 227 | 71,243 |
| sticker-003 | Ly trà vàng | 225 × 224 | 91,733 |
| sticker-004 | Sữa kẹo dẻo | 227 × 226 | 78,429 |
| sticker-005 | Cà phê đá | 228 × 228 | 111,373 |
| sticker-006 | Ly đá viên | 221 × 225 | 60,225 |
| sticker-007 | Lon nước | 226 × 228 | 95,936 |
| sticker-008 | Cà phê đen | 225 × 226 | 72,022 |
| sticker-009 | Ly trà xanh | 228 × 225 | 83,445 |
| sticker-010 | Matcha đá | 225 × 222 | 81,032 |
| sticker-011 | Cà phê bọt | 221 × 222 | 101,309 |
| sticker-012 | Ly chanh dây | 220 × 222 | 75,255 |
| sticker-013 | Ly trà đỏ đá | 221 × 222 | 97,727 |
| sticker-014 | Latte chiếc lá | 221 × 223 | 78,197 |
| sticker-015 | Ly trà trái cây | 227 × 226 | 88,371 |

Display names are visual descriptions for the picker, not verified ingredient or product identifications.

Full PNGs total **1,288,985 bytes**; all 15 thumbnails total **294,076 bytes**. The manual-review contact sheet is **960,016 bytes** and should not be imported or preloaded into the application. Use thumbnail URLs in the calendar/picker and only the selected full asset where a larger badge is needed. Store only the stable ID in day metadata, never a PNG binary or data URL.

## Extraction and quality

Each drink was inspected and assigned source bounds. The script samples visible rim sections against the dark background, fits an elliptical alpha silhouette, then supersamples the mask at 4× and downsamples it with Lanczos for an antialiased edge. Only alpha is added to the full crops: every exported RGB pixel is asserted equal to the matching source pixel. Thumbnails are intentionally downsampled without stretching.

The original is a flattened JPEG on a near-black matte, not original transparent artwork. Internal dark coffee, shadows and glass details are retained rather than erased by a global black threshold. A few adjacent rims touch or occlude one another. In particular, `sticker-011` overlaps the right edge of the green `sticker-010`; the visible neighboring brown fragment was excluded from sticker-010. The hidden green rim was **not** reconstructed. Small matte/edge uncertainty at touching rims remains a manual-review item; the fitted silhouette is an extraction approximation, not a claim of access to the original alpha layer.

The source resolution supports small calendar thumbnails and moderate header badges, not a lossless large poster. Review the contact sheet on both light and checkerboard backgrounds before approving the catalog for real use.

## Executed validation

```text
python scripts/extract-stickers.py <local-path-to-download.jpg>
count: 15
fullPngBytes: 1288985

PASS: 15 stable IDs, 15 RGBA crops, alpha range 0..255,
catalog dimensions, 15 aspect-preserving thumbnails <=96px.
```

The extraction run also asserted source RGB equality for every full crop, nonempty alpha, fully transparent and fully opaque pixels, and fractional alpha edge pixels. A separate Pillow validation reopened all exported files and checked ID uniqueness, counts, catalog dimensions, image modes and thumbnail size bounds. The contact sheet and the formerly overlapping green-drink edge were visually inspected.

Reproduction requires a local copy of the exact source and the listed Python libraries:

```text
python scripts/extract-stickers.py <local-path-to-download.jpg>
```

The original JPEG is not copied into the repository or the public assets directory.

## Provenance and distribution gate

The provided file contains no supplied creator attribution, license or permission statement. **Copyright and redistribution rights are unverified.** These assets are integrated for local Phase 1 review; production distribution requires the owner to confirm rights to use and redistribute this image or provide an approved replacement. This is separate from technical extraction quality and from deployment approval. No production deployment or third-party upload was performed.
