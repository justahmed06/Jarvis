import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { PlanResponse } from '../../shared/types.js';
import { PlanResponseSchema } from '../../shared/schema.js';

export interface GeminiConfig {
  apiKey?: string;
  modelName?: string;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKeyOverride?: string;
  private modelName: string;

  constructor(config?: GeminiConfig) {
    this.apiKeyOverride = config?.apiKey;
    this.modelName =
      config?.modelName || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    this.initClient();
  }

  private initClient(): GoogleGenAI | null {
    if (!this.client) {
      const apiKey =
        this.apiKeyOverride !== undefined
          ? this.apiKeyOverride
          : process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim().length > 0) {
        this.client = new GoogleGenAI({ apiKey: apiKey.trim() });
      }
    }
    return this.client;
  }

  public isConfigured(): boolean {
    return this.initClient() !== null;
  }

  public getModelName(): string {
    return process.env.GEMINI_MODEL || this.modelName || 'gemini-3.8-flash';
  }

  /**
   * Health-check connectivity with Gemini API
   */
  public async testConnection(): Promise<{ ok: boolean; model: string; error?: string }> {
    const activeClient = this.initClient();
    const activeModel = this.getModelName();

    if (!activeClient) {
      return {
        ok: false,
        model: activeModel,
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your .env file.',
      };
    }

    try {
      const response = await activeClient.models.generateContent({
        model: activeModel,
        contents: ['Respond with the single word: "READY"'],
      });
      const text = response.text?.trim() || '';
      return {
        ok: true,
        model: activeModel,
      };
    } catch (err) {
      const message = this.extractErrorMessage(err);
      return {
        ok: false,
        model: activeModel,
        error: message,
      };
    }
  }

  /**
   * Helper to extract clean human-readable error messages from GenAI errors
   */
  private extractErrorMessage(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    try {
      // Check if raw is a JSON string with error details
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Not JSON, use raw
    }
    return raw;
  }

  /**
   * Interprets a user screenshot and goal, returning a strictly validated multi-step plan.
   * Includes automatic retry for transient 503/429 demand spikes.
   */
  public async generatePlan(params: {
    imageBase64: string;
    mimeType: string;
    goal: string;
  }): Promise<PlanResponse> {
    const activeClient = this.initClient();
    const candidateModels = [
      this.getModelName(),
      'gemini-3.5-flash',
      'gemini-2.5-flash',
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

    if (!activeClient) {
      throw new Error(
        'GEMINI_API_KEY is not configured on the server. Please configure it in your .env file.'
      );
    }

    // Clean base64 string if data URL prefix was included
    let cleanBase64 = params.imageBase64;
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1];
    }
    cleanBase64 = cleanBase64.trim();

    if (!cleanBase64) {
      throw new Error('Screenshot base64 image data is empty.');
    }

    const systemInstruction = `You are Jarvis, a reliable, grounded, supervised agentic workspace companion.
Your job is to analyze the user's provided screenshot, understand their stated goal, and create a bounded, safe multi-step plan of local actions to assist them.

ALLOWED TOOLS:
1. "create_local_task"
   - args: { "title": string (max 120 chars), "description"?: string (max 500 chars) }
   - Use this to track an actionable work item needed to resolve or advance the user's goal.
2. "append_work_note"
   - args: { "text": string (max 1000 chars), "category"?: "observation" | "action_item" | "debug" | "general" }
   - Use this to record crucial diagnostic details, context from the screenshot, code snippets, or error notes.
3. "mark_task_complete"
   - args: { "taskId": string }
   - Only use if referencing an already created task ID.

SAFETY & OPERATIONAL RULES:
- Never hallucinate non-existent tools. Only the 3 tools above are allowlisted. Any other tool will fail closed.
- Cap your plan at 1 to 4 steps maximum.
- Be grounded strictly in the visual evidence from the screenshot. Mention specific errors, UI elements, code lines, or text visible in the image.
- Return ONLY a valid JSON object matching the requested schema. No conversational preamble, no markdown backticks outside of JSON.`;

    const promptText = `User Goal: "${params.goal}"

Inspect the screenshot thoroughly. Ground your observations in the visible text, UI elements, errors, or file context.
Propose a realistic, bounded sequence of 1 to 3 approved local tool steps to assist the user with this goal (e.g. creating actionable tasks and logging key diagnostic work notes).

Return your response in this exact JSON format:
{
  "observation": "Detailed factual summary of what is seen in the screenshot relating to the goal",
  "goalInterpretation": "How you interpret the user's goal given what is displayed",
  "confidence": "high",
  "steps": [
    {
      "id": "step_1",
      "tool": "create_local_task",
      "args": {
        "title": "Clear concise task title",
        "description": "Optional context or guidance"
      },
      "rationale": "Why this specific step is necessary"
    },
    {
      "id": "step_2",
      "tool": "append_work_note",
      "args": {
        "text": "Specific error message, observation, or solution steps observed",
        "category": "debug"
      },
      "rationale": "Why this work note preserves context"
    }
  ]
}`;

    let lastError: Error | null = null;

    // Retry loop with model fallback for high demand spikes
    for (const modelToUse of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await activeClient.models.generateContent({
            model: modelToUse,
            contents: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: params.mimeType,
                },
              },
              promptText,
            ],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          const responseText = response.text?.trim();
          if (!responseText) {
            throw new Error('Gemini returned an empty response.');
          }

          // Clean possible markdown code fences if present
          let rawJson = responseText;
          if (rawJson.startsWith('```json')) {
            rawJson = rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (rawJson.startsWith('```')) {
            rawJson = rawJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          let parsed: unknown;
          try {
            parsed = JSON.parse(rawJson);
          } catch (parseErr) {
            throw new Error(
              `Failed to parse Gemini response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}\nRaw output: ${responseText.slice(0, 300)}`
            );
          }

          // Strict validation with Zod
          const validated = PlanResponseSchema.safeParse(parsed);
          if (!validated.success) {
            const issues = validated.error.issues
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join(', ');
            throw new Error(
              `Gemini proposed plan failed schema validation: ${issues}`
            );
          }

          return validated.data;
        } catch (err) {
          const cleanMsg = this.extractErrorMessage(err);
          lastError = new Error(cleanMsg);

          const isTransient =
            cleanMsg.includes('high demand') ||
            cleanMsg.includes('503') ||
            cleanMsg.includes('429') ||
            cleanMsg.includes('UNAVAILABLE') ||
            cleanMsg.includes('RESOURCE_EXHAUSTED');

          if (isTransient && attempt === 1) {
            console.warn(`[Gemini Retry] Model ${modelToUse} returned transient error. Retrying in 1.5s... (${cleanMsg})`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }

          // If transient and finished attempt 2, loop will try next candidate model
          if (isTransient) {
            console.warn(`[Gemini Model Fallback] Model ${modelToUse} unavailable. Trying next model...`);
            break;
          }

          // Non-transient error: stop and throw immediately
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Failed to generate plan after retries.');
  }
}

// Global Gemini service instance
export const geminiService = new GeminiService();
