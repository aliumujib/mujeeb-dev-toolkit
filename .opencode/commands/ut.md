---
description: Unit test coverage improvement with task tracking
agent: build
---

# Unit Test Loop

Execute the setup script to initialize:

```bash
!`./scripts/setup-ut-loop.sh $ARGUMENTS`
```

You are now in a 2-phase unit test workflow.

---

## Branch Setup (Handled by Setup Script)

When starting on main/master, the setup script prompts:
1. "Create a feature branch?" [1/2]
2. If yes, prompts for branch name (default: `test/unit-coverage`)
3. Creates branch before loop starts

---

## Structured Output Control Flow

| Phase | Name | Required Marker | Next Phase |
|-------|------|-----------------|------------|
| 1 | Coverage Analysis | `<phase_complete phase="1"/>` | 2 |
| 2 | Task Handoff | `<phase_complete phase="2"/>` | done |

---

## Phase 1: Coverage Analysis

**Goal:** Identify files with low coverage and create prioritized test tasks.

1. **Run coverage** command to see current state
2. **Identify gaps** - Focus on:
   - Files with <80% coverage (or target from args)
   - User-facing behavior, not implementation details
   - Code paths that could break user workflows

3. **Create prioritized list** of 3-7 test tasks, each covering ONE specific behavior

**Output:** `<phase_complete phase="1"/>`

---

## Phase 2: Task Handoff

Use `todowrite` to create tasks for each coverage gap.

**Steps:**

1. Create todos for each test task:
```json
// Use todowrite with:
{
  "todos": [
    {"id": "test-1", "content": "Test: login validation (src/auth/login.ts, 45%) - valid/invalid credentials", "status": "pending", "priority": "high"},
    {"id": "test-2", "content": "Test: password reset (src/auth/reset.ts, 30%) - email trigger, token validation", "status": "pending", "priority": "high"},
    {"id": "test-3", "content": "Test: session refresh (src/auth/session.ts, 55%) - token refresh flow", "status": "pending", "priority": "medium"}
  ]
}
```

Each todo should include:
- File path and current coverage
- Key behaviors to test
- Priority (high for critical paths)

2. Confirm tasks with `todoread`

3. Ask user: "Coverage tasks created. What next?"

Options:
- **Start first task** - Begin implementation
- **Done** - Review tasks first

**Output:** `<phase_complete phase="2"/>` or `<promise>UT SETUP COMPLETE</promise>`

---

## Working on Tasks

Use the todo system + /complete workflow:

1. View tasks with `todoread`
2. Mark task as `in_progress` with `todowrite`
3. Write ONE meaningful test
4. Run lint, format, typecheck
5. Run coverage to verify improvement
6. `/complete` runs reviewers, commits, marks done

---

## React Testing Library Guidelines

> "The more your tests resemble the way your software is used, the more confidence they can give you."

### Query Priority (use in order)
1. `getByRole` - **default choice**, use `name` option: `getByRole('button', {name: /submit/i})`
2. `getByLabelText` - form fields
3. `getByPlaceholderText` - only if no label
4. `getByText` - non-interactive elements
5. `getByTestId` - **last resort only**

### Best Practices
- **Use `screen`** - `screen.getByRole('button')` not destructuring render
- **Use `userEvent.setup()`** - more realistic than `fireEvent`
- **Use jest-dom matchers** - `toBeDisabled()` not `expect(el.disabled).toBe(true)`
- **Test behavior, not implementation** - what users see/do, not internal state

---

## Quality Expectations

- **ONE test per task** - focused, reviewable commits
- **User-facing behavior only** - test what users depend on
- **Quality over quantity** - great tests catch regressions users would notice
- **No coverage gaming** - if code isn't worth testing, use `/* v8 ignore */`

---

## Cancellation

To cancel: `/cancel-ut` or `rm .opencode/ut-loop-*.local.md`
