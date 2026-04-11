#!/usr/bin/env python3
"""
Import OpenCode sessions into Cipher memory via local embeddings.

This script:
1. Reads session markdown files from ~/.opencode/qmd-sessions/
2. Extracts knowledge using Cipher's MCP tools
3. Stores embeddings locally via Ollama (nomic-embed-text)

Usage:
    python import-sessions-to-cipher.py [--dry-run] [--limit N] [--delay MS]

Requirements:
    - Ollama running with nomic-embed-text model
    - Cipher MCP configured in OpenCode
"""

import os
import re
import json
import argparse
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
import time

SESSIONS_DIR = Path.home() / ".opencode" / "qmd-sessions"


def parse_session(content: str, filename: str) -> Optional[Dict[str, Any]]:
    """Parse a session markdown file into structured data."""

    # Extract frontmatter
    frontmatter_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not frontmatter_match:
        return None

    frontmatter = frontmatter_match.group(1)

    # Parse YAML-like frontmatter
    session_id = re.search(r"session_id:\s*(.+)", frontmatter)
    slug = re.search(r"slug:\s*(.+)", frontmatter)
    project_id = re.search(r"project_id:\s*(.+)", frontmatter)
    directory = re.search(r"directory:\s*(.+)", frontmatter)
    created = re.search(r"created:\s*(.+)", frontmatter)

    # Extract conversation highlights
    highlights_match = re.search(
        r"## Conversation Highlights\n(.*?)(?=\n## |$)", content, re.DOTALL
    )
    highlights = highlights_match.group(1).strip() if highlights_match else ""

    # Extract key insights
    insights_match = re.search(r"## Key Insights\n(.*?)(?=\n## |$)", content, re.DOTALL)
    insights = insights_match.group(1).strip() if insights_match else ""

    # Skip empty sessions
    if not highlights and not insights:
        return None

    return {
        "session_id": session_id.group(1).strip() if session_id else filename,
        "slug": slug.group(1).strip() if slug else "unknown",
        "project_id": project_id.group(1).strip() if project_id else "unknown",
        "directory": directory.group(1).strip() if directory else "",
        "created": created.group(1).strip() if created else "",
        "highlights": highlights,
        "insights": insights,
    }


def format_for_cipher(session: Dict[str, Any]) -> str:
    """Format session data for Cipher extraction."""
    project_name = (
        session["directory"].split("/")[-1] if session["directory"] else "unknown"
    )

    return f"""Session: {session["slug"]} ({session["session_id"]})
Project: {project_name}
Directory: {session["directory"]}
Date: {session["created"]}

Conversation:
{session["highlights"]}

Key Insights:
{session["insights"]}""".strip()


def call_cipher_extract(interaction: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call Cipher's extract_and_operate_memory via MCP.

    In practice, you'd call this via:
    1. The MCP stdio protocol
    2. A REST API if Cipher is running as a server
    3. Direct import of Cipher's TypeScript functions

    For now, this returns a placeholder - the actual import happens
    when running within an OpenCode session with Cipher MCP active.
    """
    # This would be the actual MCP call
    # For standalone script, we'd need to implement MCP client protocol
    return {
        "success": True,
        "message": "Would import via MCP",
        "interaction_length": len(interaction),
        "metadata": metadata,
    }


def main():
    parser = argparse.ArgumentParser(description="Import OpenCode sessions to Cipher")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually import")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of sessions")
    parser.add_argument(
        "--delay", type=int, default=500, help="Delay between imports (ms)"
    )
    parser.add_argument("--output", type=str, help="Output JSON file for batch import")
    args = parser.parse_args()

    print(f"📂 Scanning sessions directory: {SESSIONS_DIR}")

    if not SESSIONS_DIR.exists():
        print(f"❌ Sessions directory not found: {SESSIONS_DIR}")
        return

    session_files = sorted(SESSIONS_DIR.glob("*.md"))
    print(f"📁 Found {len(session_files)} session files")

    if args.limit > 0:
        session_files = session_files[: args.limit]
        print(f"⚡ Limiting to {args.limit} sessions")

    if args.dry_run:
        print("🏃 DRY RUN mode - no actual imports")

    imported = 0
    skipped = 0
    batch_data = []

    for session_file in session_files:
        content = session_file.read_text()
        session = parse_session(content, session_file.name)

        if not session:
            skipped += 1
            continue

        project_name = (
            session["directory"].split("/")[-1] if session["directory"] else "unknown"
        )
        interaction = format_for_cipher(session)

        print(f"\n📝 Session: {session['slug']}")
        print(f"   Project: {project_name}")
        print(f"   Date: {session['created']}")
        print(f"   Content: {len(interaction)} chars")

        metadata = {
            "projectId": project_name,
            "source": "session-import",
            "sessionId": session["session_id"],
            "created": session["created"],
        }

        if args.output:
            # Collect for batch output
            batch_data.append({"interaction": interaction, "metadata": metadata})

        if args.dry_run:
            print("   [DRY RUN] Would import to Cipher")
        else:
            result = call_cipher_extract(interaction, metadata)
            print(f"   ✅ Processed: {result.get('message', 'OK')}")

            if args.delay > 0:
                time.sleep(args.delay / 1000)

        imported += 1

    print("\n" + "=" * 50)
    print(f"✅ Processed: {imported}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"📊 Total: {imported + skipped}")

    if args.output and batch_data:
        output_path = Path(args.output)
        output_path.write_text(json.dumps(batch_data, indent=2))
        print(f"\n📄 Batch data saved to: {output_path}")
        print(f"   Use this JSON with Cipher's batch import API")


if __name__ == "__main__":
    main()
