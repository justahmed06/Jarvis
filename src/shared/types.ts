export type ToolName = 'create_local_task' | 'append_work_note' | 'mark_task_complete';

export interface CreateLocalTaskArgs {
  title: string;
  description?: string;
}

export interface AppendWorkNoteArgs {
  text: string;
  category?: 'observation' | 'action_item' | 'debug' | 'general';
}

export interface MarkTaskCompleteArgs {
  taskId: string;
}

export type ToolArgs = CreateLocalTaskArgs | AppendWorkNoteArgs | MarkTaskCompleteArgs;

export interface PlanStep {
  id: string;
  tool: ToolName;
  args: Record<string, unknown>;
  rationale: string;
}

export interface PlanResponse {
  observation: string;
  goalInterpretation: string;
  steps: PlanStep[];
  confidence?: 'high' | 'medium' | 'low';
}

export interface LocalTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface WorkNote {
  id: string;
  text: string;
  category: 'observation' | 'action_item' | 'debug' | 'general';
  createdAt: string;
}

export type LedgerStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'rejected';

export interface LedgerEntry {
  stepId: string;
  tool: string;
  args: Record<string, unknown>;
  status: LedgerStatus;
  result?: Record<string, unknown>;
  error?: string;
  timestamp: string;
  durationMs?: number;
}

export interface SessionState {
  tasks: LocalTask[];
  notes: WorkNote[];
  ledger: LedgerEntry[];
}

export interface PlanRequest {
  imageBase64: string;
  mimeType: string;
  goal: string;
}

export interface ExecuteStepRequest {
  step: PlanStep;
}

export interface ExecutePlanRequest {
  steps: PlanStep[];
}

export interface ToolExecutionResult {
  success: boolean;
  tool: string;
  output?: Record<string, unknown>;
  error?: string;
}
