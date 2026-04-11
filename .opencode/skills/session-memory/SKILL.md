---
name: session-memory
description: Import past OpenCode sessions into Cipher for semantic search across your development history.
---

# Session Memory Skill

Import past OpenCode sessions into Cipher for semantic search across your development history.

## When to Use

- When user asks about past work: "how did I implement X", "what was that pattern I used for Y"
- When user wants to import sessions: `/import-sessions`
- When searching for context from previous sessions
- When setting up session memory for a new project

## Architecture

```
~/.opencode/qmd-sessions/*.md    (202 session files)
              ↓
    session-watcher.ts           (parse & queue)
              ↓
~/.local/share/cipher-mcp/data/pending-imports/*.json
              ↓
    cipher_extract_and_operate_memory()   (Cipher MCP)
              ↓
    Ollama nomic-embed-text      (local embeddings, no rate limits)
              ↓
    SQLite + Vector Store        (persistent memory)
              ↓
    cipher_memory_search()       (semantic search)
```

## Workflow

### Step 1: Queue Sessions for Import

Run the session watcher to parse and queue all sessions:

```bash
bun run .opencode/scripts/session-watcher.ts --once
```

This creates JSON files in `~/.local/share/cipher-mcp/data/pending-imports/`

### Step 2: Process Pending Imports

For each pending import file, call Cipher:

```typescript
// Read pending import
const importData = JSON.parse(fs.readFileSync(importFile));

// Call Cipher MCP
cipher_extract_and_operate_memory({
  interaction: importData.interaction,
  memoryMetadata: importData.metadata,
  options: {
    autoExtractKnowledgeInfo: true,
    confidenceThreshold: 0.5
  }
});

// Delete processed file
fs.unlinkSync(importFile);
```

### Step 3: Search Past Sessions

```typescript
cipher_memory_search({
  query: "compose preview implementation patterns",
  top_k: 10,
  similarity_threshold: 0.3
});
```

## Configuration

Cipher is configured in `opencode.json` to use:

- **Embeddings**: Ollama with `nomic-embed-text` (768 dimensions, local)
- **Storage**: SQLite at `~/.local/share/cipher-mcp/data/cipher.db`
- **Vector Store**: In-memory with Cosine distance

## Commands

| Command | Description |
|---------|-------------|
| `/import-sessions --all` | Bulk import all sessions |
| `/import-sessions --new` | Import only new sessions |
| `/import-sessions --search <query>` | Search session memory |
| `/import-sessions --status` | Show import stats |

## Troubleshooting

### "Rate limit exceeded"
- Check Ollama is running: `ollama list`
- Verify config uses Ollama, not OpenAI
- Restart OpenCode to reload config

### "Embeddings disabled"
- Pull the model: `ollama pull nomic-embed-text`
- Check OLLAMA_BASE_URL is set correctly

### Empty search results
- Run bulk import first
- Check pending imports were processed
- Lower similarity_threshold (default 0.3)
