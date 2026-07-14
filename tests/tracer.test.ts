import { describe, expect, it } from "vitest";
import { AgentTracer } from "../src/tracer.js";

describe("AgentTracer", () => {
  it("records successful tool calls", async () => {
    const tracer = new AgentTracer();

    const output = await tracer.recordToolCall(
      "search_docs",
      'query="agents"',
      async () => ["result one", "result two"],
      (result) => `${result.length} result(s)`,
    );

    const trace = tracer.complete();

    expect(output).toHaveLength(2);
    expect(trace.toolCalls).toHaveLength(1);
    expect(trace.toolCalls[0]).toMatchObject({
      name: "search_docs",
      inputSummary: 'query="agents"',
      outputSummary: "2 result(s)",
      success: true,
    });
    expect(trace.runId).toEqual(expect.any(String));
    expect(trace.startedAt).toEqual(expect.any(String));
    expect(trace.completedAt).toEqual(expect.any(String));
    expect(trace.totalDurationMs).toEqual(expect.any(Number));
  });

  it("records failed tool calls", async () => {
    const tracer = new AgentTracer();

    await expect(
      tracer.recordToolCall(
        "summarize_result",
        "0 search result(s)",
        async () => {
          throw new Error("Cannot summarize an empty result set.");
        },
        () => "unused",
      ),
    ).rejects.toThrow("Cannot summarize an empty result set.");

    const trace = tracer.complete();

    expect(trace.toolCalls).toHaveLength(1);
    expect(trace.toolCalls[0]).toMatchObject({
      name: "summarize_result",
      success: false,
      errorMessage: "Cannot summarize an empty result set.",
    });
  });

  it("exports_failed_tool_call_error_details", async () => {
    const tracerModule = (await import("../src/tracer.js")) as unknown as {
      toExportedTrace?: (trace: ReturnType<AgentTracer["complete"]>) => {
        tool_calls: Array<Record<string, unknown>>;
      };
    };
    expect(
      typeof tracerModule.toExportedTrace,
      "production trace export helper should exist",
    ).toBe("function");

    const tracer = new AgentTracer();

    await expect(
      tracer.recordToolCall(
        "explode_tool",
        "input=distinct-failing-value",
        async () => {
          throw new Error("failing tool exploded with code 42");
        },
        () => "should not be summarized",
      ),
    ).rejects.toThrow("failing tool exploded with code 42");

    const exported = tracerModule.toExportedTrace!(tracer.complete());

    expect(exported.tool_calls).toHaveLength(1);
    expect(exported.tool_calls[0]).toMatchObject({
      name: "explode_tool",
      input_summary: "input=distinct-failing-value",
      success: false,
      error_message: "failing tool exploded with code 42",
    });
    expect(exported.tool_calls[0]).not.toHaveProperty("output_summary");
  });
});
