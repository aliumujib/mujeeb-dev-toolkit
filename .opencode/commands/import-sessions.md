# /import-sessions

Import OpenCode sessions into Cipher memory for semantic search.

## Usage

```
/import-sessions [options]
```

### Options
- `--all` - Import all sessions (initial bulk import)
- `--new` - Import only new sessions since last import
- `--search <query>` - Search imported sessions
- `--status` - Show import status and stats

## Workflow

1. **First run (bulk import)**:
   Execute the session watcher to import all 202 sessions:
   ```bash
   bun run .opencode/scripts/session-watcher.ts --once
   ```

2. **Process pending imports**:
   For each file in `~/.local/share/cipher-mcp/data/pending-imports/`:
   - Read the JSON file
   - Call `cipher_extract_and_operate_memory` with the interaction and metadata
   - Delete the file after successful import

3. **Search sessions**:
   Use `cipher_memory_search` with the user's query to find relevant past sessions.

## Example Interactions

**User**: /import-sessions --all
**Assistant**: Runs bulk import, processes all pending imports via Cipher MCP

**User**: /import-sessions --search "compose preview implementation"  
**Assistant**: Searches Cipher memory and returns relevant session context

**User**: /import-sessions --status
**Assistant**: Shows how many sessions imported, pending, and last import time
