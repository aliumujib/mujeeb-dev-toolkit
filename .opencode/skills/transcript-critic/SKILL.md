---
name: transcript-critic
description: Transcribe and critically analyze audio/video content using whisper.cpp. Accepts VTT files, audio files, or URLs (YouTube/yt-dlp supported). Generates structured markdown analysis with timestamps, logical fallacies, and evidence categorization.
---

# Transcript Critic - Audio/Video Analysis Skill

Transcribe audio/video content and generate critical analysis with structured markdown summaries.

## When to Use

- When user provides audio/video files for transcription and analysis
- When user shares YouTube URLs or other video platform links for analysis
- When user has existing VTT transcript files that need critical analysis
- When user wants structured breakdown of spoken content with evidence categorization

## Prerequisites

This skill requires external tools to be installed:

| Tool | Purpose |
|------|---------|
| [whisper.cpp](https://github.com/ggerganov/whisper.cpp) | Local speech-to-text transcription |
| [ffmpeg](https://ffmpeg.org/) | Audio format conversion |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Download audio from YouTube/other sites |

## Installation

1. **Install whisper.cpp**:
   ```bash
   git clone https://github.com/ggerganov/whisper.cpp
   cd whisper.cpp
   make
   # Download a model (medium.en recommended)
   bash ./models/download-ggml-model.sh medium.en
   ```

2. **Install other dependencies**:
   ```bash
   # macOS
   brew install ffmpeg yt-dlp
   
   # Ubuntu/Debian
   sudo apt install ffmpeg python3-pip
   pip3 install yt-dlp
   ```

3. **Configure whisper.cpp paths** in the transcription script

## Usage

Use the `/transcript-critic` command with any of these inputs:

### Audio/Video Files
```
/transcript-critic recording.m4a
/transcript-critic interview.mp3
/transcript-critic podcast.wav
```

### URLs (YouTube and others)
```
/transcript-critic https://www.youtube.com/watch?v=VIDEO_ID
/transcript-critic https://platform.com/video/123
```

### Existing VTT Files
```
/transcript-critic transcript.vtt
```

## Analysis Features

The skill generates comprehensive structured analysis including:

### Core Sections
- **Overview**: 3-5 sentence thesis summary
- **Source Material**: Original file/URL with proper markdown formatting
- **Key Terms**: Important concepts with first-mention timestamps
- **Detailed Summary**: Section-by-section breakdown with timestamp ranges

### Critical Analysis
- **Evidentiary Notes**: Claims categorized by support type:
  - Anecdotal (personal experience)
  - Appeal to authority (citing others without sources)
  - Logical argument (reasoned case)
  - Cited source (verifiable references)

- **Logical Fallacies**: Identified reasoning errors:
  - Ad Hominem, Straw Man, False Dichotomy
  - Appeal to Emotion, Whataboutism
  - Slippery Slope, Hasty Generalization
  - And other standard fallacy types

- **Underdeveloped Areas**: Ambiguous points needing clarification

### Special Features
- **Scripture References**: For theological content
- **Timestamp Citations**: All observations anchored to specific moments
- **Neutral Tone**: Objective analysis without bias injection

## Workflow

### Input Detection
The skill automatically detects input type and processes accordingly:

1. **VTT Files**: Direct analysis (skip transcription)
2. **Audio Files**: Convert → Transcribe → Analyze  
3. **URLs**: Download → Convert → Transcribe → Analyze

### Transcription Process
For audio/video inputs:
- Local files converted to MP3 via ffmpeg
- URLs downloaded via yt-dlp 
- Audio transcribed to TXT and VTT via whisper.cpp
- Empty lines removed from VTT to optimize token usage

### Analysis Generation
- Read entire transcript before starting analysis
- Apply structured prompt template with timestamp requirements
- Generate markdown output with consistent formatting
- Save analysis as `.md` file alongside transcript

## Configuration

The skill needs paths configured for your whisper.cpp installation:

```bash
# Example configuration in transcribe.sh
WHISPER_ROOT="${HOME}/github.com/ggerganov/whisper.cpp"
PGM="${WHISPER_ROOT}/build/bin/whisper-cli" 
MODEL="${WHISPER_ROOT}/models/ggml-medium.en.bin"
```

## Output Format

Analysis files use consistent structure:

```markdown
# [Title] - Analysis

## Overview
Brief thesis summary

## Source Material
- **Source:** [formatted link or filename]

## Key Terms and Concepts
- **Term** `[HH:MM:SS]`: Definition

## Detailed Summary
### Section [HH:MM:SS--HH:MM:SS]
Content breakdown

## Evidentiary Notes  
- **Category** `[HH:MM:SS--HH:MM:SS]`: Claim analysis

## Logical Fallacies
- **Fallacy** `[HH:MM:SS--HH:MM:SS]`: Description

## Questions and Underdeveloped Areas
Identified gaps and ambiguities
```

## Advanced Features

### Multi-Platform Support
- YouTube (primary use case)
- Any site supported by yt-dlp ([full list](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md))
- Local audio files in any format supported by ffmpeg

### Audio Format Support
- **Input**: m4a, mp3, wav, ogg, flac, aac, wma, and more
- **Processing**: Automatic conversion to MP3 for transcription
- **Output**: Text, VTT, and structured markdown analysis

### File Management
- Automatic output filename generation
- Collision detection with overwrite/rename options
- Organized file placement alongside source materials

## Troubleshooting

### Common Issues

**"whisper.cpp not found"**
- Verify WHISPER_ROOT path in configuration
- Ensure whisper.cpp is compiled (`make` in whisper.cpp directory)
- Check PGM path points to correct binary location

**"Model not found"**
- Download model: `bash ./models/download-ggml-model.sh medium.en`
- Verify MODEL path in configuration
- Try different model size if needed (tiny, base, small, medium, large)

**"yt-dlp download failed"**
- Update yt-dlp: `pip3 install --upgrade yt-dlp`
- Check URL is valid and accessible
- Some sites may have rate limiting or restrictions

**"ffmpeg conversion failed"**
- Ensure ffmpeg is installed and accessible
- Check input file is not corrupted
- Try different audio format if available

### Performance Tips

- **Model Selection**: 
  - `tiny` - Fastest, lower accuracy
  - `medium.en` - Good balance for English content
  - `large` - Best accuracy, slower processing

- **Audio Quality**: Higher quality input produces better transcription accuracy
- **File Size**: Large files may take significant time to process

## Integration Notes

This skill adapts the original [transcript-critic](https://github.com/jftuga/transcript-critic) Claude Code skill for OpenCode compatibility, maintaining all core functionality while integrating with the Mujeeb Dev Toolkit workflow.

Key adaptations:
- OpenCode skill structure and frontmatter
- Integrated with toolkit's task management
- Compatible with toolkit's file organization patterns
- Leverages toolkit's git safety and commit workflows