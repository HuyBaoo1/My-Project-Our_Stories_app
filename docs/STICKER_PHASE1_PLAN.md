# Sticker integration — Phase 1 scope and contracts

## Authority and scope

The current request explicitly says **continue in Phase 1**. The attached sticker master prompt describes both mock UI and eventual production Firebase behavior. Its requested production transaction/rules implementation is deferred under that explicit scope. This task delivers local sticker assets, mock first-writer/day metadata, picker/calendar/day UI, actual tests, future Firestore design and independent review. Production rules remain deny-all; no provisioning, OAuth, production writes, image upload or deployment.

Source reference: user-supplied `download.jpg`, 675×1200, fifteen drink tops in three columns and five rows. Extract original pixels locally without generative reconstruction or third-party upload. Exact provenance/license was not supplied: production distribution requires owner confirmation of rights. Adjacent rims and JPEG edge artifacts require contact-sheet review.

Baseline before edits: `cdf4b2ef53a28633be701a019ffda8d2583bc80f`; clean tracked working tree. Existing unpushed local commits are preserved.

## Contracts agreed before integration

- Catalog: `stickerCatalog`, `StickerId`, `getSticker(id)`, `isStickerId(value)`. Stable IDs `sticker-001`…`sticker-015`, full transparent PNG and 96px thumbnail URLs, descriptive names and dimensions.
- Day metadata: `dayKey`, nullable first-writer UID/name/first-note ID, nullable representative sticker ID and assignment/update times; provenance distinguishes new local commits, explicit fixture order and unknown legacy history.
- Existing note interface and formatting stay intact. `MockDiaryStore.getSnapshot()` continues to return notes; `getDayMetadata(dayKey)` exposes day metadata; `assignDaySticker(dayKey, id, actorUid)` validates identity and ID before persisting.
- First successful local note commit creates first-writer metadata exactly once. No automatic sticker. Pending selection remains until an eligible writer explicitly confirms one valid sticker. Initial selection is immutable in this MVP; no admin override.
- Later notes, edits and soft-delete never transfer attribution or clear a sticker. Metadata remains if all notes are hidden.
- Persist notes and day metadata in one versioned local envelope so a failed storage write changes neither visible state. Existing v1 arrays must preserve rich text and notes during migration; unknown legacy commit order does not grant invented first-writer rights.
- Mock commits are synchronous local operations, **not Firestore transactions or an atomic cross-tab database**. Local actor checks are UI/business demonstrations, not authentication/security boundaries.
- Calendar and day detail resolve the same day-level sticker ID, independent of the author filter. Calendar downloads thumbnails; picker uses thumbnails; day detail can use full image.

## Work allocation

The environment supports four live agent slots including the root. Real delegation therefore runs in waves rather than claiming five simultaneous children:

1. Agent A: extraction/catalog/contact sheet; Agent B: props-only sticker UI; Agent C: mock metadata and future Firebase design, concurrently. Root owns scope, contracts and existing-page integration.
2. As slots free, Agent D: public-interface unit/browser/asset tests and executed QA; Agent E: independent architecture/standards/spec review. Root resolves integration and review findings.

File ownership is disjoint during implementation. No agent commits or changes another agent's files without coordination; root reviews and creates local commits after checks.

## Acceptance and deferred tests

Phase 1 acceptance: all fifteen PNGs inspectable with alpha; catalog valid; eligible local first writer can select only once; other actor and invalid IDs rejected; pending/legacy states honest; history retained after deletion; same sticker on calendar/day; keyboard/touch picker; errors retain state; rich-text regression and 360px/1440px UI pass.

Future Firebase acceptance remains outstanding: verified Google identity plus active exact-diary membership, atomic competing first-note transactions with exactly one winner, immutable first-writer metadata, rules bypass tests, real transaction failures and quota/access-call budgets. Existing deny-all emulator tests can verify Phase 1's blocked backend but cannot prove those future behaviors.
