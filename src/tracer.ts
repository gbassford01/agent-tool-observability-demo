import { randomUUID } from "node:crypto";

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

export class AgentTracer {
  private readonly startedAtMs = Date.now();
  private readonly trace: AgentTrace = {
    runId: randomUUID(),
    startedAt: new Date().toISOString(),
    toolCalls: []
  };

  async recordToolCall<T>(
    name: string,
    inputSummary: string,
    runTool: () => Promise<T>,
    summarizeOutput: (output: T) => string
  ): Promise<T> {
    const started = Date.now();

    try {
      const output = await runTool();
      this.trace.toolCalls.push({
        name,
        inputSummary,
        outputSummary: summarizeOutput(output),
        success: true,
        durationMs: Date.now() - started
      });
      return output;
    } catch (error) {
      this.trace.toolCalls.push({
        name,
        inputSummary,
        success: false,
        durationMs: Date.now() - started,
        errorMessage: error instanceof Error ? error.message : String(error)
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
      toolCalls: [...this.trace.toolCalls]
    };
  }
}
