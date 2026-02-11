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

## Plugins (4)

| Plugin | Purpose |
|--------|---------|
| `git-guard` | Blocks destructive git/shell commands |
| `session-start` | Records session info for loop state |
| `session-context-inject` | Injects relevant past session context via qmd |
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
qmd init -c opencode-sessions ~/.opencode/qmd-sessions

# Sync sessions
./scripts/sync-opencode-sessions.sh

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
  "plugin": [".opencode/plugins/index.ts"],
  "permission": {
    "bash": {
      "git reset --hard*": "deny",
      "rm -rf*": "ask"
    }
  }
}
```

## Setup

### Enabling Plugins (Git Guard, Session Injection, etc.)

Plugins must be explicitly registered in your `opencode.json`. Add the `plugin` array:

```json
{
  "plugin": [".opencode/plugins/index.ts"]
}
```

This enables:
- **Git Guard** - Blocks destructive commands like `git reset --hard`, `git push --force`, `rm -rf`
- **Session Context Injection** - Queries past sessions for relevant context (requires qmd)
- **Loop Controller** - Enforces phased workflows for PRD/UT/E2E commands

### Session Memory Setup (Optional)

Session memory allows OpenCode to recall relevant context from past conversations. This requires the `qmd` tool.

**Step 1: Install qmd**

```bash
# macOS
brew install qmd

# Or via Cargo
cargo install qmd
```

**Step 2: Initialize the sessions collection**

```bash
qmd init -c opencode-sessions ~/.opencode/qmd-sessions
```

**Step 3: Sync existing sessions**

```bash
./scripts/sync-opencode-sessions.sh
```

**Step 4: (Optional) Set up scheduled sync**

This automatically syncs new sessions periodically:

```bash
./scripts/setup-scheduled-sync.sh
```

Once configured, the `session-context-inject` plugin will automatically query past sessions for relevant context when you start new conversations.

### Global Installation

To use the toolkit across all projects, create symlinks in `~/.config/opencode/`:

```bash
# Create config directory if needed
mkdir -p ~/.config/opencode

# Symlink components
ln -s /path/to/mujeeb-dev-toolkit/.opencode/commands ~/.config/opencode/commands
ln -s /path/to/mujeeb-dev-toolkit/.opencode/skills ~/.config/opencode/skills
ln -s /path/to/mujeeb-dev-toolkit/.opencode/agents ~/.config/opencode/agents
ln -s /path/to/mujeeb-dev-toolkit/.opencode/plugins ~/.config/opencode/plugins

# Copy or symlink config files
cp /path/to/mujeeb-dev-toolkit/opencode.json ~/.config/opencode/opencode.json
cp /path/to/mujeeb-dev-toolkit/AGENTS.md ~/.config/opencode/AGENTS.md
```

### Troubleshooting

**Git Guard not blocking commands?**
- Ensure `"plugin": [".opencode/plugins/index.ts"]` is in your `opencode.json`
- Check that the `.opencode/plugins/` directory exists

**Session injection not working?**
1. Verify qmd is installed: `command -v qmd`
2. Check sessions directory exists: `ls ~/.opencode/qmd-sessions`
3. Run sync script: `./scripts/sync-opencode-sessions.sh`
4. Ensure plugin is registered in `opencode.json`

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
