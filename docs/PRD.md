# Jarvis — Hack Day PRD
Version: 1.0 | Planning only | 17 November 2026

## Event and compliance
MLH Hack Day, SZABIST Karachi, 18 November 2026. Arrive before 9:00 AM for organizer briefing/questions (9:00–9:15). Official organizer-announced submission cutoff: **12:30 PM PKT**; internal target **12:15 PM**. Public schedule previously listed hacking starting at 10:15 AM; **confirm implementation start at briefing**. Do not begin coding or project-specific design/assets before authorization. Organizers explicitly permitted planning documents; cite AI tools and any reused public libraries in submission.

## Product proposition
Jarvis is a **Gemini-powered workspace companion** that understands what a user is looking at and helps convert observations into useful, permission-based next steps.

## Who / problem
For a student or developer, switching among screens, tasks and explanations disrupts work. A chat-only assistant lacks visual workspace context and action follow-through.

## Hackathon outcome
Deliver one genuine, understandable multimodal interaction: user supplies a screenshot, asks a question, receives Gemini-grounded guidance and optionally approves a safe local follow-up action.

## Primary user journey
1. User opens a browser-based Jarvis prototype and sees clear privacy/consent controls.
2. User uploads a screenshot and asks a question in natural language.
3. Server passes image + question to Gemini and returns a useful explanation tied to observable evidence.
4. Gemini can suggest a structured local task (title, optional description); app validates before displaying.
5. User explicitly approves; app adds the task to a local session checklist. No privileged computer operation.
6. User can clear the image and conversation.

## Success criteria
- Working Gemini response about a real user-provided screenshot, not a mocked output.
- Honest uncertainty if the image is unreadable, ambiguous or out of scope.
- At least one structured, schema-validated action proposal requiring explicit approval.
- User can reject a proposal without side effects.
- No API key shipped to the browser, logs, README or repository.
- Stable 2-minute demonstration, with a fallback screenshot if screen sharing is unstable.

## Boundaries
No autonomous desktop control, background always-listening microphone, real-time screen streaming, Gmail access, persistent cross-session memory, codebase ingestion or full Electron packaging in the hackathon MVP. Voice input/output is stretch-only.

## Relationship to long-term Jarvis
This is a disposable/portable vertical slice, **not** the final desktop platform. Production vision remains a Windows-first Electron + TypeScript intelligent companion with voice, screen and project awareness, proactive support, permissions and eventual Android integration. Architecture/design choices here must not misrepresent hackathon features as implemented production capabilities.
