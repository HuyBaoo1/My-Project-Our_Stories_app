# Firestore Data Model — Shared Diary v1.0

## 1. Collection hierarchy

```text
/diaries/{diaryId}
  name, ownerUid, timeZone, createdAt
  /members/{uid}
    uid, role, status, displayName, joinedAt, inviteId
  /invites/{inviteToken}
    active, createdAt, createdByUid, expiresAt? (optional)
  /days/{YYYY-MM-DD}
    dayKey, noteCount?, lastActivityAt?, previewText?
    /notes/{noteId}
      authorUid, authorNameSnapshot, contentJson, previewText,
      createdAt, updatedAt, updatedByUid, revision, deletedAt?, deletedByUid?
      /revisions/{revisionId}
        priorContentJson, priorRevision, action, editedByUid, editedAt
```

Use Firestore **Standard** and its default database. Do not create second named databases (not covered by the free quota). No images or file blobs.

## 2. Important invariants

- `diaryId` and `inviteToken` must be crypto-strong random, unguessable. Secret invite token is a bearer capability; sharing it grants an authenticated user the ability to join.
- `YYYY-MM-DD` must be validated as a real local calendar date and stored as key separately from `createdAt`.
- `authorUid` and `createdAt` are immutable after note creation; `updatedByUid` indicates last editor.
- Application accepts and renders only approved Tiptap JSON nodes/marks; Firestore Rules should enforce top-level type/field constraints where possible. Arbitrarily nested JSON cannot be fully recursively checked by Rules; rendering must never trust client-provided raw HTML. Document size and maximum characters are bounded below Firestore 1 MiB/document limit.
- `revision` increments by exactly 1 on successful edit. On conflict, never overwrite without explicit user action.
- Soft-delete and revisions preserve historic content. Revisions are immutable to normal users.
- If using summary `noteCount`, update it atomically; do not trust a count written solely by the UI without validation.

## 3. Proposed note JSON (illustrative)

```json
{
  "authorUid": "firebase-uid",
  "authorNameSnapshot": "An",
  "contentJson": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Ngày thật đẹp!", "marks": [{"type":"bold"}] }]
      }
    ]
  },
  "previewText": "Ngày thật đẹp!",
  "revision": 1,
  "updatedByUid": "firebase-uid"
}
```

`createdAt`, `updatedAt` should be Firestore Timestamp values, ideally `serverTimestamp()`; dayKey defined by explicitly selected calendar day, not inferred from server clock.

## 4. Queries and indexes

- Calendar: range by `dayKey` or doc ID, `orderBy(dayKey)`; one month maximum, no all-history query.
- Day: `orderBy(createdAt, 'asc')` over `days/{dayKey}/notes`, with active or deleted filtering. Composite index may be required for combined filters and order; follow actual Firebase index hint.
- History navigation: by month, then selected day. Never scan all diaries.
- Backups: fetch paginated day docs + notes. Provide import/restore verification outside production.

## 5. Signup and permissions bootstrap

1. Owner initializes diary and owner membership by a **one-time trusted admin procedure** or documented Firebase Console setup; do not expose admin keys in client bundle.
2. Owner creates invite document with long random token via approved owner-only flow.
3. New user opens link, signs in with Google, fetches exact invite by token, then creates only own membership with role=`member`.
4. Firestore Rules verify Google identity, invite existence/status, UID match, allowed schema and `get/exists()` authorization; users cannot set role=`owner` or `admin`.
5. Owner can revoke link; existing members can be revoked separately.

## 6. Version history strategy

For edits/deletes: preferred implementation uses a Firestore transaction with current note revision check and a newly created immutable revision snapshot of the **previous** note content. Security Rules should test that unauthorized clients cannot modify/delete revisions or bypass required revision creation. If enforcing atomic revision preservation entirely in Firestore Rules is impractical, document the unresolved gap and block production use until an approved solution is reviewed; do not silently claim an audit guarantee.

## 7. Retention and storage

Text-only content is small, but index overhead, version copies and membership documents consume Firestore quota. Set a sensible maximum per note (suggest initial product limit 10,000 text characters, verify actual JSON bytes); allow multiple notes per day rather than giant documents.
