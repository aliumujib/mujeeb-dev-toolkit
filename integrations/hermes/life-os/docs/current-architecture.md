# Life OS Current Architecture

## Current Truth

The intended Life OS stack is:

- a single Telegram bot as the interface
- Hermes gateway as the Telegram owner
- native Hermes `life-os` plugin for Life OS tools and callback behavior
- Hermes cron for scheduled jobs
- Notion as the source of truth

## Roles

### Hermes

- reasoning layer
- orchestration layer
- scheduled-job execution via cron
- native Life OS tools such as:
  - `life_os_get_context`
  - `life_os_create_task`
  - `life_os_extract_weekly_outcomes`
  - `life_os_run_job`
- Telegram callback handling through Hermes callback-hook support

### Notion

- source of truth for:
  - tasks
  - people and outreach history
  - habits and weekly health review
  - app reviews
  - weekly reset artifacts

### Telegram

- interaction surface only
- messages, reminders, and action cards
- button taps route into Hermes

## One Bot

There should be one Telegram bot for both:

- assistant chat
- planning interactions
- reminders and nudges
- button actions

## Native Plugin

The reusable plugin should live in:

- `plugin/hermes-life-os/`

## Source Of Truth Rule

Hermes is the reasoning and orchestration layer.
Notion remains the source of truth.

That means:

- Hermes should think and act
- Notion should store durable state
