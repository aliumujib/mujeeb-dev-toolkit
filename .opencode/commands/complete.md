---
description: Run reviewers, commit, and mark task complete
agent: build
---

# Complete Task Workflow

This command runs the standard review workflow and marks a task complete.

## Usage

```
/complete [task-description]
```

## Workflow

1. **Check current task** - Use `todoread` to see in-progress task

2. **Run reviewers in parallel** (use @mentions to invoke subagents):

```
@general Review this code for simplification opportunities
@explore Check for any security or performance issues
```

3. **Address ALL findings** from reviewers

4. **Run quality checks**:
```bash
# Run tests
npm test  # or appropriate test command

# Run lint/typecheck
npm run lint && npm run typecheck  # adjust for project
```

5. **Commit** with descriptive message:
```bash
git add -A
git commit -m "feat(<scope>): <what changed>"
```

**Commit message should include verification:**
- Good: "feat(auth): add login endpoint - 24 tests passing"
- Bad: "fix stuff" or "made changes"

6. **Mark task complete** using `todowrite`:
```json
{
  "todos": [
    {"id": "<task-id>", "content": "<task>", "status": "completed", "priority": "high"}
  ]
}
```

7. **Show remaining tasks** - Use `todoread` to see what's next

## Quality Gates

All must pass before marking complete:
- [ ] All acceptance criteria verified
- [ ] Tests pass
- [ ] Lint/typecheck pass
- [ ] Reviewers ran and findings addressed
- [ ] Changes committed

## Notes

- Use `todoread` to see current tasks and their status
- One task at a time - complete current before starting next
