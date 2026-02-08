# mujeeb-dev-toolkit

Personal collection of OpenCode tools, skills, commands, and plugins for iterative development workflows.

## Installation

### Option 1: npm (recommended)

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-mujeeb-toolkit"]
}
```

### Option 2: Git clone

Clone into your project's `.opencode` directory:

```bash
git clone https://github.com/aliumujib/mujeeb-dev-toolkit .opencode
```

Or clone globally:

```bash
git clone https://github.com/aliumujib/mujeeb-dev-toolkit ~/.config/opencode
```

## Commands (11)

### Loop Commands

| Command | Description |
|---------|-------------|
| `/prd` | Deep interview to build PRD for features (4 phases, Dex integration) |
| `/complete` | Run reviewers and mark Dex task complete |
| `/ut` | Unit test coverage (2 phases, Dex integration) |
| `/e2e` | Playwright E2E tests (2 phases, Dex integration) |

### Control Commands

| Command | Description |
|---------|-------------|
| `/cancel-prd` | Cancel active PRD loop |
| `/cancel-ut` | Cancel active unit test loop |
| `/cancel-e2e` | Cancel active E2E test loop |

### Help Commands

| Command | Description |
|---------|-------------|
| `/ut-help` | Explain the unit test loop technique |
| `/e2e-help` | Explain the E2E test loop technique |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/deslop` | Remove AI-generated code slop from branch |
| `/gwt` | Manage git worktrees using sibling directories |

## Agents (2)

| Agent | Description |
|-------|-------------|
| `prd-codebase-researcher` | Research codebase patterns for PRD development |
| `prd-external-researcher` | Research external best practices |

## Skills (9)

| Skill | Description |
|-------|-------------|
| `dex-workflow` | Task-based feature implementation with Dex |
| `prd-workflow` | PRD generation with 4-phase workflow |
| `unit-test-loop` | Unit test coverage with Dex tracking |
| `e2e-test-loop` | Playwright E2E tests with Dex tracking |
| `blog-post-writer` | Transform brain dumps into polished blog posts |
| `technical-svg-diagrams` | Generate clean, minimal SVG diagrams |
| `biome-gritql` | GritQL patterns for Biome linting |
| `gwt` | Git worktree management using sibling directories |
| `background-agents` | Patterns for parallel background agents |

## Plugins (3)

| Plugin | Purpose |
|--------|---------|
| `git-guard` | Blocks destructive git/shell commands |
| `session-start` | Records session info for loop state |
| `loop-controller` | Enforces phased workflows (PRD/UT/E2E loops) |

## Usage Examples

### PRD-based Development

```bash
/prd "add user authentication"
# Interview process generates spec with Implementation Stories
# Phase 4 creates Dex tasks automatically

# Work on tasks:
dex list --pending
/complete <task-id>
```

### Unit Test Coverage

```bash
/ut "improve coverage for auth module" --target 80%
# Phase 1: Coverage analysis, identify gaps
# Phase 2: Create Dex tasks for each gap

# Work on tasks:
dex list --pending
/complete <task-id>
```

### E2E Testing

```bash
/e2e "add checkout flow tests"
# Phase 1: Flow analysis, identify critical paths
# Phase 2: Create Dex tasks per flow

# Work on tasks:
dex list --pending
/complete <task-id>
```

## External Dependencies

Some features require external tools:

| Tool | Purpose | Install |
|------|---------|---------|
| **dex** | Task management CLI | `npm install -g @dcramer/dex` |
| **qmd** | Session memory search | `brew install qmd` or `cargo install qmd` |

### Session Memory (optional, requires qmd)

Once qmd is installed:

```bash
# Initialize qmd collection
qmd init -c claude-sessions ~/.opencode/qmd-sessions

# Sync sessions
./scripts/sync-sessions-to-qmd.sh

# Set up scheduled sync (optional)
./scripts/setup-scheduled-sync.sh
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS | Full | launchd for scheduling |
| Linux | Full | cron for scheduling |
| WSL | Full | cron (ensure `sudo service cron start`) |

## Configuration

The toolkit uses `opencode.json` for configuration. Key settings:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "permission": {
    "bash": {
      "git reset --hard*": "deny",
      "rm -rf*": "ask"
    }
  }
}
```

## Development

### Project Structure

```
.opencode/
├── commands/       # Slash commands (/prd, /ut, etc.)
├── skills/         # Reusable instruction sets
├── agents/         # Specialized AI helpers
├── plugins/        # Background automation (TS)
└── package.json    # Plugin dependencies

scripts/            # Shell scripts for setup
opencode.json       # Main config
AGENTS.md           # Always-loaded rules
```

### Contributing

1. Clone the repo
2. Make changes to `.opencode/` files
3. Test locally by using this as your project's `.opencode/` directory
4. Submit a PR

## License

MIT
