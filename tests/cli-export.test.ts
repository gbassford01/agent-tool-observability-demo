import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const tmpDirs: string[] = [];

type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

async function createTmpDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "agent-trace-export-"));
  tmpDirs.push(dir);
  return dir;
}

async function runCli(args: string[]): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync(
      "npm",
      ["run", "dev", "--", ...args],
      { cwd: repoRoot },
    );
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const childError = error as {
      code?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      exitCode: childError.code ?? 1,
      stdout: childError.stdout ?? "",
      stderr: childError.stderr ?? "",
    };
  }
}

afterEach(async () => {
  await Promise.all(
    tmpDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("CLI trace export", () => {
  it("writes_successful_trace_export", async () => {
    const dir = await createTmpDir();
    const exportPath = join(dir, "trace.json");

    const result = await runCli([
      "--export-trace",
      exportPath,
      "tool calling observability",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Trace report:");

    const exported = JSON.parse(await readFile(exportPath, "utf8")) as {
      run_id?: unknown;
      started_at?: unknown;
      completed_at?: unknown;
      total_duration_ms?: unknown;
      tool_calls?: Array<Record<string, unknown>>;
    };

    expect(exported.run_id).toEqual(expect.any(String));
    expect(exported.started_at).toEqual(expect.any(String));
    expect(exported.completed_at).toEqual(expect.any(String));
    expect(exported.total_duration_ms).toEqual(expect.any(Number));
    expect(exported.tool_calls).toHaveLength(2);

    expect(exported.tool_calls?.[0]).toMatchObject({
      name: "search_docs",
      input_summary: 'query="tool calling observability"',
      output_summary: "2 result(s)",
      success: true,
    });
    expect(exported.tool_calls?.[0]?.duration_ms).toEqual(expect.any(Number));

    expect(exported.tool_calls?.[1]).toMatchObject({
      name: "summarize_result",
      input_summary: "2 search result(s)",
      success: true,
    });
    expect(exported.tool_calls?.[1]?.duration_ms).toEqual(expect.any(Number));
    expect(exported.tool_calls?.[1]?.output_summary).toMatch(
      /^[1-9]\d* character summary$/,
    );
  });

  it("fails_for_invalid_export_path", async () => {
    const invalidExportPath = await createTmpDir();

    const result = await runCli([
      "--export-trace",
      invalidExportPath,
      "tool calling observability",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Failed to export trace");
    expect(result.stderr).toContain(invalidExportPath);
  });
});
