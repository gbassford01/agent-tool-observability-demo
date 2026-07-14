import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

export type ToolCallTrace = {
  name: string;
  inputSummary: string;
  outputSummary?: string;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
};

export type AgentTrace = {
  runId: string;
  startedAt: string;
  completedAt?: string;
  totalDurationMs?: number;
  toolCalls: ToolCallTrace[];
};

export type ExportedToolCallTrace = {
  name: string;
  input_summary: string;
  success: boolean;
  duration_ms: number;
  output_summary?: string;
  error_message?: string;
};

export type ExportedAgentTrace = {
  run_id: string;
  started_at: string;
  completed_at?: string;
  total_duration_ms?: number;
  tool_calls: ExportedToolCallTrace[];
};

export class AgentTracer {
  private readonly startedAtMs = Date.now();
  private readonly trace: AgentTrace = {
    runId: randomUUID(),
    startedAt: new Date().toISOString(),
    toolCalls: [],
  };

  async recordToolCall<T>(
    name: string,
    inputSummary: string,
    runTool: () => Promise<T>,
    summarizeOutput: (output: T) => string,
  ): Promise<T> {
    const started = Date.now();

    try {
      const output = await runTool();
      this.trace.toolCalls.push({
        name,
        inputSummary,
        outputSummary: summarizeOutput(output),
        success: true,
        durationMs: Date.now() - started,
      });
      return output;
    } catch (error) {
      this.trace.toolCalls.push({
        name,
        inputSummary,
        success: false,
        durationMs: Date.now() - started,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  complete(): AgentTrace {
    if (!this.trace.completedAt) {
      this.trace.completedAt = new Date().toISOString();
      this.trace.totalDurationMs = Date.now() - this.startedAtMs;
    }

    return this.getTrace();
  }

  getTrace(): AgentTrace {
    return {
      ...this.trace,
      toolCalls: [...this.trace.toolCalls],
    };
  }
}

export function toExportedTrace(trace: AgentTrace): ExportedAgentTrace {
  return {
    run_id: trace.runId,
    started_at: trace.startedAt,
    ...(trace.completedAt ? { completed_at: trace.completedAt } : {}),
    ...(trace.totalDurationMs !== undefined
      ? { total_duration_ms: trace.totalDurationMs }
      : {}),
    tool_calls: trace.toolCalls.map((toolCall) => ({
      name: toolCall.name,
      input_summary: toolCall.inputSummary,
      success: toolCall.success,
      duration_ms: toolCall.durationMs,
      ...(toolCall.outputSummary !== undefined
        ? { output_summary: toolCall.outputSummary }
        : {}),
      ...(toolCall.errorMessage !== undefined
        ? { error_message: toolCall.errorMessage }
        : {}),
    })),
  };
}

export async function writeTraceExport(
  trace: AgentTrace,
  exportPath: string,
): Promise<void> {
  await writeFile(
    exportPath,
    `${JSON.stringify(toExportedTrace(trace), null, 2)}\n`,
    "utf8",
  );
}
