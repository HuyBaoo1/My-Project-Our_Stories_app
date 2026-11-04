# First writer and representative sticker — Phase 1

**Status: implemented in the local mock only.** Firebase Auth/membership, Firestore transactions and feature authorization Rules below are a proposal for a later approved phase. The runnable `firestore.rules` remains deny-all. This document does not claim cross-user database concurrency or production security has been verified.

## Shared interface

`MockDiaryStore` keeps its existing note interface and adds:

```ts
getDayMetadata(dayKey: string): DayMetadata | undefined
assignDaySticker(dayKey: string, stickerId: string, actorUid: string): void
```

An optional third constructor argument `{ uid, name }` supplies a mock actor for tests. It defaults to the existing mock viewer. This is not authentication; local JavaScript/localStorage can be altered by a browser user.

`DayMetadata` is independent of an individual note's lifecycle:

| Field | Local type | Meaning |
| --- | --- | --- |
| `dayKey` | string | Original selected calendar date |
| `firstWriterUserId` | string or null | Actor who committed the first new mock note; null when unknown |
| `firstWriterDisplayName` | string or null | Original display-name snapshot |
| `firstNoteId` | string or null | Original note ID, retained when that note is hidden |
| `representativeStickerId` | catalog ID or null | The one day-level selection; null means pending/unknown |
| `stickerAssignedAt` | ISO timestamp or null | Initial local selection time |
| `stickerUpdatedAt` | ISO timestamp or null | Same timestamp for the initial-only MVP |
| `provenance` | `local-commit`, `fixture-order`, `legacy-unknown` | Distinguishes an observed local write from illustrative fixtures and unknown legacy history |

## Implemented mock behavior

- A new empty day has no invented writer or sticker. The first successful `save` creates its note and day metadata together. Validation and persistence failure publish neither new note nor new metadata.
- Actor assignment follows the successful local operation, not a sorted `createdAt` timestamp. Later saves preserve the first-writer metadata.
- Only the exact first-writer UID can make the initial selection, and only an ID from the local approved catalog is accepted. The caller UID must also match the store's configured mock actor, so another actor's store cannot claim a first writer's identity through that method argument. An already selected sticker cannot be replaced in this MVP; there is no admin override.
- A first writer who skips selection leaves the day pending. No representative sticker is inferred from note emoji or randomly chosen.
- Soft-deleting the original note, or every note in that day, retains attribution and sticker metadata. Existing revision handling and rich JSON are unchanged.
- A sticker-only update publishes a new note-array snapshot so existing React subscribers refresh both calendar and day header without introducing another listener.
- Notes and metadata are stored together in one `schemaVersion: 2` JSON envelope under the existing `our-stories:mock-notes:v1` localStorage key. Keeping the key lets current storage-event handling and existing saved notes migrate in place.
- A valid v1 array preserves its note content exactly. It has no reliable first-commit record, so its days migrate to `legacy-unknown`, with null attribution and sticker. Later notes cannot claim those days. Fresh explicit fixtures use their declared array order only as a labeled illustration (`fixture-order`).
- Missing/invalid persisted metadata for otherwise valid notes becomes unknown instead of electing a new writer. The original note ID must still match the retained note document for known attribution to be accepted on reload.

LocalStorage's single-value write prevents a partially published notes/metadata pair inside this mock. It is **not** a transactional multi-tab or multi-device database: concurrent tabs can still lose updates. The actor parameter, local clock, catalog checks and UI eligibility are prototype behavior, not a security boundary. Existing disposable-mock fallback behavior for completely malformed saved notes remains; real data must wait for the approved Firestore/backup phases.

## Future Firestore model — NOT IMPLEMENTED

Extend `diaries/{diaryId}/days/{dayKey}` with first-writer fields above, using Firestore timestamps for assignment times. Store only a validated sticker ID, not an image URL or binary. `firstWriterDisplayName` is an immutable snapshot, and the first-note document is retained through soft-delete. A legacy day without reliable first-commit history must not be automatically claimed by the next writer; its remediation needs a separately reviewed migration.

### First-note transaction proposal

1. Generate the new note ID once, outside the transaction callback. Read the day metadata before writing.
2. If the day does not exist, create the note and day together with `firstWriterUserId == auth.uid`, `firstNoteId == newNoteId`, and null sticker/timestamps.
3. If the day already exists, create only the new note and preserve all first-writer/sticker fields. Viewing an empty calendar date must never create a claimable day document.
4. Resolve UI success only after the transaction commits; keep the draft on failure. Avoid application-state effects inside a retryable callback.

Firestore transactions retry when a document read changes, require reads before writes, apply their writes atomically, and fail offline. **Inference/design:** making contenders read/write the same initially absent day document gives them one serialized first-writer decision; this must still be proved with two-client emulator tests. [Firebase transaction documentation](https://firebase.google.com/docs/firestore/manage-data/transactions).

### Initial sticker-selection transaction proposal

Read the day, verify an active exact-diary membership and matching first-writer UID, require its sticker field to be null, validate the ID against the same 15-ID allowlist, then update only sticker ID and paired server timestamps. Keep first-note/writer fields immutable. If two selections race, one should commit and the retried second should see the assigned value and fail. There is no reset, replacement or owner override in this MVP.

### Future Rules invariants

- Every content request requires verified Google identity **and** active membership in the exact diary; knowing a UID or using the right sticker ID grants no access.
- Day creation must be tied to a newly created same-day note in the same atomic write: validate that note's post-state author, ID and timestamp. A separate empty-day claim is denied.
- Note creation for a previously absent day must require the paired day metadata post-state to identify that note. Once a day exists, subsequent note writes cannot change its first writer.
- Initial sticker update requires current first writer, current null sticker, catalog allowlist membership and paired `request.time` timestamps. All other fields stay fixed. Deletion/clearing/reassignment of historical metadata is denied.

Rules can inspect related post-write documents using `getAfter()`. Access budgets apply both per operation and to an atomic request (10 and 20 calls respectively), and rule reads can consume quota. Count membership, day and paired-note checks in the emulator instead of assuming the design fits. [Firebase Rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions).

Use exact field sets/types and `diff().affectedKeys().hasOnly(...)` to constrain sticker updates; the allowlist must be maintained alongside catalog releases. Client checks alone do not enforce this. [Firebase field-level Rules guidance](https://firebase.google.com/docs/firestore/security/rules-fields).

### Spark impact

Proposal: the first note adds one day-document write alongside its note; selecting the sticker adds one day update. Later notes preserve metadata and need no sticker rewrite. Month views read only bounded day summaries, including historical sticker-only days; full note text is not fetched for sticker rendering. Keep static PNGs in Hosting, avoid image binaries in Firestore, and add no cloud functions or image-hosting service. These are planned operations, not measured production usage.

## Required future emulator tests — NOT EXECUTED for this feature

- Two verified member clients submit the first note concurrently: both notes persist, exactly one immutable first writer/first-note pair survives, and no client timestamp determines the winner.
- A malicious client creates only a day claim, claims with another user's note, spoofs the UID/day, points to an existing note, or writes mismatched first metadata: all denied.
- First writer selects a valid ID once; another member, nonmember, anonymous, revoked member and non-Google identity cannot assign or replace it.
- Reject invalid IDs, image URLs, arbitrary fields, changed first-note/writer snapshots, client timestamps, null-reset and repeat selection.
- Two first-writer selection transactions race: exactly one initial sticker persists, with paired timestamps.
- Soft-deleting the original/all notes leaves day metadata intact; hard-delete cannot erase attribution.
- A failed/offline transaction retains the editor draft and never displays a committed success state.
- Calendar and day query paths observe the same sticker; queries/listeners stay month/day scoped and are unsubscribed correctly.
- Validate call budgets for combined writes and preserve all existing rich-text, note revision and membership tests.

Use `@firebase/rules-unit-testing` and the actual Firestore Emulator, not mock assertions, for those authorization/transaction claims. [Firebase emulator Rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator). The current deny-all baseline tests do not establish any of these positive feature paths.

Official sources checked 2026-11-05. No Firebase project, real OAuth, production data or deployment was used for this proposal.
