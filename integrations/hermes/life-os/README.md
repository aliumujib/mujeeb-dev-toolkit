# Life OS Toolkit Export

This folder is a sanitized export bundle intended for moving the Life OS work
into `mujeeb-dev-toolkit`.

What has been stripped out:

- NAS hostnames, IPs, and paths
- family and friendship names
- live Notion database IDs and page IDs
- live Telegram bot usernames
- any local browser snapshot artifacts

What is still represented here:

- current architecture
- Telegram interaction model
- Telegram button contract
- plugin manifest
- env/config contract for a reusable installation

This export is intentionally generic.

Use it as the clean base for copying into `mujeeb-dev-toolkit`, then wire the
real IDs and tokens through environment variables or project config.

## Do Not Copy

Do not copy these from the current repo into the toolkit:

- `.playwright-mcp/`
- any repo-local browser snapshots
- any live `.env` files
- any docs that still contain real people names or real Notion IDs

## Required Configuration

See:

- `plugin/hermes-life-os/settings.example.env`

## Suggested Move Order

1. Copy `toolkit-ready/life-os/plugin/hermes-life-os/`
2. Copy `toolkit-ready/life-os/docs/`
3. Add real environment variables in the target repo or deployment
4. Reconnect the plugin to the target Telegram and Notion instance
