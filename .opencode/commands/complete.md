---
description: Run reviewers and mark Dex task complete
agent: build
---

# Complete Task Workflow

This command runs the standard review workflow then marks a Dex task complete.

## Usage

```
/complete <task-id>
```

## Workflow

1. **Get task details and mark in-progress**:
```bash
dex show $1 --full
dex start $1
```

2. **Run reviewers in parallel** (use @mentions to invoke subagents):

```
@general Review this code for simplification opportunities
@explore Check for any security or performance issues
```

3. **Address ALL findings** from reviewers

4. **Commit** with task reference:
```bash
git commit -m "feat(<scope>): $1 - <title>"
```

5. **Mark task complete with verified result**:
```bash
dex complete $1 --result "What changed: <implementation summary>. Verification: <N> tests passing, build success, lint clean."
```

**Result must include verification, not claims:**
- Good: "Added login endpoint. 24 tests passing. Build success."
- Bad: "Should work now" or "Made the changes"

6. **Show next ready task**:
```bash
dex list --ready
```

## Quality Gates

All must pass before marking complete:
- [ ] All acceptance criteria verified
- [ ] Tests pass
- [ ] Lint/typecheck pass
- [ ] Reviewers ran and findings addressed
- [ ] Committed with task reference

## Notes

- If `<task-id>` not provided, check `dex list --in-progress` for current task
- Use `dex list --ready` to see unblocked tasks
