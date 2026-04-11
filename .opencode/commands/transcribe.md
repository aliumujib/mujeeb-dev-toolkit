---
description: Transcribe and analyze audio/video content with critical analysis
agent: transcript-critic
---

# /transcribe

Transcribe audio/video files or URLs and generate structured critical analysis.

## Usage

```bash
/transcribe <file-or-url>
```

### Examples

**Audio/Video Files:**
```bash
/transcribe recording.m4a
/transcribe interview.mp3 
/transcribe podcast.wav
```

**URLs (YouTube and others):**
```bash
/transcribe https://www.youtube.com/watch?v=VIDEO_ID
/transcribe https://platform.com/video/123
```

**Existing VTT Files:**
```bash
/transcribe transcript.vtt
```

## What it does

1. **Auto-detects input type** (VTT file, audio file, or URL)
2. **Transcribes if needed** using whisper.cpp via local transcription script
3. **Generates structured analysis** with:
   - Overview and key terms with timestamps
   - Detailed section-by-section summary
   - Evidence categorization (anecdotal, cited sources, etc.)
   - Logical fallacy identification
   - Underdeveloped areas that need clarification

## Requirements

This command requires external tools:
- **whisper.cpp** - for transcription
- **ffmpeg** - for audio conversion
- **yt-dlp** - for downloading from URLs

See the transcript-critic skill documentation for installation details.

## Output

Creates a `.md` analysis file alongside the transcript with comprehensive structured analysis including timestamped citations and critical evaluation of arguments.