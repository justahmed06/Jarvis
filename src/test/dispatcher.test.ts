import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../server/tools/dispatcher.js';
import { PlanStep } from '../shared/types.js';
import {
  validateToolArgs,
  PlanResponseSchema,
  CreateLocalTaskArgsSchema,
  AppendWorkNoteArgsSchema,
} from '../shared/schema.js';

describe('Tool Validation (Fail-Closed Safety)', () => {
  it('should accept valid create_local_task args', () => {
    const res = validateToolArgs('create_local_task', {
      title: 'Fix null pointer exception in login',
      description: 'Check auth middleware on line 42',
    });
    expect(res.success).toBe(true);
  });

  it('should reject create_local_task with empty title', () => {
    const res = validateToolArgs('create_local_task', {
      title: '',
    });
    expect(res.success).toBe(false);
  });

  it('should accept valid append_work_note args', () => {
    const res = validateToolArgs('append_work_note', {
      text: 'Error was caused by missing JWT secret in env',
      category: 'debug',
    });
    expect(res.success).toBe(true);
  });

  it('should fail closed for unallowed/unknown tools', () => {
    const res = validateToolArgs('execute_shell_command', {
      command: 'rm -rf /',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toContain('Unknown or unallowed tool');
    }
  });

  it('should fail closed for arbitrary code execution attempts', () => {
    const res = validateToolArgs('eval_javascript', {
      code: 'console.log(process.env)',
    });
    expect(res.success).toBe(false);
  });
});

describe('Plan Schema Bounds', () => {
  it('should validate a structured 2-step plan', () => {
    const plan = {
      observation: 'Visible error TS2345 in api/userService.ts',
      goalInterpretation: 'Resolve type mismatch for updateUserAge function',
      confidence: 'high',
      steps: [
        {
          id: 'step_1',
          tool: 'create_local_task',
          args: { title: 'Parse rawInput string to integer using parseInt' },
          rationale: 'Convert string input to number expected by db schema',
        },
        {
          id: 'step_2',
          tool: 'append_work_note',
          args: { text: 'Line 5 expects age as number but got rawInput: string', category: 'debug' },
          rationale: 'Save exact error location for reference',
        },
      ],
    };

    const res = PlanResponseSchema.safeParse(plan);
    expect(res.success).toBe(true);
  });

  it('should enforce safety cap of max 4 steps', () => {
    const tooManySteps = {
      observation: 'Multiple issues detected',
      goalInterpretation: 'Fix everything at once',
      steps: [
        { id: '1', tool: 'create_local_task', args: { title: 'Task 1' }, rationale: 'R1' },
        { id: '2', tool: 'create_local_task', args: { title: 'Task 2' }, rationale: 'R2' },
        { id: '3', tool: 'create_local_task', args: { title: 'Task 3' }, rationale: 'R3' },
        { id: '4', tool: 'create_local_task', args: { title: 'Task 4' }, rationale: 'R4' },
        { id: '5', tool: 'create_local_task', args: { title: 'Task 5' }, rationale: 'R5' },
      ],
    };

    const res = PlanResponseSchema.safeParse(tooManySteps);
    expect(res.success).toBe(false);
  });
});

describe('SessionManager & Deterministic Tool Dispatcher', () => {
  let session: SessionManager;

  beforeEach(() => {
    session = new SessionManager();
  });

  it('should execute create_local_task and produce observable local state', () => {
    const step: PlanStep = {
      id: 'step_1',
      tool: 'create_local_task',
      args: { title: 'Write unit tests for authentication' },
      rationale: 'Ensure regression prevention',
    };

    const result = session.executeStep(step);
    expect(result.success).toBe(true);
    expect(result.output?.taskId).toBe('task_1');

    const state = session.getState();
    expect(state.tasks.length).toBe(1);
    expect(state.tasks[0].id).toBe('task_1');
    expect(state.tasks[0].title).toBe('Write unit tests for authentication');
    expect(state.tasks[0].status).toBe('pending');
    expect(state.ledger.length).toBe(1);
    expect(state.ledger[0].status).toBe('succeeded');
  });

  it('should execute append_work_note and produce observable work note', () => {
    const step: PlanStep = {
      id: 'step_2',
      tool: 'append_work_note',
      args: { text: 'Key observation: 401 Unauthorized returned by auth server', category: 'debug' },
      rationale: 'Preserve debug context',
    };

    const result = session.executeStep(step);
    expect(result.success).toBe(true);
    expect(result.output?.noteId).toBe('note_1');

    const state = session.getState();
    expect(state.notes.length).toBe(1);
    expect(state.notes[0].category).toBe('debug');
    expect(state.ledger.length).toBe(1);
    expect(state.ledger[0].status).toBe('succeeded');
  });

  it('should execute a two-step agentic workflow and update ledger truthfully', () => {
    const steps: PlanStep[] = [
      {
        id: 'step_1',
        tool: 'create_local_task',
        args: { title: 'Fix Dockerfile lockfile path' },
        rationale: 'Address build cache error',
      },
      {
        id: 'step_2',
        tool: 'append_work_note',
        args: { text: 'Error in step 3/5: package-lock.json not found in context' },
        rationale: 'Log exact build error',
      },
    ];

    const planExecution = session.executePlan(steps);
    expect(planExecution.allSucceeded).toBe(true);
    expect(planExecution.results.length).toBe(2);

    const state = session.getState();
    expect(state.tasks.length).toBe(1);
    expect(state.notes.length).toBe(1);
    expect(state.ledger.length).toBe(2);
    expect(state.ledger[0].status).toBe('succeeded');
    expect(state.ledger[1].status).toBe('succeeded');
  });

  it('should mark an existing task complete via mark_task_complete', () => {
    // First create a task
    session.executeStep({
      id: 'step_1',
      tool: 'create_local_task',
      args: { title: 'Implement login' },
      rationale: 'Feature',
    });

    // Mark complete
    const markResult = session.executeStep({
      id: 'step_2',
      tool: 'mark_task_complete',
      args: { taskId: 'task_1' },
      rationale: 'Done',
    });

    expect(markResult.success).toBe(true);
    const state = session.getState();
    expect(state.tasks[0].status).toBe('completed');
  });

  it('should fail safely when attempting to mark non-existent task complete', () => {
    const markResult = session.executeStep({
      id: 'step_err',
      tool: 'mark_task_complete',
      args: { taskId: 'non_existent_id' },
      rationale: 'Should fail',
    });

    expect(markResult.success).toBe(false);
    expect(markResult.error).toContain('does not exist');

    const state = session.getState();
    expect(state.ledger[0].status).toBe('failed');
  });

  it('should record user rejection with zero side effects', () => {
    const steps: PlanStep[] = [
      {
        id: 'step_1',
        tool: 'create_local_task',
        args: { title: 'Unwanted task' },
        rationale: 'R',
      },
    ];

    session.recordRejection(steps, 'User canceled');
    const state = session.getState();
    expect(state.tasks.length).toBe(0);
    expect(state.notes.length).toBe(0);
    expect(state.ledger.length).toBe(1);
    expect(state.ledger[0].status).toBe('rejected');
    expect(state.ledger[0].error).toBe('User canceled');
  });
});
