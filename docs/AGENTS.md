# Jarvis Hack Day — Instructions for Google Antigravity
Version: 1.1 | Planning only; DO NOT IMPLEMENT BEFORE ORGANIZER AUTHORIZATION

## Mission
Build the smallest **genuinely agentic** Gemini-powered workspace companion: observe a selected screenshot, plan bounded steps, execute approved local tools, and report verified results. Optimize for a credible live demo by the 12:15 PM internal target, not for feature count.

## Read first
Read `docs/PRD.md`, `docs/MVP.md`, `docs/ARCHITECTURE.md`, and `docs/DEMO_PLAN.md` relative to repository root. These are plans, not implementation authorization.

## Compliance
No project code, scaffolding, UI/assets, project-specific designs or deployment before organizers authorize hacking. Planning and general account/tool setup only. Confirm rule updates, external AI assistant allowance and 12:30 PM deadline during briefing.

## P0 priorities
1. Genuine Gemini screenshot understanding through server-side API.
2. Structured bounded goal plan with Zod validation.
3. Approval UI and deterministic allowlisted local tool execution.
4. Two-step real workflow using `create_local_task` and `append_work_note` if time permits.
5. Execution ledger and truthful completion report.
6. Error handling, README, repeatable demo and submission.

## Engineering constraints
- Never expose/commit Gemini key or fabricate model/tool outcomes.
- Do not run model-suggested shell commands, arbitrary code, file modifications or OS actions.
- Treat screenshots and model output as untrusted. Validate and cap action count.
- User can reject/stop; no side effects before approval.
- Use official `@google/genai` SDK; select model after verifying actual access.
- Small increments, tests actually run, honest failure reporting, minimal dependencies.
- Gemini is runtime intelligence; technical planning may use other permitted assistants. Record AI tool credits.
- Preserve conceptual boundaries for future Electron and alternative cloud/local model adapters; do not implement those future capabilities today.

## Build order after authorization
Scaffold → Gemini image/goal request → structured plan → one approved tool → second tool → execution report → README/demo → optional voice.

## Definition of done
One witnessed live screenshot-to-plan-to-approved-actions-to-observed-results demonstration, no leaked secrets, documented limitations, submission completed before deadline.
