---
name: open-pr
description: Open a pull request using the project's PR template and guidelines. Fills in title and description only, preserves all template sections and checkboxes.
---

# Open PR Skill

Create pull requests that follow project conventions by reading PR templates, README docs, and contribution guidelines.

## When to Use

- User asks to open/create a PR
- User wants to submit changes for review
- After completing a feature or fix

## Workflow

### Phase 1: Gather Context

1. **Find PR template** - Search for template in these locations (in order):
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/PULL_REQUEST_TEMPLATE/default.md`
   - `.github/pull_request_template.md`
   - `docs/PULL_REQUEST_TEMPLATE.md`
   - `PULL_REQUEST_TEMPLATE.md`

2. **Find contribution guidelines** - Look for:
   - `CONTRIBUTING.md`
   - `.github/CONTRIBUTING.md`
   - `docs/CONTRIBUTING.md`
   - `README.md` (for any PR/contribution sections)

3. **Analyze current branch state**:
   ```bash
   # Get branch info
   git branch --show-current
   
   # Get commit history since diverging from base
   git log main..HEAD --oneline
   
   # Check if branch is pushed
   git status
   ```

### Phase 2: Prepare PR Content

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

### Phase 3: Create PR

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

1. **Never remove template sections** - Keep everything from the template
2. **Never check boxes** - Leave all checkboxes unchecked for the author
3. **Never select options** - If template has radio-style options, don't select any
4. **Description is 3 lines max** - Be concise
5. **No file names in description** - Describe what/why, not which files
6. **Preserve formatting** - Keep template's markdown structure intact
7. **Use HEREDOC** - Always use `cat <<'EOF'` for multi-line body to preserve formatting

## No Template Fallback

If no PR template exists, use this minimal structure:

```markdown
## Summary

[3-line description]

## Changes

- [bullet point summary of main changes - no file names]
```

## Commands Reference

```bash
# Check current branch and commits
git log main..HEAD --oneline
git diff main --stat

# Create PR (draft mode recommended)
gh pr create --title "title" --body "body" --draft

# Create PR targeting specific base branch
gh pr create --title "title" --body "body" --base develop
```
