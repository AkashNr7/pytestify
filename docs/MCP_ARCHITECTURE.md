# Model Context Protocol (MCP) Architectural Alignment

This document details the lightweight, hybrid Model Context Protocol (MCP) implementation integrated into the Postman-to-Pytest Migrator workspace. MCP allows external LLMs, developers, or domestic system agents to query available test automation tools, trigger migrations, and analyze diagnostic errors using a standardized protocol.

---

## What is MCP?

The **Model Context Protocol (MCP)** is an open communication standard designed to securely expose local context, configurations, data repositories, and execution schemas as reusable integrations ("tools") to foundation models. By implementing standard registries (like `/api/mcp` answering JSON-RPC 2.0 requests), foundation models can dynamically interrogate backend servers to discover and invoke tools without custom APIs or brittle integration code.

---

## Why MCP Was Added

Implementing MCP in the Postman-to-Pytest Migrator architecture delivers:
1. **Model & Framework Decoupling**: Unified tool invocation contracts allow different AI agents (e.g. Gemini, Antigravity, Claude, or custom orchestrators) to control migrations.
2. **Standardized Context Fetching**: The migration pipeline can be queried uniformly over a well-defined protocol without separate endpoints.
3. **Robust Evaluation Capabilities**: Provides a demonstrable, standards-compliant capability showing how AI-centric systems can orchestrate software QA loops.

---

## MCP System Architecture

An overview of our standard and MCP execution paths:

```text
               +-------------------------------------------------+
               |              React Client Browser               |
               +-----------------------+-------------------------+
                                       |
                     [Requests]        |       [MCP / JSON-RPC]
                                       v
               +-----------------------+-------------------------+
               |              Express Fullstack Server            |
               +-----------------------+-------------------------+
                                       |
                       +---------------+---------------+
                       |                               |
                       v                               v
         +-------------+-------------+   +-------------+-------------+
         |     Standard REST API     |   |      Hybrid MCP Server    |
         |  - /api/migrate           |   |  - POST /api/mcp (RPC)    |
         |  - /api/execute           |   |                 |         |
         +-------------+-------------+   +-----------------+---------+
                       |                                   |
                       +---------------+-------------------+
                                       |
                                       v
               +-----------------------+-------------------------+
               |              AI Translation Engine             |
               |             (Gemini-3.5-3way Fallback)          |
               +-------------------------------------------------+
```

### Exposed MCP Tools

The hybrid server publishes four distinct, self-documenting MCP tools:

| Tool Name | Input Payload (`arguments`) | Output Payload | Operational Purpose |
| :--- | :--- | :--- | :--- |
| **`fetch_postman_collection`** | `{ "collection_id": string }` | `{ "collection": object }` | Retrieves clean, structured JSON Postman specs for migration from existing active stores or mock files. |
| **`generate_pytest`** | `{ "collection": object }` | `{ "pytest_code": string }` | Converts parsed collection items and custom Chai asserts into standard, fully executable python `pytest` code. |
| **`run_pytest`** | `{ "file_path": string }` | `{ "passed": int, "failed": int, "execution_time": float }` | Simulates and evaluates structural execution inside the sandboxed QA diagnostic environment. |
| **`analyze_failure`** | `{ "error_log": string }` | `{ "root_cause": string, "recommendation": string }` | Dissects raw terminal logs, providing roots-causes and code patches to bypass authentication or design drifts. |

---

## Protocol Specifications

### Tool Discovery (`tools/list`)
Client queries available capabilities.

**Request** (`POST /api/mcp`):
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "generate_pytest",
        "description": "Convert a parsed Postman collection into standard executable python pytest code.",
        "inputSchema": { "type": "object", "properties": { "collection": { "type": "object" } }, "required": ["collection"] }
      }
    ]
  },
  "id": 1
}
```

### Tool Execution (`tools/call`)
Client invokes a tool with parameters.

**Request** (`POST /api/mcp`):
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "analyze_failure",
    "arguments": {
      "error_log": "AssertionError: assert 401 == 200"
    }
  },
  "id": 2
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"root_cause\": \"The authentication token is missing or expired, returning a 401 Unauthorized block.\",\n  \"recommendation\": \"Regenerate local Bearer token setup on authorization headers.\"\n}"
      }
    ],
    "isError": false
  },
  "id": 2
}
```

---

## Agentic Autonomy Loop

Using the **AI Agent** interactive chat panel:
1. The user inputs: `"I received a 401 token expired block. What should I do?"`
2. The agent automatically runs intent router checks to call the **`analyze_failure`** tool.
3. The server executes `analyze_failure` via internal tools pipeline.
4. The agent takes the tool output and synthesizes highly customized recommendation scripts for the user.
