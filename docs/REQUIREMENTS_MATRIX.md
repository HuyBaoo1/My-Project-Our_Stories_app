# Phase 0/1 — Requirement matrix

Source: all eleven files in [handoff](handoff/README.md), particularly [the execution prompt](handoff/CODEX_PROMPT_PHASE_0_1.md). The handoff's full-product acceptance criteria are distinct from Phase 1 acceptance.

| Requirement | Phase 1 result / boundary | Evidence |
| --- | --- | --- |
| React/Vite, strict TypeScript | Scaffolded; strict, exact optional properties, unchecked indexes enabled | `package.json`, `tsconfig.*.json` |
| Tailwind + shadcn/ui | Tailwind Vite integration, theme tokens; local shadcn-style Radix/CVA Button and `components.json` | `src/index.css`, `src/components/ui/button.tsx` |
| FullCalendar Standard month | Month navigation, dated summaries, accessible day buttons | `src/components/calendar/` |
| Responsive desktop/mobile | Desktop calendar/day panel; mobile day route, compact month | Playwright 1440px and 360px checks |
| One page/day, separate notes | Explicit local mock note documents, ordered by creation time | `src/features/notes/mock-store.ts` |
| Rich text JSON | Runtime tree/size validation, safe semantic renderer, Tiptap | Unit and browser persistence checks |
| DayKey independent of timestamps | Vietnam date helper; selected historical date retained on create | Date/store unit tests and historical-day browser test |
| Edit conflicts/drafts/history | Local mock demonstration; session drafts, revision snapshots, soft-delete | Mock adapter tests; no cloud guarantee |
| Google + valid invite + active membership | NOT IMPLEMENTED; `/join` explains the boundary | Phase 2 proposal |
| No nonmember content access | All backend client operations currently denied | Deny-all emulator baseline, not future auth acceptance |
| Firebase SDK + Emulator | Centralized emulator-only initializer; UI does not import it | `src/lib/firebase/client.ts`, `firebase.json` |
| Production note CRUD/realtime | NOT IMPLEMENTED | Phase 3; no `onSnapshot` subscriptions yet |
| Export/restore | NOT IMPLEMENTED | Mandatory before real usage |
| Spark, no uploads or paid services | No project provisioning, storage, paid extension or billing action | Local-only configuration |
| Private GitHub source | Existing repo is public; visibility NOT changed | Owner decision before private use |
| Required checks/report | Commands executed and recorded with actual results | `PHASE_1_REPORT.md` |

## Risks and implementation decisions

1. **Authorization is a release gate.** Google identity is insufficient; exact active membership and verified Google provider must be checked in every future content rule. Phase 1 deliberately ships no permissive rules.
2. **Rich JSON cannot be recursively authorized by Rules.** Client validation protects this renderer but is not a security boundary. Future rules must bound fields/types/size while clients always validate untrusted stored content.
3. **Revision consistency needs atomic proof.** Deterministic immutable snapshots and `getAfter()` checks are proposed; bypass attempts and stale transactions must pass emulator tests before enabling edits.
4. **Summary contention and integrity.** Counts require cross-document validation, consume writes and can become a hotspot. Prefer an existence marker first if a correct count is too costly. Phase 1 derives counts solely from local fixtures.
5. **Mock persistence is disposable.** LocalStorage is not private shared storage, not backup, and not an atomic cross-tab database. Browser errors keep an editor open; malformed saved mock data falls back to fixtures.
6. **Date and device timezone differ.** Content keys and display use Vietnam. FullCalendar receives date-only strings; avoid deriving content dates from UTC timestamps. Support is bounded to 1900–2100.
7. **Quota estimates are not measurements.** Future listeners must cover one month and one day, unsubscribe on navigation, and never save per keystroke. Revisions and rule reads increase storage/read/write usage.
8. **Owner bootstrap and leakage.** No owner initialization or real invitation is generated here. Use an approved one-time trusted process later; never place admin credentials or tokens in frontend or logs.
9. **Dependencies and source visibility.** See report for npm audit findings. Public source must contain no private diary data. Private-repo preference remains unresolved.

## Verified primary implementation references

- [Vite guide](https://vite.dev/guide/) and installed scaffold/package metadata; generated Vite 8 config is validated by actual build.
- [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), [shadcn Vite guide](https://ui.shadcn.com/docs/installation/vite), [Button](https://ui.shadcn.com/docs/components/button).
- [FullCalendar React source, v6.1.22](https://github.com/fullcalendar/fullcalendar-react/tree/v6.1.22); all calendar packages pinned to the same Standard v6 release. Current generic docs describe v7, so version-specific package/source APIs were used.
- [Tiptap StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit), [Link](https://tiptap.dev/docs/editor/extensions/marks/link).
- [Firebase emulator configuration](https://firebase.google.com/docs/emulator-suite/install_and_configure), [Rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

Checked 2026-11-05. Package compatibility is evidenced by installation, strict type checking and build, not inferred from documentation alone.
