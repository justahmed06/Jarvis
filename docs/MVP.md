# Jarvis — MVP Scope & Acceptance
Version: 1.0 | Planning only | No source code

## P0: must ship
- Browser UI with screenshot upload, question input, conversation response and local checklist.
- Real Gemini API connection via **server-side** request, with secret in environment variable (not client bundle).
- Image + text prompt reaches Gemini; response explains screenshot and answers the question.
- One bounded structured action type: `create_local_task`, with concise title and optional description. Validate data with Zod (or equivalent) on server; explicit approve/reject in UI.
- Error states for missing API key, unsupported/corrupt image, model failure, limits and invalid action proposals.
- README with setup, model used, Google integration, AI-tool credits, limitations and demo steps.

## P1: only after P0 works
- Speech-to-text input using a browser-supported capability, with manual text fallback.
- Optional text-to-speech response.
- More polished layout, provided it does not jeopardize submission.

## Explicitly excluded
- Continuous microphone streaming or wake word.
- Automatic screenshot scraping or privileged OS automation.
- Reading local project files without selection and consent.
- Executing AI-proposed shell commands, modifying files or sending messages.
- Third-party paid API dependencies.

## Acceptance checks
1. App loads and user can submit a question plus supported screenshot.
2. Gemini returns an answer demonstrably relevant to image details.
3. User can ask a follow-up while current screenshot remains selected.
4. Suggested task conforms to schema and is displayed as a proposal, never auto-executed.
5. Approve adds task to checklist once; reject changes nothing.
6. Invalid output and API failures produce understandable error, not a crash or unapproved action.
7. API key never appears in browser network payloads or Git history.
8. Fresh-start demo succeeds without local developer-only prerequisites beyond documented setup.

## Build / triage policy
If blocked, simplify in this order: remove speech; remove persistence; remove UI decoration; then simplify proposal generation. **Never sacrifice genuine Gemini screenshot understanding, security of credentials, or manual approval.**
