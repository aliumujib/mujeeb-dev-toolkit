---
description: Manage git worktrees using sibling directories
agent: build
---

# Git Worktree Manager

Manage git worktrees as sibling directories to avoid Turbopack/IDE conflicts.

## Available Actions

- `new <branch>` - Create a new worktree as a sibling directory
- `ls` - List all worktrees for the current repository
- `go <branch>` - Output the path to switch to a worktree
- `rm <branch>` - Remove a worktree and its branch
- `here` - Show info about the current worktree

## Instructions

Parse the arguments: $ARGUMENTS

1. If no action specified, show `gwt ls` output and explain available commands

2. For `new`:
   - Run `./scripts/gwt new <branch>`
   - Report the created path
   - Remind user to run `bun install` after switching

3. For `ls`:
   - Run `./scripts/gwt ls --json` for parsing
   - Format output nicely for user

4. For `go`:
   - Run `./scripts/gwt go <branch>` to get path
   - Output a `cd` command the user can copy

5. For `rm`:
   - Confirm with user before removing
   - Run `./scripts/gwt rm <branch>`
   - Report success

6. For `here`:
   - Run `./scripts/gwt here`
   - Show current worktree information

## Notes

- Worktrees are created as sibling directories (not nested in `.worktrees/`)
- This avoids Turbopack/IDE conflicts with multiple lockfiles
- .env files are automatically copied from main repo

## Success Criteria

- [ ] Worktree created/listed/removed successfully
- [ ] User informed of next steps (e.g., `bun install`, `cd` command)
- [ ] Confirmation obtained before destructive operations
