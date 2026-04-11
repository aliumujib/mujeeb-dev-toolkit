#!/usr/bin/env bash

# Transcribes audio to text using whisper.cpp for the Mujeeb Dev Toolkit.
# Accepts either a local audio file or a URL (YouTube or other yt-dlp-supported sites).
# Local audio files are converted to MP3 via ffmpeg; URLs are downloaded and 
# extracted as MP3 via yt-dlp. In both cases, whisper-cli produces .txt and .vtt files.
# 
# Usage: ./transcribe.sh <audio-file-or-url>

set -euo pipefail

# --- CONFIG ---
# Update these paths to match your whisper.cpp installation
WHISPER_ROOT="${HOME}/github.com/ggerganov/whisper.cpp"
PGM="${WHISPER_ROOT}/build/bin/whisper-cli"
MODEL="${WHISPER_ROOT}/models/ggml-medium.en.bin"

# Fallback locations for common installations
if [[ ! -f "$PGM" ]]; then
    # Try common homebrew location
    if [[ -f "/opt/homebrew/bin/whisper" ]]; then
        PGM="/opt/homebrew/bin/whisper"
    elif [[ -f "/usr/local/bin/whisper" ]]; then
        PGM="/usr/local/bin/whisper"
    elif command -v whisper &> /dev/null; then
        PGM=$(command -v whisper)
    fi
fi

# Fallback model locations
if [[ ! -f "$MODEL" ]]; then
    # Try common model locations
    for model_path in \
        "${HOME}/.cache/whisper/ggml-medium.en.bin" \
        "/opt/homebrew/share/whisper/ggml-medium.en.bin" \
        "/usr/local/share/whisper/ggml-medium.en.bin" \
        "${WHISPER_ROOT}/models/ggml-medium.bin" \
        "${WHISPER_ROOT}/models/ggml-base.en.bin" \
        "${WHISPER_ROOT}/models/ggml-base.bin"; do
        
        if [[ -f "$model_path" ]]; then
            MODEL="$model_path"
            break
        fi
    done
fi

# --- DEPENDENCY CHECKS ---
check_dependencies() {
    local missing_deps=()
    
    if ! command -v ffmpeg &> /dev/null; then
        missing_deps+=("ffmpeg")
    fi
    
    if ! command -v yt-dlp &> /dev/null; then
        missing_deps+=("yt-dlp")
    fi
    
    if [[ ! -f "$PGM" ]]; then
        missing_deps+=("whisper.cpp")
    fi
    
    if [[ ! -f "$MODEL" ]]; then
        missing_deps+=("whisper model")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo "❌ Missing dependencies:" >&2
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep" >&2
        done
        echo "" >&2
        echo "Install missing dependencies:" >&2
        echo "  brew install ffmpeg yt-dlp" >&2
        echo "  # For whisper.cpp, see: https://github.com/ggerganov/whisper.cpp" >&2
        exit 1
    fi
    
    echo "✅ All dependencies found" >&2
}

# --- FUNCTIONS ---
convert_audio_to_mp3() {
    local RAW=$1
    local MP3="${RAW%.*}.mp3"

    if [[ -e "${MP3}" ]]; then
        echo "========================================" >&2
        echo "Audio file already exists: ${MP3}" >&2
        echo "========================================" >&2
        echo "" >&2
        echo "${MP3}"
        return
    fi

    echo "Converting ${RAW} to MP3..." >&2
    ffmpeg -i "${RAW}" -codec:a libmp3lame -q:a 0 "${MP3}" >&2
    echo "${MP3}"
}

download_and_extract_audio() {
    local URL=$1

    echo "Downloading and extracting audio from: ${URL}" >&2
    
    yt-dlp \
        --extractor-args "youtube:player-client=android" \
        --no-playlist \
        --restrict-filenames \
        -o "%(title).80s.%(ext)s" \
        --extract-audio \
        --audio-format mp3 \
        --audio-quality 0 \
        "$URL"
}

transcribe_audio() {
    local MP3=$1
    local BASENAME="${MP3%.mp3}"

    echo
    echo "================================================="
    echo "[$(date +"%Y%m%d.%H%M%S")] Transcribing: ${MP3}"
    echo "================================================="
    echo

    "${PGM}" \
        --output-txt \
        --output-vtt \
        --output-file "${BASENAME}" \
        --model "${MODEL}" \
        "${MP3}"

    # Remove empty lines from .vtt to reduce token usage during analysis
    if [[ -f "${BASENAME}.vtt" ]]; then
        # Use different sed syntax for different platforms
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' '/^$/d' "${BASENAME}.vtt"
        else
            # Linux
            sed -i '/^$/d' "${BASENAME}.vtt"
        fi
    fi

    echo "✅ Done: ${BASENAME}.txt and ${BASENAME}.vtt"
}

print_usage() {
    echo "Usage: $0 <audio-file-or-url>"
    echo
    echo "Examples:"
    echo "  $0 recording.m4a"
    echo "  $0 https://www.youtube.com/watch?v=VIDEO_ID"
    echo
    echo "Supported audio formats: m4a, mp3, wav, ogg, flac, aac, wma"
    echo "Supported URLs: YouTube and other yt-dlp supported sites"
}

# --- MAIN ---
if [[ $# -lt 1 ]]; then
    print_usage
    exit 1
fi

INPUT=$1

# Check dependencies first
check_dependencies

if [[ "$INPUT" == http://* || "$INPUT" == https://* ]]; then
    # URL input: download via yt-dlp, then transcribe
    if [[ "$INPUT" == *.mp3 ]]; then
        MP3="$INPUT"
    else
        download_and_extract_audio "$INPUT"
        # Find the most recently created mp3 file by yt-dlp
        MP3=$(find . -name "*.mp3" -type f -newermt "5 minutes ago" | head -1)
        
        if [[ -z "$MP3" ]]; then
            # Fallback: find the newest mp3 file
            MP3=$(ls -t *.mp3 2>/dev/null | head -1)
        fi
    fi

    if [[ -z "$MP3" || ! -e "$MP3" ]]; then
        echo "❌ Error: No MP3 file found after download."
        exit 1
    fi

    # Clean up filename if needed (remove extra dots)
    NEW_MP3=$(sed 's/\.\+\.mp3$/.mp3/' <<< "$MP3")

    if [[ "$MP3" != "$NEW_MP3" ]]; then
        mv -f "$MP3" "$NEW_MP3"
        MP3="$NEW_MP3"
    fi
else
    # Local file input: convert to MP3, then transcribe
    if [[ ! -e "${INPUT}" ]]; then
        echo "❌ File not found: ${INPUT}"
        exit 1
    fi

    MP3=$(convert_audio_to_mp3 "${INPUT}")
fi

if [[ ! -e "${MP3}" ]]; then
    echo "❌ Error: MP3 file not found: ${MP3}"
    exit 1
fi

transcribe_audio "$MP3"