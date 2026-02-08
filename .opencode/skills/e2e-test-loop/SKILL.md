---
name: e2e-test-loop
description: Use for browser tests, Playwright tests, end-to-end testing, or testing user flows. Covers the E2E test loop workflow, Playwright patterns, page objects, and selector strategies.
---

# E2E Test Loop - Browser Automation Testing

**Current branch:** !`git branch --show-current 2>/dev/null || echo "not in git repo"`

The E2E test loop uses a 2-phase workflow with task tracking for
browser test development.

## The 2-Phase Approach

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Flow Analysis | Identify critical user flows |
| 2 | Task Handoff | Create tasks per flow using todowrite |

After Phase 2, use `/complete` for each E2E test task.

## Starting the Loop

```bash
/e2e "Cover checkout flow"            # Basic
/e2e "Test auth and settings flows"   # Multiple flows
```

## Phase 1: Flow Analysis

1. Analyze application routes, features, user journeys
2. Identify critical flows needing E2E coverage
3. Prioritize 3-7 test tasks

Focus on:
- Happy paths users depend on
- Payment/auth/data submission flows
- Flows that broke in production

**Output:** `<phase_complete phase="1"/>`

## Phase 2: Task Handoff

Use `todowrite` to create tasks for each critical flow:

```json
{
  "todos": [
    {"id": "e2e-1", "content": "E2E: checkout flow - Browse→Cart→Checkout→Confirmation", "status": "pending", "priority": "high"},
    {"id": "e2e-2", "content": "E2E: auth flow - Login, logout, session persistence", "status": "pending", "priority": "high"},
    {"id": "e2e-3", "content": "E2E: settings flow - Profile update, password change", "status": "pending", "priority": "medium"}
  ]
}
```

**Output:** `<phase_complete phase="2"/>` or `<promise>E2E SETUP COMPLETE</promise>`

## Working on Tasks

Use the todo system + /complete workflow:

1. **View tasks** - Use `todoread` or see them in the TUI
2. **Start task** - Update status to `in_progress` with `todowrite`
3. **Write test** - Create page object + test file
4. **Complete** - Use `/complete` to run reviewers and commit
5. **Mark done** - Update status to `completed` with `todowrite`

## File Naming Convention

```
e2e/
├── checkout.e2e.page.ts    # Page object (locators, setup, actions)
├── checkout.e2e.ts         # Test file (concise tests)
├── auth.e2e.page.ts
└── auth.e2e.ts
```

## Playwright Patterns

### Locator Priority (Semantic First)

| Priority | Locator | Example |
|----------|---------|---------|
| 1 | `getByRole` | `page.getByRole('button', { name: 'Submit' })` |
| 2 | `getByLabel` | `page.getByLabel('Email address')` |
| 3 | `getByText` | `page.getByText('Welcome back')` |
| 4 | `getByTestId` | `page.getByTestId('submit-btn')` - last resort |

### Page Object Pattern

```typescript
// checkout.e2e.page.ts
export class CheckoutPage {
  constructor(private page: Page) {}

  // Locators
  readonly emailInput = this.page.getByLabel('Email')
  readonly submitButton = this.page.getByRole('button', { name: 'Complete' })

  // Actions
  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async submit() {
    await this.submitButton.click()
  }
}
```

```typescript
// checkout.e2e.ts
test('user can complete checkout', async ({ page }) => {
  const checkout = new CheckoutPage(page)
  await checkout.fillEmail('user@example.com')
  await checkout.submit()
  await expect(page.getByText('Order confirmed')).toBeVisible()
})
```

### Waiting Patterns

```typescript
// Auto-waiting (built into actions)
await page.getByRole('button').click()  // Waits until clickable

// Explicit wait for state
await expect(page.getByText('Loaded')).toBeVisible()

// Wait for network
await page.waitForResponse('**/api/data')
```

## Quality Standards

- **ONE test per task** - Focused, reviewable commits
- **Test user-visible behavior** - Not implementation details
- **Tests must be independent** - No shared state between tests
- **Use page objects** - Keep test files concise

## Command Reference

```bash
/e2e "prompt"             # Start flow analysis
/cancel-e2e               # Cancel loop
/complete <task-id>       # Complete task with reviewers
```

## Related

- `/complete` - Run reviewers, commit, mark task complete
- `todoread` - View pending tasks
- `todowrite` - Update task status
