---
name: open-pr
description: Open a pull request using the project's PR template and guidelines. Discovers CI validation steps and runs them before opening.
---

# Open PR Skill

Create pull requests that follow project conventions by reading PR templates, README docs, and contribution guidelines. Discovers and runs CI validations before opening.

## When to Use

- User asks to open/create a PR
- User wants to submit changes for review
- After completing a feature or fix

## Workflow

### Phase 1: Find PR Template (Extensive Search)

Search for PR templates in ALL these locations (check every single one):

**GitHub standard locations:**
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/pull_request_template.md`
- `.github/PULL_REQUEST_TEMPLATE/default.md`
- `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`
- `.github/pull_request_template/default.md`
- `.github/pull_request_template/pull_request_template.md`

**Root directory locations:**
- `PULL_REQUEST_TEMPLATE.md`
- `pull_request_template.md`
- `PULL_REQUEST_TEMPLATE`
- `pull_request_template`

**Docs directory locations:**
- `docs/PULL_REQUEST_TEMPLATE.md`
- `docs/pull_request_template.md`
- `docs/.github/PULL_REQUEST_TEMPLATE.md`

**Alternative extensions:**
- `.github/PULL_REQUEST_TEMPLATE.txt`
- `.github/PULL_REQUEST_TEMPLATE`
- `PULL_REQUEST_TEMPLATE.txt`

**Named templates (for monorepos/multi-type PRs):**
- `.github/PULL_REQUEST_TEMPLATE/*.md` (list all and use `default.md` or first found)

**Use glob to search:**
```bash
# Run this to find any PR template variations
find . -maxdepth 4 -type f \( -iname "*pull_request_template*" -o -iname "*pr_template*" \) 2>/dev/null
```

### Phase 2: Find Contribution Guidelines

Look for contribution context in:
- `CONTRIBUTING.md`
- `.github/CONTRIBUTING.md`
- `docs/CONTRIBUTING.md`
- `docs/contributing.md`
- `README.md` (scan for "Contributing", "Pull Request", "PR" sections)
- `.github/README.md`
- `DEVELOPMENT.md`
- `docs/DEVELOPMENT.md`

### Phase 3: Discover CI Validation Steps

**CRITICAL: Before opening a PR, discover what validations the CI will run.**

Search for CI configuration in these locations:

**GitHub Actions:**
- `.github/workflows/*.yml`
- `.github/workflows/*.yaml`

**Other CI systems:**
- `.circleci/config.yml`
- `.travis.yml`
- `Jenkinsfile`
- `azure-pipelines.yml`
- `.gitlab-ci.yml`
- `bitbucket-pipelines.yml`
- `.buildkite/pipeline.yml`

**For each CI config found, extract:**
1. Job/step names
2. Commands being run (especially on `pull_request` trigger)
3. Required checks (look for `required` or status check names)

**Common validation patterns to look for:**
```yaml
# Look for these patterns in CI files:
- npm test / yarn test / pnpm test / bun test
- npm run lint / eslint / biome / prettier --check
- npm run build / tsc / bun build
- npm run typecheck / tsc --noEmit
- cargo test / cargo clippy / cargo fmt --check
- go test / golangci-lint
- pytest / ruff / black --check / mypy
- ./gradlew test / ./gradlew lint
- swift test / swiftlint
- make test / make lint / make check
```

**Also check package.json for scripts:**
```bash
# Extract test/lint/build scripts
cat package.json | jq '.scripts | to_entries | .[] | select(.key | test("test|lint|check|build|typecheck|validate|ci")) | "\(.key): \(.value)"'
```

### Phase 4: Run Validations & Report

**Before opening the PR, run discovered validations and report results to user.**

Present findings in this format:

```
## CI Validation Discovery

Found CI config: .github/workflows/ci.yml

### Validations that will run on PR:

| Check | Command | Status |
|-------|---------|--------|
| Lint | `npm run lint` | ⏳ Running... |
| Tests | `npm test` | ⏳ Running... |
| Build | `npm run build` | ⏳ Running... |
| Types | `npm run typecheck` | ⏳ Running... |

### Running validations locally...
```

Then run each validation and update status:
- ✅ Passed
- ❌ Failed (show error summary)
- ⚠️ Skipped (command not found)

**If any validation fails:**
```
## ❌ Validation Failed

The following checks failed:

### Lint (`npm run lint`)
```
[error output]
```

**Would you like me to:**
1. Fix these issues and retry
2. Open PR anyway (not recommended)
3. Cancel
```

**If all validations pass:**
```
## ✅ All Validations Passed

| Check | Command | Status |
|-------|---------|--------|
| Lint | `npm run lint` | ✅ Passed |
| Tests | `npm test` | ✅ Passed (42 tests) |
| Build | `npm run build` | ✅ Passed |
| Types | `npm run typecheck` | ✅ Passed |

Ready to open PR. Proceeding...
```

### Phase 5: Analyze Branch State

```bash
# Get branch info
git branch --show-current

# Get base branch (usually main or master)
git remote show origin | grep 'HEAD branch' | cut -d' ' -f5

# Get commit history since diverging from base
git log main..HEAD --oneline

# Check if branch is pushed
git status

# Get diff stats
git diff main --stat
```

### Phase 6: Prepare PR Content

1. **Title**: Generate a concise title based on commits
   - Use conventional commit format if project uses it
   - Keep under 72 characters
   - Be descriptive but brief

2. **Description**: Write exactly 3 lines maximum
   - Summarize the change's purpose (why, not what)
   - Do NOT include specific file names
   - Do NOT include implementation details
   - Focus on user/developer impact

3. **Template handling**: CRITICAL RULES
   - **KEEP all checkboxes** (`- [ ]`) exactly as they are
   - **KEEP all section headers** unchanged
   - **KEEP all selection options** (e.g., type of change lists)
   - **ONLY fill in** the title and description/summary section
   - If template has a "Description" or "Summary" section, put your 3-line description there
   - Leave everything else for the author to complete manually

### Phase 7: Create PR

Use `gh pr create` with a HEREDOC for the body:

```bash
gh pr create --title "Your title here" --body "$(cat <<'EOF'
## Summary

Brief 3-line description here.
Line 2 of description.
Line 3 of description.

<!-- Everything below is from the template - preserved exactly -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] I have tested my changes
- [ ] I have updated documentation
- [ ] My code follows the project style

EOF
)"
```

## Validation Commands Quick Reference

**JavaScript/TypeScript:**
```bash
npm test && npm run lint && npm run build && npm run typecheck
# or
yarn test && yarn lint && yarn build && yarn typecheck
# or
pnpm test && pnpm lint && pnpm build && pnpm typecheck
# or
bun test && bun run lint && bun run build
```

**Python:**
```bash
pytest && ruff check . && mypy . && black --check .
```

**Rust:**
```bash
cargo test && cargo clippy -- -D warnings && cargo fmt --check
```

**Go:**
```bash
go test ./... && golangci-lint run
```

**Android/Kotlin:**
```bash
./gradlew test && ./gradlew lint && ./gradlew build
```

**iOS/Swift:**
```bash
swift test && swiftlint
```

## Example Output

Given a template like:
```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
- [ ] Unit tests added
- [ ] E2E tests added
```

The skill produces:
```markdown
## Description
Add user authentication flow to protect dashboard routes.
Implements session management with secure cookie handling.
Improves security posture for multi-tenant deployments.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
- [ ] Unit tests added
- [ ] E2E tests added
```

## Rules

1. **Always run validations first** - Never open a PR with failing checks
2. **Never remove template sections** - Keep everything from the template
3. **Never check boxes** - Leave all checkboxes unchecked for the author
4. **Never select options** - If template has radio-style options, don't select any
5. **Description is 3 lines max** - Be concise
6. **No file names in description** - Describe what/why, not which files
7. **Preserve formatting** - Keep template's markdown structure intact
8. **Use HEREDOC** - Always use `cat <<'EOF'` for multi-line body to preserve formatting
9. **Report validation results** - Always show user what passed/failed before proceeding

## No Template Fallback

If no PR template exists, use this minimal structure:

```markdown
## Summary

[3-line description]

## Changes

- [bullet point summary of main changes - no file names]
```

## No CI Config Fallback

If no CI configuration is found, check for common validation commands:

```bash
# Check package.json for scripts
if [ -f package.json ]; then
  # Try common script names
  npm run test --if-present
  npm run lint --if-present
  npm run build --if-present
  npm run typecheck --if-present
fi

# Check for Makefile
if [ -f Makefile ]; then
  make test || true
  make lint || true
fi

# Check for common config files that imply tooling
[ -f .eslintrc* ] && npx eslint . --max-warnings=0
[ -f biome.json ] && npx biome check .
[ -f pyrpoject.toml ] && (pytest || ruff check .)
[ -f Cargo.toml ] && cargo test && cargo clippy
```

## Commands Reference

```bash
# Check current branch and commits
git log main..HEAD --oneline
git diff main --stat

# Find PR templates
find . -maxdepth 4 -type f -iname "*pull_request*template*" 2>/dev/null

# Find CI configs
find . -maxdepth 3 -type f \( -name "*.yml" -o -name "*.yaml" \) -path "*/.github/workflows/*" 2>/dev/null
ls -la .github/workflows/ 2>/dev/null

# Create PR (draft mode recommended)
gh pr create --title "title" --body "body" --draft

# Create PR targeting specific base branch
gh pr create --title "title" --body "body" --base develop
```
