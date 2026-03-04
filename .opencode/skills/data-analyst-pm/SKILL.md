---
name: data-analyst-pm
description: "Analyze product metrics, revenue data, and conversion funnels to evaluate business viability. Use for paid UA analysis, monetization strategy, funnel optimization, and data-driven product decisions. Connects to dashboards (RevenueCat, Play Console, PostHog, etc.) via playwriter."
---

# Data Analyst PM - Product Metrics Analysis

**Use this skill when:**
- Evaluating paid user acquisition viability
- Analyzing conversion funnels and drop-offs
- Reviewing monetization strategy and pricing
- Making data-driven product decisions
- Synthesizing metrics from multiple dashboards

**Do not use when:**
- Need code implementation (use dev skills)
- Pure UX/design feedback (no data involved)
- General project planning (use prd-workflow)

---

## The Analysis Workflow

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Context Gathering | Understand business goal and collect dashboard links |
| 2 | Data Collection | Navigate dashboards via playwriter, extract metrics |
| 3 | Funnel Analysis | Identify conversion steps and drop-off points |
| 4 | Signal Synthesis | Identify positive/negative signals, calculate unit economics |
| 5 | Recommendations | Prioritized actions with expected impact |
| 6 | Documentation | Write findings to docs/product/ |

---

## Phase 1: Context Gathering

### Opening Questions

**Commitment:** "I will ask 5-8 questions to understand your business context before diving into data."

Start with these essential questions:

```markdown
1. **What's the business question you're trying to answer?**
   Examples: "Is paid UA viable?", "Why is conversion dropping?", "Should I raise prices?"

2. **What's your monetization model?**
   - [ ] Subscription (monthly/annual)
   - [ ] One-time purchase
   - [ ] Freemium with IAP
   - [ ] Ad-supported
   - [ ] Hybrid

3. **What dashboards do you have access to?** (provide URLs)
   - Revenue: RevenueCat, Stripe, App Store Connect, Play Console
   - Analytics: PostHog, Mixpanel, Amplitude, Firebase
   - Ads: Google Ads, Apple Search Ads, Facebook Ads
   - Store: App Store Connect, Google Play Console

4. **What's your current stage?**
   - [ ] Pre-launch (projections only)
   - [ ] Early (< 1,000 users)
   - [ ] Growing (1,000 - 10,000 users)
   - [ ] Scaling (10,000+ users)

5. **What time period should I analyze?**
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - All-time
   - Custom range

6. **What's your target market/geography?**
   - Primary countries for revenue
   - Countries you're acquiring from

7. **Do you have a free trial? What's the trial length?**

8. **What's your current pricing?**
   - Monthly price
   - Annual price
   - Any lifetime deals
```

### Dashboard Link Collection

Request links in this format:

```markdown
## Dashboard Links

| Platform | URL | What to Extract |
|----------|-----|-----------------|
| RevenueCat | https://app.revenuecat.com/projects/xxx | MRR, subscribers, revenue |
| Play Console | https://play.google.com/console/... | Installs, ratings, store conversion |
| PostHog | https://app.posthog.com/project/xxx | Funnels, retention, events |
| Google Ads | (if running) | CPI, spend, ROAS |
```

---

## Phase 2: Data Collection

### Using Playwriter for Dashboard Access

**Load the playwriter skill first:**
```
Load skill: playwriter
```

**Navigation Pattern:**
1. Create a new session: `playwriter session new`
2. Navigate to dashboard URL
3. Wait for page load
4. Take snapshots to understand page structure
5. Extract key metrics via DOM or screenshots
6. Move to next dashboard

### Key Metrics to Extract

#### Revenue Dashboard (RevenueCat/Stripe)

| Metric | Why It Matters |
|--------|---------------|
| MRR | Current recurring revenue |
| Active Subscriptions | Paying user count |
| All-time Revenue | Total historical revenue |
| New Customers (28d) | Acquisition rate |
| Churn Rate | Retention health |
| ARPU | Revenue per user |
| Trial Conversion | Trial effectiveness |

#### Store Dashboard (Play Console/App Store Connect)

| Metric | Why It Matters |
|--------|---------------|
| Installs/Downloads | Top of funnel volume |
| First Opens | Actual activation |
| Store Conversion | Listing effectiveness |
| Ratings & Reviews | Product quality signal |
| Crash Rate | Technical health |
| Geographic Mix | Traffic quality |
| Revenue by SKU | Product mix |

#### Analytics Dashboard (PostHog/Mixpanel)

| Metric | Why It Matters |
|--------|---------------|
| DAU/MAU | Engagement/stickiness |
| Retention (D1/D7/D30) | User quality |
| Funnel Conversion | Drop-off identification |
| Feature Usage | Value delivery |
| Session Duration | Engagement depth |
| Event Counts | Behavior patterns |

---

## Phase 3: Funnel Analysis

### Standard Funnel Steps

Build funnels appropriate to the business model:

**Subscription App Funnel:**
```
Install → First Open → Onboarding Complete → Paywall View → Trial Start → Purchase
```

**Freemium App Funnel:**
```
Install → First Open → Core Action → Limit Hit → Upgrade Prompt → Purchase
```

**E-commerce Funnel:**
```
Visit → Browse → Add to Cart → Checkout Start → Purchase
```

### Probing Questions for Funnel Analysis

Ask PostHog AI or analyze data to answer:

1. **What % of users reach each funnel step?**
2. **Where's the biggest drop-off?**
3. **What's the conversion time between steps?**
4. **Are there differences by cohort/segment?**
5. **Has conversion changed over time?**

### Funnel Health Benchmarks

| Transition | Poor | Average | Good | Excellent |
|------------|------|---------|------|-----------|
| Install → First Open | <50% | 50-70% | 70-85% | >85% |
| First Open → Onboarding | <30% | 30-50% | 50-70% | >70% |
| Onboarding → Paywall | <20% | 20-40% | 40-60% | >60% |
| Paywall → Trial | <10% | 10-20% | 20-35% | >35% |
| Trial → Purchase | <20% | 20-40% | 40-60% | >60% |
| Paywall → Direct Purchase | <2% | 2-5% | 5-10% | >10% |

---

## Phase 4: Signal Synthesis

### Positive Signals Checklist

Look for these indicators of product-market fit:

- [ ] High app store rating (4.5+)
- [ ] Strong D7/D30 retention (>30% / >20%)
- [ ] Good paywall conversion (>5%)
- [ ] Fast time-to-purchase (<5 min)
- [ ] High DAU/MAU stickiness (>25%)
- [ ] Organic growth present
- [ ] Low churn rate (<5% monthly)
- [ ] Strong trial conversion (>40%)

### Negative Signals Checklist

Watch for these warning signs:

- [ ] Declining organic installs
- [ ] High early funnel drop-off (>50% before paywall)
- [ ] Low geographic quality (high % from low-LTV countries)
- [ ] Poor retention (D7 <20%)
- [ ] Long time-to-value
- [ ] Missing analytics events
- [ ] Price sensitivity indicators
- [ ] High refund rate (>5%)

### Unit Economics Calculation

**LTV Estimation:**
```
Simple LTV = Total Revenue / Total Installs

Better LTV = (ARPU × Avg Subscription Length) × Trial Conversion × Paywall View Rate

For subscriptions:
Monthly LTV = Monthly Price × (1 / Monthly Churn Rate)
```

**Paid UA Viability:**
```
Target CPI < LTV × 0.7 (30% margin minimum)

US CPI benchmark: $2-5 for apps
Tier 2 (UK/AU/CA): $1-3
Tier 3 (India/Brazil): $0.30-1.00
```

**Break-even Analysis:**
```
Required LTV for US paid UA = CPI / 0.7 = $2.85 - $7.14
```

---

## Phase 5: Recommendations Framework

### Prioritization Matrix

Categorize recommendations by impact and effort:

| Priority | Impact | Effort | Examples |
|----------|--------|--------|----------|
| P0 - Now | High | Low | Fix tracking, raise prices |
| P1 - Soon | High | Medium | Optimize paywall timing |
| P2 - Next | Medium | Medium | A/B test pricing |
| P3 - Later | Medium | High | New monetization model |

### Standard Recommendation Categories

**Quick Wins (Week 1):**
- Fix missing analytics events
- Adjust pricing
- Change paywall trigger timing

**Short-term (Week 2-4):**
- A/B test paywall variants
- Implement trial if missing
- Geographic targeting changes

**Medium-term (Month 2-3):**
- Funnel optimization based on data
- New feature gating strategy
- Pricing tier experiments

**Prerequisites for Paid UA:**
- [ ] LTV exceeds target CPI
- [ ] Funnel instrumented end-to-end
- [ ] Geographic targeting strategy ready
- [ ] Budget and ROAS targets defined

---

## Phase 6: Documentation

### Output Structure

Write findings to `docs/product/` with this structure:

```markdown
# [Analysis Type] - [App Name]

**Date:** YYYY-MM-DD
**Author:** Data Analyst PM
**Status:** Complete

---

## Executive Summary
- Key finding 1
- Key finding 2
- Verdict/recommendation

## Data Sources
| Platform | URL | Data Extracted |

## Key Metrics
### Revenue Metrics
### Funnel Metrics
### Engagement Metrics

## Funnel Analysis
### Current Funnel
### Drop-off Analysis
### Benchmarks Comparison

## Signal Assessment
### Positive Signals
### Concerning Signals

## Unit Economics
### Current State
### Path to Profitability

## Recommendations
### Immediate (P0)
### Short-term (P1)
### Medium-term (P2)

## Appendix
### Raw Data
### Methodology Notes
```

---

## Analysis Templates

### Paid UA Viability Analysis

**Key Question:** "Can I profitably acquire users through paid ads?"

**Required Data:**
- All-time revenue and installs
- Funnel conversion rates
- Geographic distribution
- Current pricing

**Analysis Steps:**
1. Calculate current LTV per install
2. Compare to benchmark CPIs by geography
3. Identify funnel leaks reducing LTV
4. Model LTV improvement scenarios
5. Define prerequisites for profitable UA

**Output:** Verdict (viable/not yet/never) with specific actions

### Pricing Analysis

**Key Question:** "Is my pricing optimal?"

**Required Data:**
- Current pricing tiers
- Conversion rate by price point
- Competitor pricing
- Geographic revenue mix

**Analysis Steps:**
1. Benchmark against category competitors
2. Analyze price sensitivity from A/B tests or cohorts
3. Calculate revenue impact of price changes
4. Consider geographic pricing strategy

**Output:** Recommended pricing with expected revenue impact

### Funnel Optimization Analysis

**Key Question:** "Where am I losing users and revenue?"

**Required Data:**
- Full funnel event data
- Conversion rates by step
- Time between steps
- Segment breakdowns

**Analysis Steps:**
1. Map complete user funnel
2. Identify largest drop-offs
3. Compare to benchmarks
4. Analyze timing patterns
5. Segment by user attributes

**Output:** Prioritized list of funnel fixes with expected impact

---

## Probing Questions Library

### For Understanding the Problem

- "What would success look like for this analysis?"
- "What decisions will this inform?"
- "Have you tried paid UA before? What happened?"
- "What's your budget/timeline for changes?"

### For Revenue Understanding

- "What % of revenue is from which pricing tier?"
- "Do you have lifetime/one-time purchase options?"
- "What's your refund rate?"
- "Any seasonal patterns in revenue?"

### For Funnel Understanding

- "Where do you think users are dropping off?"
- "Have you changed the onboarding recently?"
- "Is the paywall shown to everyone? When?"
- "Do you have a free trial? How long?"

### For Strategic Direction

- "What's your growth target?"
- "Are you focused on revenue or user growth?"
- "What's your runway/financial situation?"
- "Who are your main competitors and how do they monetize?"

---

## Tool Integration

### Playwriter Commands

```bash
# Start session
playwriter session new

# Navigate to dashboard
playwriter -s 1 -e 'state.page = context.pages().find(p => p.url() === "about:blank") ?? await context.newPage(); await state.page.goto("https://app.revenuecat.com/...", { waitUntil: "domcontentloaded" })'

# Take snapshot
playwriter -s 1 -e 'await snapshot({ page: state.page }).then(console.log)'

# Screenshot for visual data
playwriter -s 1 -e 'await state.page.screenshot({ path: "/tmp/dashboard.jpg", scale: "css" })'
```

### PostHog AI Queries

When connected to PostHog, ask these questions:
- "Show me a funnel from [event1] → [event2] → [event3] for all time"
- "What are the distinct values for [property] in [event]?"
- "What's my DAU/MAU ratio for the last 90 days?"
- "Show retention cohorts for users who [action]"

---

## Command Reference

```bash
/analyze-metrics              # Start full analysis workflow
/analyze-ua                   # Paid UA viability analysis
/analyze-funnel               # Funnel optimization analysis
/analyze-pricing              # Pricing analysis
```

## Related Skills

- `prd-workflow` - For turning insights into feature specs
- `playwriter` - For dashboard navigation
- `unit-test-loop` - For validating analytics implementation
