---
name: prd-workflow
description: Use when planning features, creating PRDs, interviewing about requirements, defining stories, writing specs, or breaking down features into tasks. Covers the PRD interview process, spec structure, story atomization, and 4-phase workflow from idea to tracked tasks.
---

# PRD Workflow - Feature Planning

**Current branch:** !`git branch --show-current 2>/dev/null || echo "not in git repo"`
**Existing plans:** !`ls plans/ 2>/dev/null | head -5 || echo "none"`

The PRD (Product Requirements Document) workflow transforms ideas into atomic,
implementable stories through structured interview, research, and specification.

## When to Use PRD Workflow

- Starting a new feature from scratch
- Turning a vague idea into concrete tasks
- Need thorough requirements gathering
- Want AI-assisted research and review

## The 4-Phase Approach

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Input Classification | Identify feature name and type |
| 2 | Interview + Exploration | Gather requirements, then run research/expert agents |
| 3 | Spec Write | Create specification with Implementation Stories section |
| 4 | Task Handoff | Create tasks from stories using todowrite |

**Key Change:** Research and expert agents run after interview completes (blocking). Findings are reviewed before spec writing.

## Starting the Workflow

```bash
/prd "Add user authentication"           # From idea
/prd path/to/existing/code               # From codebase
/prd                                     # Interactive discovery
```

## Phase 2: Interview + Exploration

**Commitment:** "I will ask 8-10+ questions covering: core problem, success criteria, MVP scope, technical constraints, UX flows, edge cases, error states, and tradeoffs."

### Interview (8-10+ questions)

Cover these areas:
- Core problem, success criteria, MVP scope
- Technical systems, data models, existing patterns
- UX/UI flows, error states, edge cases
- Tradeoffs, compromises, priorities

Focus on **non-obvious** details that will bite during implementation.

### After Interview, Run Agents (blocking)

Spawn ALL agents in parallel (user waits ~2-3 min):

**Research Agents:**
- `prd-codebase-researcher` - Existing patterns, files to modify
- `git-history-analyzer` - Prior attempts, why patterns evolved
- `prd-external-researcher` - Best practices, code examples

**Expert Agents:**
- `architecture-strategist` - System design concerns
- `security-sentinel` - Auth, data exposure risks
- `spec-flow-analyzer` - User journeys, missing flows
- `pattern-recognition-specialist` - Codebase consistency

### Review Findings

Summarize key findings. Ask clarifying questions if gaps revealed.

## Phase 3: Spec Structure

Write to `plans/<feature>/spec.md` with this structure:

```markdown
# <Feature> Specification

## Overview
## Problem Statement
## Success Criteria
## User Stories
## Detailed Requirements
## Technical Design
## Edge Cases & Error Handling
## Open Questions
## Out of Scope

## Implementation Stories

### Story 1: <Title>
**Category:** functional|ui|integration|edge-case|performance
**Skills:** <skill-name>, <skill-name>
**Blocked by:** none
**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

## Research Findings
## Expert Review Findings
```

## Story Atomization Rules

**Commitment:** "Each story will have ≤7 acceptance criteria, touch ≤3 files, be independently testable, and have no 'and' in title."

Each story must be completable in ONE task (~15-30 min):

- **Max 7 acceptance criteria** - If more, split the story
- **Max 3 files touched** - If more, consider splitting
- **No "and" in title** - "User can X and Y" = two stories
- **Independently testable** - Can verify in isolation
- **Cleanly revertible** - Can undo without cascade

## Phase 4: Task Handoff

Use OpenCode's native `todowrite` to create tasks from the spec's Implementation Stories:

1. **Parse stories from spec** - Read each story from the Implementation Stories section
2. **Create todos** - Use `todowrite` to create a task for each story with:
   - `id`: Unique identifier (e.g., `story-1`, `story-2`)
   - `content`: Story title and key acceptance criteria
   - `status`: `pending`
   - `priority`: Based on blocked-by relationships (`high` for unblocked, `medium` for blocked)

Example todowrite call:
```json
{
  "todos": [
    {"id": "story-1", "content": "Setup auth middleware - AC: JWT validation, route protection", "status": "pending", "priority": "high"},
    {"id": "story-2", "content": "Login endpoint - AC: email/password, token response", "status": "pending", "priority": "high"},
    {"id": "story-3", "content": "Password reset flow - AC: email trigger, reset link", "status": "pending", "priority": "medium"}
  ]
}
```

3. **Confirm with user** - Show the created tasks and ask if ready to start

## After PRD Completion

Work through tasks using the todo system:

1. **View tasks** - Use `todoread` or see them in the TUI
2. **Start a task** - Mark as `in_progress` with `todowrite`
3. **Complete work** - Use `/complete` to run reviewers and commit
4. **Mark done** - Update status to `completed` with `todowrite`

## Command Reference

```bash
/prd "feature description"     # Start from idea
/prd path/to/code             # Start from codebase
/cancel-prd                   # Cancel in-progress PRD
```

## Related Commands

- `/complete` - Run reviewers, commit, mark task complete
- `todoread` - View current tasks
- `todowrite` - Update task status
