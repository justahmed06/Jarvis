# Jarvis — Hack Day Architecture
Version: 1.0 | Design proposal; not yet built

## Proposed stack
- Rapid browser prototype: React + TypeScript using a minimal framework/scaffold selected during the hackathon.
- Server endpoint for Gemini calls (framework-native server route or minimal Node service). Do not access Gemini directly from a client exposing a secret.
- Official Google GenAI JavaScript SDK; choose an image-capable, currently accessible Gemini model after account/quota checks. **Do not hardcode an unverified model identifier.**
- Zod for typed request and proposed-action validation; Git/GitHub for source and submission.
- Google Antigravity for development; Google AI Studio for model selection and API/account checks; Stitch optional **during** authorized hacking only.

## Data flow
User chooses screenshot + types question -> browser sends bounded image and message to app server -> server validates MIME/size and request -> Gemini multimodal reasoning -> server validates any proposed local action -> browser displays answer and confirmation card -> on approval only, update in-session checklist.

## Safety and privacy
- Only user-selected screenshots; clear indication of what was shared.
- No silent surveillance or background capture.
- Minimize or avoid storage: prefer in-memory session state; do not persist screenshot by default.
- No command execution, write access outside session checklist, external transactions or account permissions.
- Treat screenshot contents and Gemini responses as untrusted data; ignore instructions embedded in screenshot requesting credential disclosure or tool execution.
- Restrict request sizes; handle failures, malformed output and rate limits gracefully.
- API secret stays in server environment variables, `.env` is ignored by Git, and no credentials appear in logs.
- Only safe, allowlisted action is `create_local_task`; proposals cannot execute without clear user confirmation.

## Design for later reuse
Keep UI presentation, multimodal conversation logic and proposed-action contracts conceptually separable. Future Electron desktop software will introduce secure, permissioned IPC and Windows-specific capabilities; this web prototype does **not** claim them. Avoid premature native abstractions.

## Decision gates tomorrow
1. Organizer permits implementation start.
2. AI Studio API key/model access verified.
3. Scaffold selected for easiest server-side secret handling.
4. One multimodal call works before adding action cards or speech.
