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

## Phase 2: Task Handoff

The agent:
1. Creates todos for each flow to test using `todowrite`
2. Each task includes flow description and key steps

## After Setup

You work through tasks one at a time:
1. View tasks with `todoread`
2. Mark task as in_progress with `todowrite`
3. Write page object + test
4. Run `/complete` to review, commit, mark done

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
