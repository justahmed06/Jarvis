import { describe, it, expect } from 'vitest';
import { Request, Response } from 'express';
import { PlanRequestSchema, ExecuteStepRequestSchema } from '../shared/schema.js';
import { SessionManager } from '../server/tools/dispatcher.js';

describe('API Route Logic & Schema Boundaries (Socket-free Unit Tests)', () => {
  it('should validate plan request schemas strictly', () => {
    // Missing imageBase64
    const invalidReq = PlanRequestSchema.safeParse({
      goal: 'Fix my bug',
    });
    expect(invalidReq.success).toBe(false);

    // Unsupported mime type
    const badMime = PlanRequestSchema.safeParse({
      imageBase64: 'dGVzdA==',
      mimeType: 'application/pdf',
      goal: 'Analyze this',
    });
    expect(badMime.success).toBe(false);

    // Valid request
    const valid = PlanRequestSchema.safeParse({
      imageBase64: 'dGVzdA==',
      mimeType: 'image/png',
      goal: 'Understand the error in this screenshot',
    });
    expect(valid.success).toBe(true);
  });

  it('should validate execute-step requests and execute allowlisted tools', () => {
    const session = new SessionManager();

    // Valid create_local_task
    const validStep = ExecuteStepRequestSchema.safeParse({
      step: {
        id: 'step_1',
        tool: 'create_local_task',
        args: { title: 'Fix auth bug', description: 'Review line 40' },
        rationale: 'Needed for login',
      },
    });
    expect(validStep.success).toBe(true);

    if (validStep.success) {
      const execResult = session.executeStep(validStep.data.step);
      expect(execResult.success).toBe(true);
      expect(execResult.output?.taskId).toBe('task_1');
      expect(session.getState().tasks.length).toBe(1);
    }
  });

  it('should fail closed when attempting unallowlisted tools', () => {
    const session = new SessionManager();

    const badStep = ExecuteStepRequestSchema.safeParse({
      step: {
        id: 'bad_step',
        tool: 'run_powershell_script',
        args: { script: 'Get-Process' },
        rationale: 'Unauthorized shell action',
      },
    });
    // Schema rejects unallowed tool
    expect(badStep.success).toBe(false);
  });

  it('should properly record rejection with zero side effects', () => {
    const session = new SessionManager();
    const rejectedSteps = [
      {
        id: 'step_rejected',
        tool: 'create_local_task' as const,
        args: { title: 'Discarded task' },
        rationale: 'Not approved',
      },
    ];

    session.recordRejection(rejectedSteps, 'User rejected in UI');
    const state = session.getState();
    expect(state.tasks.length).toBe(0);
    expect(state.notes.length).toBe(0);
    expect(state.ledger.length).toBe(1);
    expect(state.ledger[0].status).toBe('rejected');
    expect(state.ledger[0].error).toBe('User rejected in UI');
  });
});
