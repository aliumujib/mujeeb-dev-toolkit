#!/usr/bin/env bash
# Install mujeeb-dev-toolkit globally for OpenCode
#
# Creates symlinks from ~/.config/opencode to this repo so changes sync automatically.
#
# Usage:
#   ./install.sh          # Install (symlink)
#   ./install.sh --remove # Uninstall (remove symlinks)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_CONFIG="$HOME/.config/opencode"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[+]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[x]${NC} $*"; }

# Items to symlink: source -> target_name
declare -A SYMLINKS=(
    [".opencode/commands"]="commands"
    [".opencode/skills"]="skills"
    [".opencode/agents"]="agents"
    ["AGENTS.md"]="AGENTS.md"
)

# Check if running uninstall
if [[ "${1:-}" == "--remove" ]] || [[ "${1:-}" == "-r" ]] || [[ "${1:-}" == "uninstall" ]]; then
    echo "Uninstalling mujeeb-dev-toolkit..."
    echo ""
    
    for target_name in "${SYMLINKS[@]}"; do
        target="$GLOBAL_CONFIG/$target_name"
        if [[ -L "$target" ]]; then
            rm "$target"
            log_info "Removed symlink: $target"
        elif [[ -e "$target" ]]; then
            log_warn "Not a symlink, skipping: $target"
        fi
    done
    
    echo ""
    log_info "Uninstall complete!"
    exit 0
fi

# Install
echo "Installing mujeeb-dev-toolkit globally for OpenCode..."
echo ""
echo "Source: $SCRIPT_DIR"
echo "Target: $GLOBAL_CONFIG"
echo ""

# Ensure global config directory exists
mkdir -p "$GLOBAL_CONFIG"

# Create symlinks
for source_path in "${!SYMLINKS[@]}"; do
    target_name="${SYMLINKS[$source_path]}"
    source="$SCRIPT_DIR/$source_path"
    target="$GLOBAL_CONFIG/$target_name"
    
    if [[ ! -e "$source" ]]; then
        log_warn "Source not found, skipping: $source"
        continue
    fi
    
    # Handle existing target
    if [[ -L "$target" ]]; then
        # It's a symlink - check if it points to us
        existing_target=$(readlink "$target")
        if [[ "$existing_target" == "$source" ]]; then
            log_info "Already linked: $target_name"
            continue
        else
            log_warn "Replacing existing symlink: $target_name"
            rm "$target"
        fi
    elif [[ -e "$target" ]]; then
        # It's a real file/directory - back it up
        backup="${target}.backup.$(date +%s)"
        log_warn "Backing up existing: $target_name -> $(basename "$backup")"
        mv "$target" "$backup"
    fi
    
    # Create symlink
    ln -s "$source" "$target"
    log_info "Linked: $target_name"
done

echo ""
log_info "Installation complete!"
echo ""
echo "Available commands:"
for cmd in "$SCRIPT_DIR/.opencode/commands"/*.md; do
    [[ -f "$cmd" ]] && echo "  /$(basename "${cmd%.md}")"
done

echo ""
echo "Available skills:"
for skill in "$SCRIPT_DIR/.opencode/skills"/*/SKILL.md; do
    [[ -f "$skill" ]] && echo "  $(basename "$(dirname "$skill")")"
done

echo ""
echo "To uninstall: $0 --remove"
