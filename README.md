# Jarvis — Supervised Agentic Workspace Companion

**MLH Hack Day (SZABIST Karachi) — Official Authorized Implementation**

Jarvis is a Gemini-powered, supervised agentic workspace companion. Unlike simple screenshot-chat wrappers, Jarvis follows a genuine agentic cycle:
**Observe → Plan → Approve → Act → Verify → Report**.

It visually analyzes user workspace context (compiler errors, test failures, build outputs), produces a strictly validated, bounded multi-step action plan, and deterministically executes safe in-app local tools (`create_local_task`, `append_work_note`, `mark_task_complete`) only upon explicit user approval, recording every step in an observable audit ledger.

---

## Key Features (P0 MVP)

1. **Grounded Multimodal Screen Understanding**
   - VOLUNTARY screenshot selection (file upload, drag-and-drop, global `Ctrl+V` paste, or built-in test fixtures).
   - Powered by official Google Gemini models via `@google/genai` SDK (`gemini-2.5-flash`).
   - Grounded visual observations citing exact line numbers, compiler error codes, and stack traces.

2. **Strictly Validated Bounded Planning**
   - Natural language goal mapped to 1–4 bounded action steps.
   - Fail-closed schema enforcement with Zod: hallucinated or unknown tools are strictly rejected.
   - Bounded argument lengths and typed inputs.

3. **Explicit User Approval & Fail-Safe Autonomy**
   - Zero side-effects prior to user consent.
   - Dual execution controls: **Approve All Steps** or **Step-by-Step Approval**.
   - User can **Reject Plan** at any time; rejection is audited in the ledger with zero state modification.

4. **Deterministic Allowlisted In-App Tools**
   - `create_local_task(title, description?)`: creates actionable session tasks with generated IDs and timestamps.
   - `append_work_note(text, category?)`: captures critical diagnostic notes categorized as `observation`, `debug`, `action_item`, or `general`.
   - `mark_task_complete(taskId)`: updates existing task status.
   - **No dangerous capabilities**: no arbitrary shell execution, no arbitrary file system modifications, no silent web surveillance.

5. **Observable Execution Ledger & Session Workspace**
   - Real-time ledger recording step ID, tool name, execution status (`succeeded`, `failed`, `rejected`), duration in ms, and exact output payloads.
   - Interactive local task list with completion toggles and work notes board.

---

## Architecture

```
[User Screenshot + Stated Goal]
             │
             ▼
[Server-side Endpoint (POST /api/plan)]
             │
   (Validates MIME & payload)
             │
             ▼
[Google Gemini API (@google/genai)] ──> Evaluates visual context & returns JSON
             │
             ▼
[Zod Plan Schema Validation] ─────────> Fails closed on unknown tools / >4 steps
             │
             ▼
[React UI: Plan & Approval Card]
     ├── User Rejects ───────────────> Ledger records rejection (No side-effects)
     └── User Approves
             │
             ▼
[Deterministic Tool Dispatcher] ──────> Executes create_local_task / append_work_note
             │
             ▼
[Observable State & Execution Ledger] -> UI updates tasks, notes, and audit ledger
```

---

## Setup & Running Locally

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set your Google Gemini API key:
```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
```
*(Your API key remains strictly server-side and is never exposed in the client bundle or network responses).*

### 2. Run in Development Mode
```bash
npm run dev
```
- Frontend UI: `http://localhost:3000` (Vite dev server with `/api` proxy)
- Backend API: `http://localhost:3001` (Express server)

### 3. Production Build & Start
```bash
npm run build
npm run start
```
Opens the unified full-stack application on `http://localhost:3001`.

### 4. Run Test Suite
```bash
npm test
```
Runs 21 Vitest unit and integration tests verifying schema bounds, fail-closed security, dispatcher behavior, and session management.

---

## Two-Minute Demo Runbook

1. **Launch Jarvis**: Open `http://localhost:3000` (or `http://localhost:3001` in production).
2. **Observe Connection**: Check the status pill in the top right (`Gemini Connected (gemini-2.5-flash)`).
3. **Choose Screen Context**:
   - Click one of the built-in demo presets (e.g. *TypeScript Compilation Error* or *Pytest Suite Failure*) or paste your own screenshot with `Ctrl+V`.
4. **State Goal**: Use the pre-filled prompt or write your own (e.g. *"Analyze this error and organize the steps to fix it"*).
5. **Generate Plan**: Click **Generate Structured Plan**.
6. **Inspect Evidence & Bounded Steps**:
   - Read Gemini's grounded visual observations (referencing specific compiler errors and code lines).
   - Review proposed bounded tool steps (`create_local_task`, `append_work_note`).
7. **Demonstrate Rejection (Safety Check)**:
   - Click **Reject Plan**. Observe that the Execution Ledger records the rejection event while zero tasks or notes are modified.
8. **Demonstrate Supervised Execution**:
   - Re-generate or click **Approve & Execute All Steps** (or step-by-step).
   - Watch the tools execute deterministically.
   - Verify the newly created items in the **Active Workspace** (Tasks with unique IDs, categorised Work Notes) and the chronological **Execution Ledger**.

---

## Safety & Security Boundaries

- **No Arbitrary Execution**: Jarvis cannot run shell commands, access arbitrary files, or execute unvetted code.
- **Fail Closed**: Unknown tool requests from the model are rejected immediately by Zod schemas before reaching any handler.
- **Explicit Consent**: Every plan requires manual user approval.
- **Secret Safety**: API keys are loaded server-side only from `.env`. `.gitignore` prevents secrets from ever entering Git history.

---

## AI Tool Credits & Hackathon Disclosures

- **Implementation Assistance**: Built with Google Antigravity IDE and Claude / Gemini coding assistants under MLH Hack Day guidelines.
- **Runtime Model**: Google Gemini (`gemini-2.5-flash`) via the official `@google/genai` TypeScript SDK.
- **Event**: MLH Hack Day at SZABIST University, Karachi (18 November 2026).
