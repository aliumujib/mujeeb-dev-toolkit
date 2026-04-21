# Life OS Telegram Interaction Design

## Goal

Design a Telegram-based interaction model for Life OS that feels natural in chat
and updates Notion as the source of truth.

Use:

- scheduled messages
- inline buttons
- callback actions
- direct Notion updates

## Core Decision

Use a single Telegram bot for both:

- assistant chat
- Life OS reminders and task interaction

Hermes gateway should own Telegram updates for that bot.

## Primary Message Types

1. Morning briefing
2. Start-now nudge
3. End-of-day review
4. Quick reminders

## Morning Briefing

Purpose:

- show what matters today in one clean message

Shape:

```text
Morning, here is what matters today:

🧠 Work
⬜ Task A
⬜ Task B

🎯 Personal App
⬜ Task C

❤️ Outreach
⬜ Task D
```

Buttons:

- `✅ Got it`
- `🔗 Open Notion`

## Start-Now Nudge

Purpose:

- prompt the user when it is time to begin something

Buttons:

- `✅ Starting`
- `⏰ Later today`
- `➡️ Tomorrow`
- `🔗 Open`

## End-Of-Day Review

Purpose:

- ask whether important tasks actually got done

Buttons:

- `✅ Yes`
- `⏰ Later today`
- `➡️ Tomorrow`
- `📅 This week`
- `🔗 Open`

## Quick Reminders

Example water reminder:

```text
💧 Have you drank water?

🥤 Drink some water now.
```

Buttons:

- `✅ Drank water`
- `🔗 Open habits`

## Weekly Planning

The weekly flow should feel like:

1. brain dump
2. candidate weekly outcomes
3. focused follow-up questions
4. real tasks created in Notion only after agreement

The user should not have to front-load everything perfectly.

Hermes should ask for clarification where needed.
