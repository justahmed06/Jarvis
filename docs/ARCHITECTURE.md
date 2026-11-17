# Jarvis — Hack Day Architecture
Version: 1.1 | Planning proposal; not yet built

## Stack
React + TypeScript browser prototype; small server endpoint for Gemini via official `@google/genai` SDK; Zod for inputs, plans and tool arguments; Git/GitHub. Choose a currently available multimodal Gemini model after account/quota verification. Google Antigravity is the implementation IDE. Do not scaffold before authorization.

## Agentic vertical slice
User selects screenshot and states goal
→ server validates image and goal
→ Gemini interprets visual evidence and proposes a bounded plan
→ server validates structured plan and allowlisted tool calls
→ UI shows plan and asks permission
→ deterministic local dispatcher executes approved in-app tools
→ tool results become an execution ledger
→ UI reports observed outcome; optional next Gemini reasoning step only if time permits.

## Bounded tools (proposal)
- `create_local_task(title, description?)`: append a task to current session; return generated task ID.
- `append_work_note(text)`: append a session work note; return generated note ID.
- Optional `mark_task_complete(task_id)`: update only an existing task ID.

All handlers are deterministic application code, not arbitrary model-executed JavaScript. Cap plan steps, validate argument lengths and enforce unique action execution. Unknown tools and malformed arguments fail closed. Show pending, succeeded and failed status.

## Consent, privacy and security
User-selected screenshots only; no silent capture. No automatic external actions. Explicit user approval before executing a plan, and clear ability to reject/stop remaining steps. Do not send credentials, private screenshots or secrets to Gemini. Treat screenshot text as untrusted prompt-injection surface. Limit file MIME/size, errors and rate usage. API key only in server environment, ignored by Git; avoid screenshot persistence by default.

## Design for reuse
Keep UI, model adapter, planning schema, tool registry and execution ledger logically separate without overengineering. Later desktop packaging can reuse React and domain contracts, but server-hosted Gemini access must move behind a secure Electron main-process/backend boundary with permissioned IPC. Model adapter is Gemini-first, with future optional cloud/local fallback providers; do not build a provider marketplace during the event.

## Gates
1. Organizer authorizes coding.
2. Confirm Gemini model/API key and submission details.
3. Build one real multimodal call.
4. Build validated plan and one safe tool.
5. Add second tool, actual result reporting and demo.
6. Only then consider voice or additional agent iterations.
