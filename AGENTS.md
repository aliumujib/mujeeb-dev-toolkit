# Mujeeb Dev Toolkit

A personal collection of OpenCode tools, skills, commands, and plugins for iterative development workflows.

## Overview

This toolkit provides:
- **Iterative loop workflows** - PRD generation, unit test coverage, E2E test planning
- **Session memory** - Context injection from past sessions via qmd
- **Git safety** - Blocks destructive git commands
- **Task management** - Integration with Dex CLI for task tracking
- **Code quality** - Deslop tool to remove AI-generated code cruft

## Key Workflows

### PRD-Based Development (`/prd`)
A 4-phase workflow for generating comprehensive Product Requirement Documents:
1. Input classification
2. Interview + parallel research agents
3. Spec writing to `plans/<feature>/spec.md`
4. Dex task handoff

### Unit Test Loop (`/ut`)
2-phase workflow for test coverage improvement:
1. Coverage analysis and gap identification
2. Dex task creation for each gap

### E2E Test Loop (`/e2e`)
2-phase workflow for end-to-end test planning:
1. Flow analysis and critical path identification
2. Dex task creation per flow

### Task Completion (`/complete`)
Runs code reviewers, addresses findings, commits with task reference, marks Dex task complete.

## External Dependencies

Some features require external tools:
- **qmd** - Session memory search (`brew install qmd` or `cargo install qmd`)
- **dex** - Task management CLI (`npm install -g @dcramer/dex`)

## Conventions

- Specs go in `plans/<feature>/spec.md`
- Loop state files: `.opencode/{prd,ut,e2e}-loop-*.local.md`
- Atomic commits per task
- All tests/lint/types must pass before completing tasks

## Code Quality Standards

- Production quality always
- Pre-commit reviews required (code-simplifier)
- Verify work with tests before marking complete
- Result must include concrete verification, not vague claims
