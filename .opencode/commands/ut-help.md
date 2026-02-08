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

## Phase 2: Task Handoff

The agent:
1. Creates todos for each test to write using `todowrite`
2. Each task includes file path, current coverage, and behaviors to test

## After Setup

You work through tasks one at a time:
1. View tasks with `todoread`
2. Mark task as in_progress with `todowrite`
3. Write the test
4. Run `/complete` to review, commit, mark done

## Key Principles

- **ONE test per task** - Focused commits
- **User-facing behavior** - Test what users depend on
- **Quality over quantity** - One great test beats ten shallow ones

## Commands

- `/ut "improve auth coverage"` - Start the loop
- `/cancel-ut` - Cancel if needed
- `/complete <task-id>` - Finish a task with review
