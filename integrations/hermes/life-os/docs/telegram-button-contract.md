# Life OS Telegram Button Contract

## Goal

Define the Telegram callback payloads and the Notion state changes behind them.

## Payload Format

Use compact versioned callback data:

```text
v1:<scope>:<action>:<target>
```

Where:

- `scope` = entity type
- `action` = verb
- `target` = compact Notion page ID without hyphens

## Scope Codes

- `t` = task
- `h` = health or habit action
- `m` = message-only action

## Task Action Codes

- `d` = done
- `lt` = later today
- `tm` = tomorrow
- `tw` = this week

Examples:

- `v1:t:d:TASK_ID_32`
- `v1:t:lt:TASK_ID_32`
- `v1:t:tm:TASK_ID_32`
- `v1:t:tw:TASK_ID_32`

## Health Action Codes

- `wd` = water done

Example:

- `v1:h:wd:DAY_ID_32`

## Notion Updates

### Task Done

- mark task `Done = true`
- if linked to People:
  - update `Last Touched`
  - update `Last Called` when the mode was `Call`
  - update `Next Touch Due` for family if applicable

### Later Today

- move due time later today

### Tomorrow

- move due date to tomorrow

### This Week

- move due date to a later point in the current week

### Water Done

- mark the relevant daily habit item done

## Telegram Message Editing

After action:

- acknowledge callback immediately
- edit the message so the action is visible
- remove or neutralize buttons when appropriate

Example edited result:

```text
✅ Done

Task title
Updated in Notion.
```

## Ownership Rule

Only one process may own Telegram updates for the bot.

Intended owner:

- Hermes gateway
