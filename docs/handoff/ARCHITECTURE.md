# System Architecture — Shared Diary v1.0

## 1. High-level data flow

```text
Desktop browser (React SPA) ----\
                                  -> Firebase Auth (Google)
Mobile browser (React SPA) -----/       |
                                       v
                          Firestore Security Rules
                                       |
                           Cloud Firestore database
                                       |
                  diaries/{diaryId}/days/{dateKey}/notes

GitHub Private -> Codex / local tests -> Vite static build
                                  -> Firebase Hosting (web.app, HTTPS)
```

No application API server, Cloud Functions, image bucket, or external real-time service is required.

## 2. Architecture decision record (ADR-001)

**Chosen:** React + Vite + TypeScript + Firebase Hosting/Auth/Firestore Standard + Firestore Rules, Spark plan.

**Reasoning:** only text, small group, browser-only, Google login, quick deployment, active realtime and no paid infrastructure. The Firebase JS SDK can connect to Firestore directly subject to security rules.

**Rejected initially:** Next.js SSR/Node server, Supabase + Vercel (more services), self-hosting (maintenance), realtime collaborative text CRDT websocket server (complex/free-tier pressure). Vercel Hobby is viable but not necessary.

**Known tradeoffs:** no hard SLA; service can throttle/stop at free limits. No advanced managed backup/recovery on Spark. Client-based rich document editing is not true same-character co-editing.

## 3. Data delivery, realtime and quotas

- Calendar: query `/diaries/{id}/days` within `[YYYY-MM-01, next-month-first-day)` by document ID or `dayKey`; month summary only; listener limited to current month.
- Day page: subscribe only `/diaries/{id}/days/{dayKey}/notes` sorted by `createdAt`; if many notes, implement initial pagination and load older on demand.
- Avoid reading all notes for every day during calendar render.
- Do not keep listeners for hidden dates or previous months; properly cleanup `onSnapshot` subscriptions.
- No keystroke autosave to Firestore: edit locally and write on intentional Save. This reduces write quota and collisions.
- Day preview: bounded excerpt and noteCount in day metadata updated via transaction/atomic batch. Test concurrent additions for count correctness; if budget/complexity too high, show only a presence dot in v1 and derive count on day open.
- Do not preload all historical months. Keep Firestore indexes minimal, enable only necessary query indexes.
- Firestore security rule reads (`get`/`exists`) may also contribute to billed reads; observe quota.

## 4. Text format contract

Tiptap starter-kit JSON is source-of-truth. Supported marks/nodes: doc, paragraph, text, hardBreak, bold, italic, bulletList, orderedList, listItem, link (if enabled). Store normalized preview text separately for calendar only. Strictly validate allowed schema and length. Never accept arbitrary HTML or script tags. Rendering from JSON must preserve line breaks, lists and mark semantics; sanitize/validate links.

Example value:
```json
{
  "type": "doc",
  "content": [
    {"type":"paragraph","content":[{"type":"text","text":"Hôm nay thật vui!","marks":[{"type":"bold"}]}]},
    {"type":"paragraph","content":[{"type":"text","text":"Một kỷ niệm đáng nhớ."}]}
  ]
}
```

## 5. Concurrency strategy

One note = one Firestore document (avoids full-day document contention and Firestore 1 MiB document limit). Any authorized member may edit a note. Each note has `revision` number. Client reads version V, edits locally, then `runTransaction` rereads current version. If current != V, abort with a conflict; retain local draft, show remote content and offer manual copy/merge. On success, increment version and save edit metadata and (recommended) old revision snapshot atomically. Do not claim transactions work offline; they require network.

**Important:** concurrent writes to different notes should not require a transaction on a shared document if that makes the day metadata a hot spot. If day summaries conflict, use atomic increments, bounded retries, or degrade to an existence marker.

## 6. Hosting

- Build target: static `/dist` output using Vite.
- Use Firebase Hosting (not Firebase App Hosting). SPA rewrite routes to `/index.html`.
- Domain: `<project-id>.web.app`, default HTTPS.
- PWA: optional install manifest + static app icon; no service worker offline writes in MVP.
- Auth popup with redirect fallback on mobile browsers, test both.

## 7. Retention and backup

- Do not hard delete notes through UI; use `deletedAt`, `deletedByUid`, optionally restore.
- If edits are allowed, persist revision snapshots and test immutability + conflict handling.
- Implement owner-only client-side JSON export; a periodic manual download is the free backup strategy. Store backups privately, preferably encrypted. Test restore to **emulator** before using it on production.
- Firebase's managed PITR and managed backup/restore are not part of the free Firestore tier.

## 8. Quota sketch (illustrative, not load-test result)

Suppose 50 users each open the month two times/day; 20 active day docs in the month: `50*2*20 = 2000` initial day document reads/day. If each opens a day containing 20 notes twice: `50*2*20 = 2000` more initial note reads/day. Actual reads differ from realtime change events, security checks, cache and queries. Firestore free Standard quota is 50,000 document reads/day and 20,000 writes/day. Measure in Firebase Console; do not guarantee zero disruption under spike.

## 9. Repository structure target

```text
shared-diary/
  AGENTS.md
  docs/
    PRD.md
    ARCHITECTURE.md
    DATA_MODEL.md
    SECURITY.md
    ROADMAP.md
  src/
    app/
    components/calendar/
    components/daily-page/
    components/note-editor/
    features/auth/
    features/invites/
    features/notes/
    lib/firebase/
    lib/date/
    types/
  tests/
    firestore-rules/
    unit/
    e2e/
  firestore.rules
  firestore.indexes.json
  firebase.json
  .firebaserc
  .env.example
  package.json
  vite.config.ts
```
