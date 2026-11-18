import {
  LocalTask,
  WorkNote,
  LedgerEntry,
  SessionState,
  PlanStep,
  ToolExecutionResult,
} from '../../shared/types.js';
import { validateToolArgs } from '../../shared/schema.js';

export class SessionManager {
  private tasks: LocalTask[] = [];
  private notes: WorkNote[] = [];
  private ledger: LedgerEntry[] = [];
  private taskCounter = 1;
  private noteCounter = 1;

  public getState(): SessionState {
    return {
      tasks: [...this.tasks],
      notes: [...this.notes],
      ledger: [...this.ledger],
    };
  }

  public reset(): void {
    this.tasks = [];
    this.notes = [];
    this.ledger = [];
    this.taskCounter = 1;
    this.noteCounter = 1;
  }

  public recordRejection(steps: PlanStep[], reason = 'User rejected plan'): LedgerEntry[] {
    const timestamp = new Date().toISOString();
    const rejectionEntries: LedgerEntry[] = steps.map((step) => ({
      stepId: step.id,
      tool: step.tool,
      args: step.args,
      status: 'rejected',
      error: reason,
      timestamp,
      durationMs: 0,
    }));
    this.ledger.push(...rejectionEntries);
    return rejectionEntries;
  }

  /**
   * Deterministically execute a single approved plan step.
   * Unknown tools, unallowed operations, or malformed arguments fail closed.
   */
  public executeStep(step: PlanStep): ToolExecutionResult {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 1. Strict schema validation of tool arguments
    const validation = validateToolArgs(step.tool, step.args);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join('; ');
      const ledgerEntry: LedgerEntry = {
        stepId: step.id,
        tool: step.tool,
        args: step.args,
        status: 'failed',
        error: errorMsg,
        timestamp,
        durationMs: Date.now() - startTime,
      };
      this.ledger.push(ledgerEntry);
      return { success: false, tool: step.tool, error: errorMsg };
    }

    // 2. Dispatch to deterministic local handler
    try {
      let output: Record<string, unknown>;

      switch (step.tool) {
        case 'create_local_task': {
          const { title, description } = validation.data as {
            title: string;
            description?: string;
          };
          const taskId = `task_${this.taskCounter++}`;
          const newTask: LocalTask = {
            id: taskId,
            title,
            description,
            status: 'pending',
            createdAt: timestamp,
          };
          this.tasks.push(newTask);
          output = {
            taskId,
            title,
            description: description || '',
            status: 'pending',
            createdAt: timestamp,
          };
          break;
        }

        case 'append_work_note': {
          const { text, category } = validation.data as {
            text: string;
            category?: 'observation' | 'action_item' | 'debug' | 'general';
          };
          const noteId = `note_${this.noteCounter++}`;
          const newNote: WorkNote = {
            id: noteId,
            text,
            category: category || 'general',
            createdAt: timestamp,
          };
          this.notes.push(newNote);
          output = {
            noteId,
            text,
            category: newNote.category,
            createdAt: timestamp,
          };
          break;
        }

        case 'mark_task_complete': {
          const { taskId } = validation.data as { taskId: string };
          const existingTask = this.tasks.find((t) => t.id === taskId);
          if (!existingTask) {
            throw new Error(`Task with ID '${taskId}' does not exist in current session.`);
          }
          existingTask.status = 'completed';
          existingTask.completedAt = timestamp;
          output = {
            taskId,
            status: 'completed',
            completedAt: timestamp,
          };
          break;
        }

        default:
          throw new Error(`Execution dispatcher has no handler for tool '${step.tool}'`);
      }

      const durationMs = Date.now() - startTime;
      const ledgerEntry: LedgerEntry = {
        stepId: step.id,
        tool: step.tool,
        args: step.args,
        status: 'succeeded',
        result: output,
        timestamp,
        durationMs,
      };
      this.ledger.push(ledgerEntry);

      return {
        success: true,
        tool: step.tool,
        output,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - startTime;
      const ledgerEntry: LedgerEntry = {
        stepId: step.id,
        tool: step.tool,
        args: step.args,
        status: 'failed',
        error: errorMsg,
        timestamp,
        durationMs,
      };
      this.ledger.push(ledgerEntry);

      return {
        success: false,
        tool: step.tool,
        error: errorMsg,
      };
    }
  }

  /**
   * Execute multiple approved plan steps sequentially.
   * If any step fails, subsequent steps can be halted safely.
   */
  public executePlan(steps: PlanStep[]): {
    results: ToolExecutionResult[];
    allSucceeded: boolean;
    state: SessionState;
  } {
    const results: ToolExecutionResult[] = [];
    let allSucceeded = true;

    for (const step of steps) {
      const result = this.executeStep(step);
      results.push(result);
      if (!result.success) {
        allSucceeded = false;
        // Halt subsequent steps on failure to maintain state consistency
        break;
      }
    }

    return {
      results,
      allSucceeded,
      state: this.getState(),
    };
  }
}

// Global session singleton for the current server process
export const sessionManager = new SessionManager();
