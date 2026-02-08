---
description: Explain the E2E test loop technique
agent: plan
---

# E2E Test Loop Explained

The `/e2e` command starts a **2-phase workflow** for browser test coverage:

## Phase 1: Flow Analysis

The agent:
1. Analyzes your application routes and features
2. Identifies critical user flows needing E2E coverage
3. Prioritizes 3-7 test tasks

## Phase 2: Dex Handoff

The agent:
1. Creates a Dex epic for E2E coverage
2. Creates individual tasks for each flow to test
3. Each task includes page object + test file

## After Setup

You work through tasks one at a time:
```bash
dex list --ready        # See available tasks
dex start <id>          # Claim a task
# Write page object + test
/complete <id>          # Review, commit, mark done
```

## File Convention

```
e2e/
├── checkout.e2e.page.ts    # Page object (locators, actions)
├── checkout.e2e.ts         # Test file (concise tests)
```

## Playwright Best Practices

- Use semantic locators: `getByRole`, `getByLabel`, `getByText`
- Use Page Object Pattern for maintainability
- Test user-visible behavior, not implementation

## Commands

- `/e2e "cover checkout flow"` - Start the loop
- `/cancel-e2e` - Cancel if needed
- `/complete <task-id>` - Finish a task with review
