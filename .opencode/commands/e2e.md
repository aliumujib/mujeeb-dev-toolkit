---
description: E2E test coverage with Playwright and Dex tracking
agent: build
---

# E2E Test Loop

Execute the setup script to initialize:

```bash
!`./scripts/setup-e2e-loop.sh $ARGUMENTS`
```

You are now in a 2-phase E2E test workflow.

---

## Structured Output Control Flow

| Phase | Name | Required Marker | Next Phase |
|-------|------|-----------------|------------|
| 1 | Flow Analysis | `<phase_complete phase="1"/>` | 2 |
| 2 | Dex Handoff | `<phase_complete phase="2"/>` | done |

---

## Phase 1: Flow Analysis

1. Analyze application routes, features, user journeys
2. Identify critical flows needing E2E coverage
3. Prioritize 3-7 test tasks

Focus on:
- Happy paths users depend on
- Payment/auth/data submission flows
- Flows that broke in production

**Output:** `<phase_complete phase="1"/>`

---

## Phase 2: Dex Handoff

Create Dex epic, then tasks for each flow:

```bash
# Create epic
dex create "E2E Test Coverage" --description "Critical user flow coverage"

# For each flow
dex create "E2E: checkout flow" --parent <epic-id> --description "
Flow: Browse -> Cart -> Checkout -> Confirmation

Steps:
1. Add product to cart
2. Proceed to checkout
3. Fill payment form
4. Complete purchase

Files:
- e2e/checkout.e2e.page.ts
- e2e/checkout.e2e.ts

Acceptance:
- [ ] Page object with semantic locators
- [ ] Test covers happy path
"
```

**Output:** `<phase_complete phase="2"/>` or `<promise>E2E SETUP COMPLETE</promise>`

---

## File Naming Convention

```
e2e/
├── checkout.e2e.page.ts    # Page object (locators, setup, actions)
├── checkout.e2e.ts         # Test file (concise tests)
├── auth.e2e.page.ts
└── auth.e2e.ts
```

---

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

  readonly emailInput = this.page.getByLabel('Email')
  readonly submitButton = this.page.getByRole('button', { name: 'Complete' })

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async submit() {
    await this.submitButton.click()
  }
}
```

---

## Cancellation

To cancel: `/cancel-e2e` or `rm .opencode/e2e-loop-*.local.md`
