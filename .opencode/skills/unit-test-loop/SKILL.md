---
name: unit-test-loop
description: Use for improving test coverage, adding unit tests, TDD, or testing modules. Covers the unit test loop workflow, React Testing Library best practices, query priorities, and coverage improvement strategies.
---

# Unit Test Loop - Coverage Improvement

**Current branch:** !`git branch --show-current 2>/dev/null || echo "not in git repo"`

The unit test loop uses a 2-phase workflow with task tracking for
test coverage improvement.

## The 2-Phase Approach

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Coverage Analysis | Identify gaps, prioritize files |
| 2 | Task Handoff | Create tasks from analysis using todowrite |

After Phase 2, use `/complete` for each test task.

## Starting the Loop

```bash
/ut "Improve coverage for auth module"            # Basic
/ut "Add tests" --target 80%                      # With target
```

## Phase 1: Coverage Analysis

1. Run coverage command to see current state
2. Identify files with low coverage
3. Prioritize 3-7 test tasks for user-facing behavior

**Output:** `<phase_complete phase="1"/>`

## Phase 2: Task Handoff

Use `todowrite` to create tasks for each coverage gap:

```json
{
  "todos": [
    {"id": "test-1", "content": "Test: login validation (src/auth/login.ts, 45%) - valid/invalid credentials", "status": "pending", "priority": "high"},
    {"id": "test-2", "content": "Test: password reset (src/auth/reset.ts, 30%) - email trigger, token validation", "status": "pending", "priority": "high"},
    {"id": "test-3", "content": "Test: session refresh (src/auth/session.ts, 55%) - token refresh flow", "status": "pending", "priority": "medium"}
  ]
}
```

**Output:** `<phase_complete phase="2"/>` or `<promise>UT SETUP COMPLETE</promise>`

## Working on Tasks

Use the todo system + /complete workflow:

1. **View tasks** - Use `todoread` or see them in the TUI
2. **Start task** - Update status to `in_progress` with `todowrite`
3. **Write test** - Implement the test following RTL patterns
4. **Complete** - Use `/complete` to run reviewers and commit
5. **Mark done** - Update status to `completed` with `todowrite`

## React Testing Library Patterns

> "The more your tests resemble the way your software is used,
> the more confidence they can give you."

### Query Priority (Use in Order)

| Priority | Query | Use Case |
|----------|-------|----------|
| 1 | `getByRole` | Default choice, use `name` option |
| 2 | `getByLabelText` | Form fields with labels |
| 3 | `getByPlaceholderText` | Only if no label available |
| 4 | `getByText` | Non-interactive elements |
| 5 | `getByTestId` | **Last resort only** |

### Query Types

| Type | When to Use |
|------|-------------|
| `getBy`/`getAllBy` | Element exists (throws if not found) |
| `queryBy`/`queryAllBy` | **Only** for asserting absence |
| `findBy`/`findAllBy` | Async elements (returns Promise) |

### Best Practices

```typescript
// Use screen
screen.getByRole('button', { name: /submit/i })

// Use userEvent.setup()
const user = userEvent.setup()
await user.click(button)

// Use jest-dom matchers
expect(button).toBeDisabled()  // Not: expect(button.disabled).toBe(true)

// Avoid act() - RTL handles it
await screen.findByText('Loaded')  // Not: act(() => ...)
```

## Quality Standards

- **ONE test per task** - Focused, reviewable commits
- **User-facing behavior only** - Test what users depend on
- **Quality over quantity** - One great test beats ten shallow ones
- **No coverage gaming** - Use `/* v8 ignore */` for untestable code

## Command Reference

```bash
/ut "prompt"                  # Start analysis
/ut "prompt" --target 80%     # With target
/cancel-ut                    # Cancel loop
/complete <task-id>           # Complete task with reviewers
```

## Related

- `/complete` - Run reviewers, commit, mark task complete
- `todoread` - View pending tasks
- `todowrite` - Update task status
