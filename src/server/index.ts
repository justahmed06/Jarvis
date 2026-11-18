import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  PlanRequestSchema,
  ExecuteStepRequestSchema,
  ExecutePlanRequestSchema,
} from '../shared/schema.js';
import { geminiService } from './gemini/client.js';
import { sessionManager } from './tools/dispatcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

// Global Middleware
app.use(cors());
// Generous 50mb limit to handle high-resolution screenshot uploads comfortably
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure all API endpoints always have application/json headers
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    geminiConfigured: geminiService.isConfigured(),
    model: geminiService.getModelName(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Test connectivity with the Gemini API
 */
app.post('/api/test-gemini', async (req: Request, res: Response) => {
  try {
    const result = await geminiService.testConnection();
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: message });
  }
});

/**
 * Generate a bounded plan from screenshot and goal
 */
app.post('/api/plan', async (req: Request, res: Response) => {
  const parseResult = PlanRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid plan request format',
      details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  const { imageBase64, mimeType, goal } = parseResult.data;

  try {
    const plan = await geminiService.generatePlan({
      imageBase64,
      mimeType,
      goal,
    });
    res.status(200).json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API /api/plan Error]', message);
    res.status(500).json({
      error: 'Failed to generate plan from Gemini',
      message,
    });
  }
});

/**
 * Execute a single approved plan step
 */
app.post('/api/execute-step', (req: Request, res: Response) => {
  const parseResult = ExecuteStepRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid step execution request',
      details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  const result = sessionManager.executeStep(parseResult.data.step);
  res.status(200).json({
    result,
    state: sessionManager.getState(),
  });
});

/**
 * Execute an entire approved multi-step plan
 */
app.post('/api/execute-plan', (req: Request, res: Response) => {
  const parseResult = ExecutePlanRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid plan execution request',
      details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  const planExecution = sessionManager.executePlan(parseResult.data.steps);
  res.status(200).json(planExecution);
});

/**
 * Explicit user rejection of a proposed plan
 */
app.post('/api/reject-plan', (req: Request, res: Response) => {
  const { steps, reason } = req.body;
  if (!Array.isArray(steps)) {
    res.status(400).json({ error: 'Expected steps array in body' });
    return;
  }

  sessionManager.recordRejection(steps, reason || 'User rejected proposed plan');
  res.status(200).json({
    status: 'rejected',
    state: sessionManager.getState(),
  });
});

/**
 * Get current session state (tasks, notes, ledger)
 */
app.get('/api/session', (req: Request, res: Response) => {
  res.status(200).json(sessionManager.getState());
});

/**
 * Reset session state
 */
app.post('/api/session/reset', (req: Request, res: Response) => {
  sessionManager.reset();
  res.status(200).json({
    status: 'reset',
    state: sessionManager.getState(),
  });
});

// Any unmatched /api route must return JSON 404, never index.html!
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route ${req.method} ${req.path} not found`,
  });
});

// Global JSON error handler middleware (catches syntax errors in request bodies, etc.)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Express Error Handler]', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.name || 'ServerError',
      message: err.message || 'An unexpected server error occurred.',
    });
  }
});

// Serve frontend static build
const candidatePaths = [
  path.resolve(process.cwd(), 'dist/client'),
  path.resolve(__dirname, '../../dist/client'),
  path.resolve(__dirname, '../client'),
];
const clientDistPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];

app.use(express.static(clientDistPath));
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Jarvis UI not built yet. Run "npm run build".');
    }
  });
});

// Start server only when run directly (not during unit testing)
let serverInstance: any = null;
if (process.env.NODE_ENV !== 'test') {
  serverInstance = app.listen(PORT, HOST, () => {
    console.log(`[Jarvis Server] Listening on http://localhost:${PORT}`);
    console.log(`[Jarvis Server] Gemini API Key status: ${geminiService.isConfigured() ? 'Configured' : 'NOT Configured'}`);
    console.log(`[Jarvis Server] Active model: ${geminiService.getModelName()}`);
  });
}

export { serverInstance };
export default app;
