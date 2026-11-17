# Jarvis — Demo and Hack Day Runbook
Version: 1.1 | Planning only

## Timing (PKT, 18 Nov 2026)
- Before 9:00: arrive, power/Wi-Fi/account readiness.
- 9:00–9:15: confirm start authorization, submission portal, team rules, external AI assistants, Google requirements and 12:30 cutoff.
- Before authorized start: no implementation.
- 10:15–10:35: scaffold and first real Gemini multimodal call, if authorized.
- 10:35–11:05: screenshot interpretation and structured plan.
- 11:05–11:40: approved local tool dispatcher, two-step workflow, result ledger.
- 11:40–12:00: failure tests, polish only if safe.
- 12:00–12:15: README, demo rehearsal, submit.
- 12:30: hard organizer-announced cutoff; adjust schedule if start changes.

## Two-minute demo
1. "Jarvis doesn't just explain your screen; it helps follow through on a goal."
2. Upload a non-sensitive event-eligible screenshot showing a coding problem or study task. Ask: "Understand this and organize what I need to do next."
3. Show Gemini's screenshot-grounded observation and short two-step plan.
4. Inspect the action plan; approve. Jarvis creates an actual local task and appends a work note using separate allowlisted tools.
5. Show both resulting records and execution ledger. Optionally demonstrate rejection of a new plan.
6. Explain honestly: this is supervised in-app autonomy, not desktop control; Electron, native tools, voice, memory and additional model providers are roadmap.

## Safety and fallback
- No private email, health, finance, credentials or sensitive screenshots.
- Have a second eligible screenshot captured during the event.
- If the second tool is blocked, demo one real validated tool with accurate status, not simulated success.
- If Gemini fails, show a genuine error, not canned output disguised as a live response.

## Submission checklist
- [ ] Start authorization, team rules and external advisor policy confirmed.
- [ ] Gemini invoked with real image and goal; actual model documented.
- [ ] At least one approved tool executed and result verified; aim for two.
- [ ] User rejection/stop works without unapproved effects.
- [ ] README includes Google usage, AI tool credits, setup and limitations.
- [ ] No API keys or `.env` committed.
- [ ] Demo and submission completed by 12:15 target / 12:30 deadline.
- [ ] Submission URL and access verified.

## Readiness checks (user-confirmed where applicable)
- [ ] Antigravity App/IDE ready and project folder opened.
- [ ] Gemini API key and image-capable model/quota verified without sharing key.
- [ ] Node/npm, Git and GitHub authentication working.
- [ ] Charging cable, internet backup and submission account ready.

## References
- https://events.mlh.com/events/15689-hack-day-szabist-university-karachi
- https://antigravity.google/docs/getting-started
- https://aistudio.google.com/docs/get-started
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/structured-output
