export type SearchResult = {
  title: string;
  snippet: string;
};

export async function searchDocs(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty.");
  }

  return [
    {
      title: "Agent Tool Observability",
      snippet: "Track every tool invocation with timing, status, and summaries."
    },
    {
      title: "Structured Traces",
      snippet: "Use structured JSON to make agent behavior inspectable and testable."
    }
  ];
}

export async function summarizeResult(results: SearchResult[]): Promise<string> {
  if (results.length === 0) {
    throw new Error("Cannot summarize an empty result set.");
  }

  return results.map((result) => result.snippet).join(" ");
}
