---
description: Explain the unit test loop technique
agent: plan
---

# Unit Test Loop Explained

The `/ut` command starts a **2-phase workflow** for improving test coverage:

## Phase 1: Coverage Analysis

The agent:
1. Runs your test coverage command
2. Identifies files with low coverage
3. Prioritizes 3-7 test tasks focusing on user-facing behavior

## Phase 2: Dex Handoff

The agent:
1. Creates a Dex epic tracking the coverage goal
2. Creates individual tasks for each test to write
3. Sets up dependencies between tasks

## After Setup

You work through tasks one at a time:
```bash
dex list --ready        # See available tasks
dex start <id>          # Claim a task
# Write the test
/complete <id>          # Review, commit, mark done
```

## Key Principles

- **ONE test per task** - Focused commits
- **User-facing behavior** - Test what users depend on
- **Quality over quantity** - One great test beats ten shallow ones

## Commands

- `/ut "improve auth coverage"` - Start the loop
- `/cancel-ut` - Cancel if needed
- `/complete <task-id>` - Finish a task with review
