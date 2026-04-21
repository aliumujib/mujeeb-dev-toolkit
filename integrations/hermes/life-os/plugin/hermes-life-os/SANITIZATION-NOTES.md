# Sanitization Notes

This export intentionally removes instance-specific data.

Redacted or parameterized:

- Notion database IDs
- Notion page IDs
- accountability row IDs
- Telegram bot usernames
- family names
- friendship names
- local NAS paths and hostnames

If you want to move the full live implementation into another repo, use this
folder as the clean base and then wire the real values back in through env or
deployment config.
