---
description: Cancel active unit test loop
agent: build
---

# Cancel Unit Test Loop

To cancel the unit test loop:

1. Find any ut-loop state files:
```bash
ls .opencode/ut-loop-*.local.md 2>/dev/null || echo "NONE"
```

2. **If NONE**: Say "No active unit test loop found in this project."

3. **If file(s) found**:
   - Read the FIRST state file to get: `target`, `current_phase`, `started_at`
   - Remove ALL ut-loop state files: `rm .opencode/ut-loop-*.local.md`
   - Show summary:
     ```
     Unit Test Loop Summary (Cancelled)
     ──────────────────────────────────
     Target:   TARGET%
     Phase:    CURRENT_PHASE
     Duration: Xm Ys
     ──────────────────────────────────
     ```
