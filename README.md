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

## Test

```bash
npm test
```

## Build

```bash
npm run build
```
