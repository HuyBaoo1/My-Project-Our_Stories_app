# Firestore schema and Rules proposal — NOT IMPLEMENTED

The runnable `firestore.rules` is **deny-all**. This document is a design for Phases 2–3. It has not passed membership/invitation/revision emulator tests and is not production-ready. Full handoff: [DATA_MODEL](handoff/DATA_MODEL.md), [SECURITY](handoff/SECURITY.md).

## Paths and shapes

```text
diaries/{diaryId}
  name, ownerUid, timeZone, createdAt
  members/{uid}
    uid, role, status, displayName, joinedAt, inviteId
  invites/{token}
    active, createdAt, createdByUid, expiresAt
  days/{dayKey}
    dayKey, hasNotes, lastActivityAt
    notes/{noteId}
      authorUid, authorNameSnapshot, contentJson, previewText,
      createdAt, updatedAt, updatedByUid, revision,
      deletedAt, deletedByUid
      revisions/{previousRevision}
        priorContentJson, priorRevision, action, editedByUid, editedAt
```

- One default Firestore Standard database, one diary for v1. `dayKey` is an actual `YYYY-MM-DD` in Vietnam, independent of timestamps. Set a supported date range and test month/day validity; a regex alone cannot establish leap-day validity.
- Use cryptographically random diary IDs and invite document IDs (at least 24 random bytes for tokens). No token is generated or embedded in Phase 1.
- Server timestamps for creation/edit/join; require matching `request.time` on mutations. `deletedAt` and `deletedByUid` start as null; enforce paired values.
- Content is approved Tiptap JSON, initial product limit 10,000 text characters and 60 KB UTF-8 JSON. Preview is plain text with a small bound, e.g. 160 characters.
- Rules must enforce exact field sets, data types, bounded strings and note revision numbers. Full nested JSON validation is a client renderer obligation too, not something Firestore Rules can recursively guarantee.
- Calendar day metadata initially uses **presence**, not an unaudited client-controlled count. Exact note counts remain a product choice until concurrent transaction tests pass.

## Authorization matrix

| Path | Read | Create | Update | Delete |
| --- | --- | --- | --- | --- |
| Diary | Active member | Trusted bootstrap only | Active owner; constrained settings only | Denied |
| Members | Active member | Verified Google user joining only own UID through active same-diary invite | Active owner; role/status transitions constrained | Denied; revoke status instead |
| Invites | Verified Google user: exact get only; list always denied | Active owner; bounded schema/random token contract | Active owner: revoke/expiry changes only | Denied |
| Days | Active member | Active member; allowed summary schema | Active member; allowed presence/activity fields only | Denied |
| Notes | Active member | Active member, initial revision 1, author=self | Active member, expected-revision transaction + snapshot | Denied; soft-delete only |
| Revisions | Active member | Active member, only paired with matching note update | Denied | Denied |
| Anything else | Denied | Denied | Denied | Denied |

Every member/owner check must also verify `request.auth`, verified email and the Google sign-in provider. Role labels alone and Google authentication alone grant no note access. Active owner requires exact owner UID and active owner membership; self-join can never grant owner/admin.

## Join and revocation

1. Owner bootstrap is a separately approved trusted console/procedure; the frontend has no bootstrap shortcut.
2. Verified Google user may fetch only the exact invite document; invite listing remains denied for everyone. Unknown/revoked/expired invites cannot join.
3. Membership creation requires `uid == request.auth.uid == path uid`, `role == member`, `status == active`, validated display name, `joinedAt == request.time`, and valid `inviteId` in the same diary.
4. Membership updates cannot reuse the creation flow to reactivate a revoked member, change a role or alter immutable identity. Existing members go directly to the calendar.
5. Revoke a link and revoke a member independently. A revoked link does not remove existing members. Revoked members fail subsequent content requests; already cached/exported data cannot be recalled.
6. Strip a successful join token from browser history; never log tokens or use third-party analytics. Referrer policy is already `no-referrer` in local HTML/Hosting config.

## Atomic revision preservation design

For an edit/delete, a future `runTransaction` reads current note N, compares its revision V with the editor's base, then writes both the updated note V+1 and `revisions/{V}` containing N's prior content.

Rules design to prove in emulator:

- Note update keeps `authorUid`, `authorNameSnapshot`, `createdAt` immutable, increments revision by exactly 1, uses `updatedByUid == auth.uid`, and `updatedAt == request.time`.
- The corresponding revision document must not exist before the operation and must exist in `getAfter()` with exactly the **old** content/revision, current actor, timestamp and allowed action.
- Revision create checks the old parent note and the post-write parent note. The parent must advance exactly one revision in the same atomic operation. A standalone fake revision is denied.
- Revisions cannot be edited or deleted; a forged prior snapshot or a note update without its snapshot is denied.
- Soft-delete keeps content intact and changes paired deletion fields only, alongside normal revision checks. Restore, if included later, needs its own defined transition and tests.
- Keep `get()`/`exists()`/`getAfter()` calls within Firestore per-request and atomic-operation limits. Test actual batched/transaction workloads, not just individual writes.

This design does not authorize last-write-wins. The app must preserve the local draft after a rejected transaction and display the remote version for a deliberate manual resolution. Offline transactions are not promised.

## Query, index and cost plan

- Month: one range query of day summaries for `[month-first, next-month-first)`, no note-body reads on calendar render.
- Day: one active-day note listener, ordered by `createdAt`, with bounded initial page size and a pagination strategy. A filter on `deletedAt` may require a composite index; add it only after actual query validation.
- Subscribe only to visible month/day and unsubscribe on route changes; no per-keystroke writes, no all-history subscriptions.
- Avoid full content indexing: propose disabling indexing for rich JSON and snapshot content after checking query needs.
- `firestore.indexes.json` is intentionally empty in Phase 1 because there are no Firestore UI queries.
- Each revision adds a document write and storage; summaries add writes; authorization lookups can add reads. Monitor Spark quotas before real usage.

## Release gates

Complete [TESTS_TO_WRITE](TESTS_TO_WRITE.md), review actual rule coverage, test multi-account transactions, and validate export/restore in an emulator. Default deny remains until the relevant phase is explicitly approved. No Firebase project, OAuth, owner membership, production write or deployment is created by this proposal.
