import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("README", () => {
  it("documents_export_trace_usage", async () => {
    const readme = await readFile(
      new URL("../README.md", import.meta.url),
      "utf8",
    );

    expect(readme).toContain("--export-trace <path>");
    expect(readme).toContain("npm run dev -- --export-trace");
    expect(readme).toContain("run_id");
    expect(readme).toContain("started_at");
    expect(readme).toContain("completed_at");
    expect(readme).toContain("total_duration_ms");
    expect(readme).toContain("tool_calls");
  });
});
