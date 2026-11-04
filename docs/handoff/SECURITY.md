# Security & Privacy Requirements — Shared Diary v1.0

## 1. Trust model

This is an Internet-hosted **private** family/friends journal, not a LAN-only website. Anyone with an active invite URL and a Google account can join. URL is a bearer invite secret: do not share it publicly; a leaked URL grants joining ability until revoked. Google Auth is proof of identity, not of membership.

## 2. Authentication

- Firebase Auth provider: Google only.
- Require verified email and Google sign-in provider (or validated linked Google identity per final rule design).
- Users may use personal Gmail. Avoid requesting extra Google API OAuth scopes.
- All content routes gated behind Firebase authentication + membership check.
- Use browser initial-letter avatars; never access Google Drive, photos, or Gmail content.

## 3. Invite-link onboarding

- URL structure: `/join/:diaryId/:inviteToken`.
- Token is cryptographically random (at least 128 bits, preferably 192+), not sequential or human-readable.
- Security Rules: `allow get` invite by exact token to verified Google user; `allow list: if false` for invites; admin controls create/update/revoke.
- Rules on `members/{uid}` create: exact uid match, role member, active status, valid invite under the same diary, allowed field set. Deny self-promotion.
- Rules for reading/editing notes: verify active membership on **each request**, not just at join time.
- Do not expose token in logging, analytics, referrer to third-party sites. Prefer referrer-policy no-referrer or strict-origin, and remove token from browser URL after successful join.
- Member revocation blocks new Firestore requests; data already exported or cached on devices cannot be remotely erased. Explain this limitation.

## 4. Firestore Rules

Default deny all. Scope allow get/list/create/update/delete explicitly by collection. At minimum:

- `diaries`: member read, owner settings update, nonmember denied.
- `invites`: exact-token get only after Google authentication; no listing; owner create/revoke with validated schema.
- `members`: active member read, owner admin/revoke; new user self-join only with valid invite, role fixed to member.
- `days`: active member read; carefully validate summary modifications; no unauthenticated writes.
- `notes`: active member create/read/edit; authorUid, createdAt and date immutable; revision monotonic; content size/type and safe format validated; soft-delete only.
- `revisions`: immutable append-only snapshots; only members read; enforce snapshot consistency with note edits where feasible.

Rule `get()`/`exists()` references have per-request limits and may count toward read quotas. All permissions must be tested with `@firebase/rules-unit-testing` against the Firestore Emulator, including forged UIDs, revoked invites, removed users and modified role.

## 5. Rich text safety

- Store and render validated Tiptap JSON, not arbitrary user HTML.
- Enable only approved nodes/marks. Disallow script tags and unsafe URL protocols (`javascript:`, `data:`) in links.
- Limit note length/serialized size; protect against massive pasted content. **Firestore Rules cannot fully and recursively validate an arbitrary Tiptap JSON tree**: Rules should validate authorized fields and high-level types; app must validate the complete editor schema at runtime and render only allowed nodes/marks, with safe link handling. Do not describe client validation as a security boundary.
- Escape note previews as text. Restrict client rendering to a safe component tree.
- No file uploads of any kind, no image embeds, no user photo bucket.

## 6. Collision / history / deletion

- All note edits use optimistic revision conflict detection (`runTransaction`, expected revision check).
- On conflict do not discard local draft or overwrite server version.
- Soft-delete through UI; history snapshots on edit/delete; no hard-delete API accessible to members.
- Security rules and application must agree on update/version restrictions; security tests mandatory.

## 7. Backup (no paid services)

- Owner exports diary to local JSON via authenticated browser and may manually store an encrypted copy in a trusted location.
- No automated managed backup/PITR on Spark; verify backup and restore procedure in emulator before production use.
- Refrain from storing private diary content in public GitHub repositories, logs, error tracking, or Codex prompts.
- Explain that backup file contains private content and must be protected by the owner.

## 8. Deployment controls

- Firebase project must remain on Spark without billing account.
- Never paste service-account JSON key into frontend/env or commit to GitHub.
- Firebase web SDK config (`VITE_FIREBASE_*`) is not a secret; protection relies on Security Rules and correctly configured auth domains.
- Avoid public production test mode rules. Setup staging with emulator, not publicly readable test data.
- Manual review before production `firebase deploy`.
