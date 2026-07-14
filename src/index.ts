import { AgentTracer, writeTraceExport } from "./tracer.js";
import { searchDocs, summarizeResult } from "./tools.js";

type CliOptions = {
  query: string;
  exportTracePath?: string;
};

function parseCliOptions(args: string[]): CliOptions {
  const queryParts: string[] = [];
  let exportTracePath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--export-trace") {
      const path = args[index + 1];

      if (!path) {
        throw new Error("Missing value for --export-trace <path>.");
      }

      exportTracePath = path;
      index += 1;
      continue;
    }

    queryParts.push(arg);
  }

  return {
    query: queryParts.join(" ") || "agent observability",
    exportTracePath,
  };
}

async function main() {
  const { query, exportTracePath } = parseCliOptions(process.argv.slice(2));
  const tracer = new AgentTracer();

  const results = await tracer.recordToolCall(
    "search_docs",
    `query="${query}"`,
    () => searchDocs(query),
    (output) => `${output.length} result(s)`,
  );

  const summary = await tracer.recordToolCall(
    "summarize_result",
    `${results.length} search result(s)`,
    () => summarizeResult(results),
    (output) => `${output.length} character summary`,
  );

  const trace = tracer.complete();

  if (exportTracePath) {
    try {
      await writeTraceExport(trace, exportTracePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to export trace to ${exportTracePath}: ${message}`,
      );
    }
  }

  console.log("Agent summary:");
  console.log(summary);
  console.log("");
  console.log("Trace report:");
  console.log(JSON.stringify(trace, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
