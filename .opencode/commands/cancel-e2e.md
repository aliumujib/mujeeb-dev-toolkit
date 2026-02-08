---
description: Cancel active E2E test loop
agent: build
---

# Cancel E2E Test Loop

To cancel the E2E test loop:

1. Find any e2e-loop state files:
```bash
ls .opencode/e2e-loop-*.local.md 2>/dev/null || echo "NONE"
```

2. **If NONE**: Say "No active E2E test loop found in this project."

3. **If file(s) found**:
   - Read the FIRST state file to get: `scope`, `current_phase`, `started_at`
   - Remove ALL e2e-loop state files: `rm .opencode/e2e-loop-*.local.md`
   - Show summary:
     ```
     E2E Test Loop Summary (Cancelled)
     ─────────────────────────────────
     Scope:    SCOPE
     Phase:    CURRENT_PHASE
     Duration: Xm Ys
     ─────────────────────────────────
     ```
