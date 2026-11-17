# Jarvis — Demo and Hack Day Runbook
Version: 1.0 | Planning only

## Time plan (PKT, 18 Nov 2026)
- Before 9:00: arrival, check power/Wi-Fi, account sessions.
- 9:00–9:15: organizer briefing and clarify authorization to start coding, team rules, submission link and allowed tools.
- 9:15–10:15: wait for start authorization; perform only rule-permitted non-coding setup.
- 10:15–10:35: project scaffold and first real Gemini result (only if start authorized).
- 10:35–11:15: screenshot upload + contextual answer.
- 11:15–11:40: schema-validated task proposal + explicit approval/rejection.
- 11:40–12:00: testing, error handling, minimal polish.
- 12:00–12:15: repository documentation and **submit**.
- 12:30: organizer-announced hard submission cutoff; judging begins afterward.
Times are targets and must be revised if briefing changes the start.

## Two-minute demo script
1. Introduce the problem: a conventional chatbot doesn't know what you're looking at.
2. Upload an actual screenshot from the event (created during authorized build/demo period), ask a concrete question about a visible problem.
3. Show Jarvis identifying specific on-screen details and responding with useful, bounded guidance.
4. Ask it to suggest one follow-up task. Show the approval card; reject once to prove it does not act automatically, then approve an appropriate task.
5. Show the task on local checklist and state plainly what is *not* yet built (native computer control, persistent memory, always-on voice).

## Demo safety/fallback
- Use non-sensitive example screens; avoid personal email, financial or health data.
- Keep a second eligible screenshot captured/created during the official event as backup.
- Have manual text input ready if microphone/browser speech support fails.
- If API limits occur, present an honest failure message; never impersonate a live Gemini response with canned output.

## Submission checklist
- [ ] Official team/individual rules and start authorization confirmed.
- [ ] Repository created **after authorized coding start** if required by event rules, or planning-docs-only repo accepted.
- [ ] Google Gemini API is actually invoked and clearly credited.
- [ ] README lists setup, screenshot understanding, action permissions, model, limitations and AI coding tools.
- [ ] No API keys, tokens or `.env` committed.
- [ ] A real multimodal test and approval/reject test have passed.
- [ ] Working demo URL or reproducible instructions available as requested by judges.
- [ ] Submission portal entry complete by **12:15 target / 12:30 deadline**.

## Personal account-readiness checklist (user must confirm; not remotely verified)
- [ ] Antigravity installed on Windows, signed into intended Google account, can open agent workspace.
- [ ] Google AI Studio loads on that account and shows Gemini models.
- [ ] A Gemini API key exists for a selected project (do not share its value).
- [ ] AI Studio shows accessible image-capable model and available rate/quota limits; billing requirement understood.
- [ ] Git + Node.js installed and available in terminal; GitHub authenticated.
- [ ] Internet, charging cable and backup connectivity available.
- [ ] Confirm exact submission URL and account access with event organizers.

## References (checked 17 Nov 2026)
- https://events.mlh.com/events/15689-hack-day-szabist-university-karachi
- https://antigravity.google/docs/getting-started
- https://aistudio.google.com/docs/get-started
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
