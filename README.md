# Agent Tool Observability Demo

A small TypeScript CLI that simulates an AI agent workflow and records each tool call as structured JSON.

The demo workflow:

1. Calls a `search_docs` tool.
2. Calls a `summarize_result` tool.
3. Records each tool call with timing, inputs, outputs, and success status.
4. Prints a final trace report.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Pass a custom query:

```bash
npm run dev -- "tool calling observability"
```

Export the completed run trace to JSON while keeping the console trace report:

```bash
npm run dev -- --export-trace ./trace.json "tool calling observability"
```

The `--export-trace <path>` file uses snake_case fields. Top-level fields are
`run_id`, `started_at`, `completed_at`, `total_duration_ms`, and `tool_calls`.
Each tool call includes `name`, `input_summary`, `success`, `duration_ms`,
`output_summary` for successful calls when available, and `error_message` for
failed calls.

## Test

```bash
npm test
```

## Build

```bash
npm run build
```
