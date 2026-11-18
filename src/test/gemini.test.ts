import { describe, it, expect } from 'vitest';
import { GeminiService } from '../server/gemini/client.js';
import { PlanResponseSchema } from '../shared/schema.js';

describe('Gemini Service & Integration Logic', () => {
  it('should detect when GEMINI_API_KEY is not configured', () => {
    const service = new GeminiService({ apiKey: '' });
    expect(service.isConfigured()).toBe(false);
  });

  it('should throw an informative error when generating plan without key', async () => {
    const service = new GeminiService({ apiKey: '' });
    await expect(
      service.generatePlan({
        imageBase64: 'abc',
        mimeType: 'image/png',
        goal: 'test goal',
      })
    ).rejects.toThrow('GEMINI_API_KEY is not configured');
  });

  it('should validate structured model output strictly', () => {
    const validModelOutput = {
      observation: 'The VS Code window displays TypeScript error TS2345 in updateUserAge',
      goalInterpretation: 'The user wants to resolve the type mismatch error',
      confidence: 'high',
      steps: [
        {
          id: 'step_1',
          tool: 'create_local_task',
          args: {
            title: 'Convert rawInput string to number using parseInt(rawInput, 10)',
            description: 'Fixes TS2345 in api/userService.ts',
          },
          rationale: 'Directly addresses the compiler type error shown',
        },
        {
          id: 'step_2',
          tool: 'append_work_note',
          args: {
            text: 'TS2345: Argument of type string is not assignable to parameter of type number on line 5',
            category: 'debug',
          },
          rationale: 'Records the compiler error code for audit ledger',
        },
      ],
    };

    const parsed = PlanResponseSchema.safeParse(validModelOutput);
    expect(parsed.success).toBe(true);
  });

  it('should reject model output that suggests hallucinated or unsafe tools', () => {
    const hallucinatedOutput = {
      observation: 'Terminal error',
      goalInterpretation: 'Execute shell script',
      steps: [
        {
          id: 'step_1',
          tool: 'run_bash_command', // NOT ALLOWLISTED
          args: { cmd: 'sudo rm -rf /' },
          rationale: 'Delete root',
        },
      ],
    };

    const parsed = PlanResponseSchema.safeParse(hallucinatedOutput);
    expect(parsed.success).toBe(false);
  });
});
