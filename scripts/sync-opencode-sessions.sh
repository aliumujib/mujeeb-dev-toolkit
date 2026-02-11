#!/usr/bin/env bash
# sync-opencode-sessions.sh - Sync OpenCode sessions to qmd-indexable markdown
#
# Usage:
#   ./sync-opencode-sessions.sh [--full]
#
# Modes:
#   (default)  Incremental - skip sessions where markdown is newer than source
#   --full     Rebuild all session markdown files

set -euo pipefail

OUTPUT_DIR="$HOME/.opencode/qmd-sessions"
METADATA_FILE="$OUTPUT_DIR/.sync-metadata.json"

# Parse arguments
MODE="incremental"

while [[ $# -gt 0 ]]; do
  case $1 in
    --full)
      MODE="full"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Load metadata
load_metadata() {
  if [[ -f "$METADATA_FILE" ]]; then
    cat "$METADATA_FILE"
  else
    echo "{}"
  fi
}

# Save metadata
save_metadata() {
  local metadata="$1"
  echo "$metadata" > "$METADATA_FILE"
}

# Convert timestamp to readable date
timestamp_to_date() {
  local ms="$1"
  # Convert milliseconds to seconds
  local seconds=$((ms / 1000))
  date -r "$seconds" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || date -d "@$seconds" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "unknown"
}

# Escape a value for YAML
yaml_escape() {
  local val="$1"
  case "$val" in
    *:*|*\#*|*\[*|*\]*|*\{*|*\}*|*,*|*\&*|*\**|*\!*|*\|*|*\'*|*\"*|*%*|*@*|-*|\>*)
      local escaped="${val//\\/\\\\}"
      escaped="${escaped//\"/\\\"}"
      escaped="${escaped//$'\n'/\\n}"
      escaped="${escaped//$'\r'/\\r}"
      printf '"%s"' "$escaped"
      ;;
    *)
      printf '%s' "$val"
      ;;
  esac
}

# Extract text from message parts
extract_text_from_parts() {
  local parts_json="$1"
  echo "$parts_json" | jq -r '.parts[] | select(.type == "text" or .type == "reasoning") | .text // empty' 2>/dev/null | \
    awk '
      /^\[/ { next }
      /^</ { next }
      /^The user is saying/ { next }
      /^I should/ { next }
      { if (++count <= 30) print substr($0,1,500) }
    '
}

# Extract tool uses from message parts
extract_tool_uses() {
  local parts_json="$1"
  echo "$parts_json" | jq -r '
    .parts[] |
    select(.type == "tool_use" and .name != null) |
    "- \(.name): \(.input.file_path // .input.command // empty)"
  ' 2>/dev/null | awk '/: $/ { next } NF { if (++count <= 10) print }'
}

# Generate markdown for a single session
generate_session_markdown() {
  local session_id="$1"
  local export_json="$2"

  # Parse session info
  local title slug project_id directory created updated
  title=$(echo "$export_json" | jq -r '.info.title // "Untitled Session"')
  slug=$(echo "$export_json" | jq -r '.info.slug // "unknown"')
  project_id=$(echo "$export_json" | jq -r '.info.projectID // "unknown"')
  directory=$(echo "$export_json" | jq -r '.info.directory // "unknown"')
  created=$(echo "$export_json" | jq -r '.info.time.created // "0"')
  updated=$(echo "$export_json" | jq -r '.info.time.updated // "0"')

  local created_date updated_date
  created_date=$(timestamp_to_date "$created")
  updated_date=$(timestamp_to_date "$updated")

  local message_count
  message_count=$(echo "$export_json" | jq -r '.messages | length')

  # Generate filename from session ID
  local output_file="$OUTPUT_DIR/${session_id}.md"

  # Check if we should skip (incremental mode)
  if [[ "$MODE" == "incremental" && -f "$output_file" ]]; then
    local md_mtime updated_seconds
    md_mtime=$(stat -f %m "$output_file" 2>/dev/null || stat -c %Y "$output_file" 2>/dev/null || echo "0")
    updated_seconds=$((updated / 1000))
    if [[ "$md_mtime" -ge "$updated_seconds" ]]; then
      return 0  # Skip - markdown is newer
    fi
  fi

  # Extract user prompts (use -c for compact single-line JSON)
  local user_prompts
  user_prompts=$(echo "$export_json" | jq -c '.messages[] | select(.info.role == "user") | {parts: .parts}' | while read -r msg; do
    extract_text_from_parts "$msg"
  done | awk 'NF { if (++count <= 20) print }' || echo "")

  # Extract assistant insights
  local assistant_insights
  assistant_insights=$(echo "$export_json" | jq -c '.messages[] | select(.info.role == "assistant") | {parts: .parts}' | while read -r msg; do
    extract_text_from_parts "$msg"
  done | awk 'NF { if (++count <= 20) print }' || echo "")

  # Extract tool uses
  local tool_uses
  tool_uses=$(echo "$export_json" | jq -c '.messages[] | select(.info.role == "assistant") | {parts: .parts}' | while read -r msg; do
    extract_tool_uses "$msg"
  done | awk 'NF { if (++count <= 15) print }' || echo "")

  # Format values for YAML
  local yaml_title yaml_project yaml_directory
  yaml_title=$(yaml_escape "$title")
  yaml_project=$(yaml_escape "$project_id")
  yaml_directory=$(yaml_escape "$directory")

  # Generate markdown
  cat > "$output_file" << EOF
---
session_id: $session_id
slug: $slug
project_id: $yaml_project
directory: $yaml_directory
created: $created_date
updated: $updated_date
messages: $message_count
---

# $yaml_title

## Session Info
- **Project:** $project_id
- **Directory:** $directory
- **Created:** $created_date
- **Updated:** $updated_date
- **Messages:** $message_count

EOF

  # Add user prompts
  if [[ -n "$user_prompts" ]]; then
    echo "## Conversation Highlights" >> "$output_file"
    echo "$user_prompts" >> "$output_file"
    echo "" >> "$output_file"
  fi

  # Add assistant insights
  if [[ -n "$assistant_insights" ]]; then
    echo "## Key Insights" >> "$output_file"
    echo "$assistant_insights" >> "$output_file"
    echo "" >> "$output_file"
  fi

  # Add tool uses
  if [[ -n "$tool_uses" ]]; then
    echo "## Key Actions" >> "$output_file"
    echo "$tool_uses" >> "$output_file"
  fi

  echo "  ✓ $session_id: $title"
}

# Project directories to scan for sessions
# Add your project paths here
PROJECT_DIRS=(
  "$HOME"
  "$HOME/Desktop/Android-Projects/mclaren-fanapp-android"
  "$HOME/Desktop/Anna/anna-android"
  "$HOME/Desktop/Android-Projects/amjb_apps/focus-modes"
  "$HOME/Desktop/Android-Projects/amjb_apps/lawnchair"
  "$HOME/Desktop/Android-Projects/amjb_apps/lessscreen"
  "$HOME/Desktop/Android-Projects/amjb_apps/memory"
  "$HOME/Desktop/Android-Projects/amjb_apps/WidgetsPro"
  "$HOME/Desktop/Android-Projects/amjb_apps/mujeeb-dev-toolkit"
)

# Sync sessions from a single project directory
sync_project_sessions() {
  local project_dir="$1"
  local project_total=0
  local project_processed=0

  # Get project name for display
  local project_name
  project_name=$(basename "$project_dir")
  [[ "$project_dir" == "$HOME" ]] && project_name="global"

  # Get all session IDs from this project
  local session_ids
  session_ids=$(cd "$project_dir" && opencode session list -n 1000 2>&1 | tail -n +3 | awk '{print $1}')

  if [[ -z "$session_ids" ]]; then
    echo "[$project_name] No sessions found"
    return 0
  fi

  echo "[$project_name] Syncing..."

  # Process each session
  while IFS= read -r session_id; do
    [[ -z "$session_id" ]] && continue

    ((project_total++)) || true

    # Skip if already exists (incremental mode)
    if [[ "$MODE" == "incremental" && -f "$OUTPUT_DIR/${session_id}.md" ]]; then
      ((project_processed++)) || true
      continue
    fi

    # Export session to temp file (piping truncates at 128KB)
    local tmp_file="/tmp/opencode_export_$$.json"
    if (cd "$project_dir" && opencode export "$session_id") > "$tmp_file" 2>/dev/null; then
      # Strip "Exporting session: xxx" prefix from JSON
      sed -i '' 's/^Exporting session: [^{]*//' "$tmp_file" 2>/dev/null || sed -i 's/^Exporting session: [^{]*//' "$tmp_file"
      local export_json
      export_json=$(cat "$tmp_file")
      rm -f "$tmp_file"
      if generate_session_markdown "$session_id" "$export_json"; then
        ((project_processed++)) || true
      fi
    else
      rm -f "$tmp_file"
      echo "  ✗ Failed: $session_id"
    fi
  done <<< "$session_ids"

  echo "[$project_name] $project_processed/$project_total synced"
}

# Main sync logic
main() {
  echo "Syncing OpenCode sessions to qmd..."
  echo "Mode: $MODE"
  echo ""

  # Process each project directory
  for project_dir in "${PROJECT_DIRS[@]}"; do
    if [[ -d "$project_dir" ]]; then
      sync_project_sessions "$project_dir"
    fi
  done

  # Count total synced
  local processed
  processed=$(ls -1 "$OUTPUT_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')

  echo ""
  echo "Done: $processed sessions in $OUTPUT_DIR"

  # Update qmd index
  echo ""
  echo "Updating qmd index..."
  if command -v qmd &>/dev/null; then
    qmd update 2>&1 | grep -v "^$" || true
    echo "✓ qmd index updated"
  fi
}

main
