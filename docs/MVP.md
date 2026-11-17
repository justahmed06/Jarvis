# Jarvis — MVP Scope & Acceptance
Version: 1.1 | Planning only | No source code

## P0: must ship before 12:15 PM target
- Browser React/TypeScript UI: screenshot upload, goal input, plan/actions view and result history.
- Real Gemini multimodal call through a server endpoint with secret environment variable.
- Gemini returns evidence-grounded interpretation and a **bounded structured action plan**.
- Strict schema validation of tool names, arguments, maximum steps and model output. Unknown tools fail closed.
- Safe in-app tool dispatcher, ideally with two distinct actions: `create_local_task` and `append_work_note`. Actions must produce observable local state and return actual success/failure.
- Explicit approval before executing a proposed workflow; reject/stop leaves unexecuted steps untouched. No arbitrary OS/file/network actions.
- After execution, show completed steps, failures and remaining steps. A verified two-action sequence is the **agentic demo target**.
- Basic errors: unsupported image, missing API key, quota/model failure, invalid plan, failed tool.
- README, setup, limitations, Google integration and AI-tool credits; no committed secrets.

## P1: only after P0 works
- Model uses observed tool results to propose a next safe step (additional approval required).
- Voice input/output with text fallback.
- Optional `mark_task_complete` tool, session persistence or polished UI.

## Excluded
- Wake word/continuous microphone; unsanctioned screen scraping; direct Windows control; shell execution; reading or writing arbitrary local files; emails, purchases or external transactions; persistent autonomous background jobs.
- Non-Google runtime models during hackathon unless explicitly allowed and justified; multi-provider support is a later roadmap item.

## Acceptance checks
1. App sends real image and goal to Gemini and shows grounded observations.
2. Gemini proposes a structured multi-step workflow within allowlist and step cap.
3. User can inspect and approve or reject; rejection has no side effects.
4. Approved tools update local state; actual results are visible and never fabricated.
5. Invalid/unknown actions, tool errors and Gemini failures fail safely.
6. No secret reaches client bundle, network response or Git history.
7. Repeatable two-minute demo and accurate README.

## Time-pressure triage
First remove voice, persistence, decoration and optional third tool. If necessary, simplify to one **real** local tool with visible result rather than fake multiple tools. Never compromise real Gemini integration, secret safety, approval, or a truthful demo.
