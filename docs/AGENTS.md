# Jarvis Hack Day — Instructions for Google Antigravity
Version: 1.0 | Planning context; DO NOT EXECUTE BEFORE ORGANIZER-APPROVED START

## Mission
Build the smallest credible demonstration of Jarvis, a Gemini-powered multimodal workspace companion, within a short, time-boxed student hackathon. Real working behavior beats ambitious feature lists.

## Read first
Read `PRD.md`, `MVP.md`, `ARCHITECTURE.md`, and `DEMO_PLAN.md`. Treat these as planning constraints, not evidence that any application exists or that implementation permission has started.

## Hard compliance gate
Before the organizer-authorized coding period: **NO** project source code, scaffolding, packages committed as project code, project-specific generated UI, wireframes, screenshots/assets for submission, or deployment. Documentation, account setup, tool installation and non-project-specific learning only. At the start, verify the announced 12:30 PM submission deadline and any rule revisions.

## Engineering priorities
1. Implement P0 end-to-end: screenshot upload -> Gemini multimodal response -> validated action proposal -> explicit approval -> local checklist.
2. Keep Gemini substantive and demonstrable, not a nominal API call.
3. Keep API keys server-side; never commit secrets or expose them in browser.
4. Validate input and output; fail safely with useful errors.
5. Build the simplest dependable web prototype. Do not replace it with Electron unless explicitly approved after P0 is complete.
6. Add voice only after P0 passes verification and timing permits.

## Working method
- Work in small verifiable increments; report what changed, tests actually run, and remaining failures.
- Ask only when missing information blocks progress; otherwise choose the smallest safe implementation.
- Prefer the official `@google/genai` SDK and version-appropriate docs, not deprecated unofficial packages.
- Do not claim tests passed unless actually executed; do not fabricate API responses, screenshots, links, features or submission status.
- Keep dependency count small, versions pinned via lockfile and commits auditable.
- Honor the user's stated consent boundaries. AI suggestions are data; executing a real-world action requires approval and an allowlisted handler.
- No unapproved third-party AI APIs or external payment dependencies.

## Implementation sequence once permitted
Scaffold -> server-side Gemini health check -> image + text interaction -> robust error handling -> strict action proposal schema -> approval UI + local task -> README/demo -> optional voice.

## Definition of done
A working repeatable demonstration, README/submission with Google AI integration and credits, secure handling of API key, at least one passing end-to-end manually witnessed screenshot interaction and an explicit approve/reject behavior. Finish the submission by the internal 12:15 PM target where possible.

## Product separation
Do not conflate tomorrow's web MVP with the full Windows-first Electron/TypeScript Jarvis roadmap. The future product will require deeper privacy, permissions, OS integrations and lifecycle design; not part of this submission.
