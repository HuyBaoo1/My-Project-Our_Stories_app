# CODEX MASTER PROMPT
## Shared Diary — Sticker Asset Integration & First Writer of the Day

### ROLE

Act as a Senior Software Architect, Technical Lead, and Multi-Agent Orchestrator.

You are working in the existing Shared Diary repository.

The user will provide a reference image containing a collection of stickers. Your task is to extract the stickers, integrate them into the application, and implement a feature that allows the first writer of each calendar day to select a representative sticker.

**Use Codex sub-agents to parallelize independent tasks wherever supported.**

Do not create simulated sub-agents or claim parallel execution if the current Codex environment does not support actual delegation.

## 1. PROJECT CONTEXT

Shared Diary is a private shared journal application.

Existing planned stack:

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- FullCalendar
- Firebase Authentication (Google)
- Cloud Firestore
- Firebase Hosting
- Rich-text notes
- Mobile and desktop responsive layouts

Core product behavior:

- Users join through an invitation link and Google authentication.
- Multiple members contribute notes to the same calendar day.
- All members can read the shared diary.
- Notes retain their original rich-text formatting.
- Historical notes remain accessible.
- Firebase Spark remains the target hosting and database plan.

The reference image will be provided directly by the user.

Inspect the actual repository and implementation before making architectural assumptions.

## 2. GLOBAL EXECUTION RULES

1. Read `AGENTS.md`, project documentation, and repository configuration.
2. Check whether Matt Pocock Skills are available.
3. Use relevant installed skills for requirement analysis, implementation, testing, and code review.
4. Inspect the current Git status and identify uncommitted user changes.
5. Preserve existing functionality and design conventions.
6. Do not introduce paid services, external image-hosting services, or cloud functions requiring billing.
7. Do not upload the reference image to any third-party service without explicit approval.
8. Do not modify unrelated project files.
9. Use real tests and report actual outcomes.
10. Do not fabricate asset extraction results, successful tests, or sub-agent execution.
11. Do not deploy production changes without approval.
12. Preserve mobile responsiveness and accessibility.
13. Treat the provided sticker image as an exact visual reference. Do not redesign the characters, colors, expressions, or illustration style.
14. Flag any copyright or licensing uncertainty before production distribution.

## 3. SUB-AGENT ORCHESTRATION

Spawn the following specialized agents using the available Codex sub-agent mechanism.

Run independent analysis and implementation tasks concurrently where possible.

### Agent A — Sticker Asset Specialist

Ownership:

- Reference image inspection
- Image segmentation
- Background removal
- Sticker cropping
- Asset export
- Sticker metadata

Tasks:

1. Locate and inspect the user-provided reference image.
2. Identify all distinct stickers.
3. Evaluate image resolution, overlapping elements, and background complexity.
4. Extract each sticker as an independent transparent PNG.
5. Preserve original artwork and anti-aliased edges.
6. Remove unwanted background pixels and visual artifacts.
7. Maintain original aspect ratios.
8. Avoid distorted scaling.
9. Generate a contact sheet for manual review.
10. Create a sticker catalog with stable IDs.

Suggested structure:

`public/stickers/sticker-001.png`

`src/features/stickers/stickerCatalog.ts`

Return:

- Sticker count
- Asset filenames
- Image dimensions
- Extraction quality assessment
- Problems requiring user review

Do not silently invent missing portions of an illustration.

### Agent B — UI/UX Engineer

Ownership:

- Calendar sticker presentation
- Sticker picker interface
- Daily header
- Mobile responsive experience

Tasks:

1. Inspect the current calendar interface.
2. Design a compact sticker thumbnail for calendar cells.
3. Design the sticker picker for eligible first writers.
4. Design the representative sticker in the day detail header.
5. Design the first-writer attribution label.
6. Support keyboard navigation and touch interaction.
7. Ensure stickers do not obstruct date numbers, note counts, or content.
8. Handle empty, loading, and error states.
9. Preserve the existing visual language.

Suggested components:

- `StickerPicker`
- `DailyStickerBadge`
- `CalendarDaySticker`
- `FirstWriterInfo`

Use temporary catalog interfaces or mock data while the asset and backend agents are working.

Do not implement competing backend logic.

### Agent C — Firebase & Business Logic Engineer

Ownership:

- Firestore model
- First-writer assignment
- Atomic operations
- Authorization
- Security rules

Feature requirements:

Every calendar day can have one representative sticker.

The first successfully committed note for that calendar day determines the first writer.

Only that first writer may initially select the representative sticker.

The selected sticker belongs to the calendar day, not just the individual note.

Suggested metadata:

- `firstWriterUserId`
- `firstNoteId`
- `representativeStickerId`
- `stickerAssignedAt`
- `stickerUpdatedAt`

Inspect the existing Firestore schema and adapt these fields appropriately.

Concurrency requirements:

1. Use Firestore transactions for first-note creation and first-writer assignment.
2. Ensure two users creating notes simultaneously cannot both become first writer.
3. Do not rely on client-side timestamps for determining transaction order.
4. Ensure first-writer metadata is assigned exactly once.
5. Validate sticker IDs against the approved catalog.
6. Prevent unauthorized updates through Firestore Security Rules.
7. Preserve metadata when later notes are added.
8. Ensure database writes remain economical under Firebase Spark limits.

For the MVP, when the first note is deleted, preserve the original first-writer attribution and representative sticker as historical day metadata.

If the first writer does not select a sticker immediately, leave the day in a pending sticker-selection state. Do not randomly assign a sticker unless the user approves that behavior.

An admin override is optional and should not be implemented without an existing administrator authorization model.

### Agent D — QA & Test Engineer

Ownership:

- Test planning
- Unit tests
- Firebase Emulator integration tests
- Multi-user concurrency tests
- Responsive checks

Work concurrently by developing tests against agreed interfaces and contracts.

Required scenarios:

1. User A creates the first note.
2. User A becomes the first writer.
3. User A selects a valid sticker.
4. User B creates a second note.
5. User B cannot replace the representative sticker.
6. Two users submit the first note simultaneously.
7. Exactly one first writer is persisted.
8. Deleting the original note preserves historical attribution.
9. An invalid sticker ID is rejected.
10. An unauthenticated user cannot access private diary data.
11. A non-member cannot modify day metadata.
12. Calendar and day detail show the same sticker.
13. Existing rich-text note formatting remains unchanged.
14. UI works on mobile and desktop.
15. Failed Firestore transactions do not produce misleading success states.

Use Firebase Emulator for tests that exercise security rules or database transactions.

Do not claim passing tests unless executed.

### Agent E — Independent Reviewer

Ownership:

- Architecture review
- Firestore security assessment
- Performance
- Maintainability
- Code quality

Start with an independent review of the proposed architecture and contracts.

After implementation, review the integrated changes.

Evaluate:

- Transaction correctness
- Membership authorization
- Rule bypass possibilities
- Invalid sticker IDs
- Data consistency
- Listener and query efficiency
- React rendering performance
- Accessibility
- Asset sizes
- Bundle impact
- Regression risks
- Firebase Spark compatibility

Report findings by severity:

- Critical
- High
- Medium
- Low

Provide actionable recommendations with file paths.

Do not modify files owned by other agents during parallel implementation.

## 4. PARALLEL EXECUTION STRATEGY

### Wave 1 — Parallel inspection

Launch Agents A, B, C, D, and E concurrently for independent inspection and planning.

The main agent must establish shared interfaces and business rules before implementation begins.

### Wave 2 — Parallel implementation

After contracts are agreed:

- Agent A extracts sticker assets.
- Agent B implements UI components.
- Agent C implements Firestore logic and security.
- Agent D builds tests and fixtures.
- Agent E reviews architecture and security assumptions.

Each agent must work in separate files or isolated worktrees.

Avoid simultaneous modifications to the same files.

If agent isolation is unavailable, use sequential file modifications while keeping independent research parallel.

### Wave 3 — Integration

The main agent:

1. Collects all sub-agent reports.
2. Validates exported interfaces.
3. Integrates sticker catalog with UI.
4. Connects UI to Firestore services.
5. Resolves merge conflicts.
6. Reviews Git diff.
7. Executes all available checks.

### Wave 4 — Independent verification

Agent D executes final tests.

Agent E performs final review.

The main agent resolves Critical and High findings and reruns affected tests.

Do not report completion while unresolved Critical or High defects remain.

## 5. PRODUCT UX REQUIREMENTS

The representative sticker must appear in two places.

**Monthly calendar:**

- Small sticker thumbnail within the corresponding day cell.
- Does not cover the date number or note preview.
- Uses responsive dimensions.
- Shows an appropriate loading placeholder if necessary.

**Day detail page:**

- Larger representative sticker.
- First writer's display name.
- First-writer attribution persists historically.
- Sticker picker available only to the eligible user.

The sticker set may also be used for restrained decorative elements such as empty states, but the representative-sticker feature has priority.

Do not redesign the entire application.

## 6. PERFORMANCE REQUIREMENTS

- Use optimized sticker dimensions.
- Avoid loading every full-resolution image in the calendar.
- Prefer static, locally hosted assets.
- Do not store sticker image binaries in Firestore.
- Store only sticker IDs in Firestore.
- Fetch only necessary daily metadata for the displayed month.
- Avoid unnecessary database listeners.
- Do not introduce paid infrastructure.

## 7. DELIVERABLES

Provide:

1. Extracted transparent PNG sticker assets.
2. Sticker contact sheet.
3. Sticker catalog with stable identifiers.
4. Updated calendar UI.
5. Sticker picker UI.
6. Updated Firestore data model.
7. Atomic first-writer assignment logic.
8. Updated Firebase Security Rules.
9. Automated tests.
10. Documentation explaining the feature.
11. Final engineering and review report.

The final report must include:

- Number of extracted stickers
- Modified and newly created files
- Business rules implemented
- Firestore schema changes
- Tests executed and results
- Concurrency verification
- Security review results
- Remaining risks or limitations
- Any uncompleted tasks

## 8. APPROVAL CHECKPOINTS

Before editing production functionality, complete:

- Repository inspection
- Reference image inspection
- Architecture proposal
- Asset feasibility assessment
- Shared interface contracts

Then proceed with implementation if the requirements are satisfied and no material blocker exists.

Do not deploy or enable paid services.

## START NOW

Inspect the existing Shared Diary repository and the provided sticker reference image.

Create a concise execution plan, launch available sub-agents for independent tasks, and coordinate their implementation using the strategy above.

Maximize parallel execution without compromising correctness, security, or existing project functionality.