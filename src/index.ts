import { AgentTracer } from "./tracer.js";
import { searchDocs, summarizeResult } from "./tools.js";

async function main() {
  const query = process.argv.slice(2).join(" ") || "agent observability";
  const tracer = new AgentTracer();

  const results = await tracer.recordToolCall(
    "search_docs",
    `query="${query}"`,
    () => searchDocs(query),
    (output) => `${output.length} result(s)`
  );

  const summary = await tracer.recordToolCall(
    "summarize_result",
    `${results.length} search result(s)`,
    () => summarizeResult(results),
    (output) => `${output.length} character summary`
  );

  const trace = tracer.complete();

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
