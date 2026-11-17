# Jarvis — Hack Day PRD
Version: 1.1 | Planning only | 17 November 2026

## Event and compliance
MLH Hack Day, SZABIST Karachi, 18 November 2026. Arrive before 9:00 AM for briefing/questions. Organizer-announced submission cutoff: **12:30 PM PKT**; internal target **12:15 PM**. Confirm coding start and rules at briefing. No source code, scaffolding, custom UI/assets or implementation before authorization. Planning documents are permitted according to organizer guidance; disclose AI tools and public libraries. Confirm whether external AI assistants may act as technical advisors.

## Product proposition
Jarvis is a **Gemini-powered, supervised agentic workspace companion** that understands visible context, turns natural-language goals into a short plan, invokes bounded tools, observes their results, and explains completed work. It is not merely screenshot chat.

## Target user and problem
Students and developers lose momentum switching between errors, notes and tasks. Existing chat tools may explain a screenshot but do not reliably follow through on a multi-step goal.

## Hackathon outcome
Demonstrate one authentic multimodal, multi-step **observe → plan → act → verify → report** loop, powered by a real Gemini API call. Build a browser-based vertical slice of the eventual Windows desktop companion, not a throwaway parallel product.

## Primary journey
1. User voluntarily uploads a non-sensitive screenshot and describes a goal, such as organizing the next steps to resolve a visible error.
2. Gemini identifies visible evidence and produces a bounded structured plan with tool proposals.
3. Server validates tool names, arguments and step limits. UI displays the plan and required approval.
4. On approval, a deterministic local tool dispatcher performs safe in-app actions (e.g. create a task and append a work note); it never executes arbitrary model text.
5. Jarvis reads actual tool results, reports successes/failures and remaining work, and can suggest the next safe step. No claim that it repaired code or controlled Windows.
6. User can reject, stop or clear the session.

## Success criteria
- Real image-grounded Gemini reasoning and a relevant goal-oriented plan.
- At least one end-to-end **two-step tool workflow** demonstrated with actual results, not mocked success.
- Two allowlisted local tool capabilities if time permits: `create_local_task` and `append_work_note`; optional `mark_task_complete` only after core workflow passes.
- Visible plan, approval, execution status and result summary.
- Strict validation, bounded steps, safe rejection, API secret server-side, reliable two-minute demo.

## Safety boundaries
No arbitrary shell commands, filesystem modifications, hidden screen capture, silent surveillance, external account actions, privileged OS automation or background microphone. Explicit consent for sensitive actions. If an action fails, report failure; do not invent outcomes. Voice is stretch-only.

## Long-term product
Keep the same repository and evolve through releases toward Windows-first Electron + React + TypeScript, secure native IPC, voice, live screen awareness, persistent memory, developer tools and Android integration. Gemini is the initial runtime provider, **not a permanent provider lock-in**: future adapters may support other cloud APIs and lightweight local fallback models. Prototype interfaces may require refactoring; avoid promising unchanged code.
