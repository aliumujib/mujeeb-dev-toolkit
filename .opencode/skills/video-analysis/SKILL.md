---
name: video-analysis
description: Analyze video files by extracting frames and understanding content. Use when analyzing videos, understanding video content, or extracting frames from video files. Supports ffmpeg and opencv for frame extraction.
---

# Video Analysis - Frame Extraction and Understanding

**Working directory:** !`pwd`

Analyze video files by extracting frames at a specified rate and examining each frame to understand the video content.

## Prerequisites

This skill requires either `ffmpeg` or OpenCV (`cv2` via Python) for frame extraction. The skill will detect which is available and use it, or help you install one if neither is present.

## The 3-Phase Approach

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Setup & Detection | Detect tools, get video info, configure extraction |
| 2 | Frame Extraction | Extract frames to gitignored directory |
| 3 | Analysis | Analyze each frame and summarize video content |

## Starting the Workflow

```bash
/analyze-video /path/to/video.mp4                    # Basic analysis
/analyze-video /path/to/video.mp4 --fps 1            # 1 frame per second
/analyze-video /path/to/video.mp4 --fps 0.5          # 1 frame every 2 seconds
/analyze-video "video.mp4" "focus on UI transitions"  # With analysis hint
```

---

## Phase 1: Setup & Detection

### 1.1 Check Available Tools

Detect which video processing tool is available:

```bash
# Check for ffmpeg
which ffmpeg && ffmpeg -version | head -1

# Check for opencv (Python)
python3 -c "import cv2; print(f'OpenCV {cv2.__version__}')" 2>/dev/null
```

### 1.2 Tool Comparison (If Neither Installed)

If neither tool is found, present this comparison to the user:

```markdown
## Video Processing Tool Required

Neither ffmpeg nor OpenCV is installed. Please choose one to install:

### Option A: ffmpeg (Recommended for most users)

**Pros:**
- Industry standard, extremely reliable
- Fast and efficient frame extraction
- No Python dependencies required
- Excellent codec support
- Simple command-line interface

**Cons:**
- Larger installation size (~80-150MB)
- Requires admin/sudo for system install

**Install:**
- macOS: `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt install ffmpeg`
- Windows: `winget install ffmpeg` or download from ffmpeg.org

---

### Option B: OpenCV (Python)

**Pros:**
- Pure Python, easy pip install
- Useful if you already use Python for image work
- More programmatic control over extraction
- Smaller footprint if Python already installed

**Cons:**
- Requires Python 3 environment
- Slower than ffmpeg for simple extraction
- Can have codec compatibility issues
- numpy dependency

**Install:**
- All platforms: `pip install opencv-python`
- Or with uv: `uv pip install opencv-python`
```

Ask user to choose, then verify installation:

```bash
# After user installs, verify
which ffmpeg || python3 -c "import cv2; print('OK')"
```

### 1.3 Get Video Information

Once tool is available, get video metadata:

**Using ffmpeg:**
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate,nb_frames -of csv=p=0 "$VIDEO_PATH"
```

**Using OpenCV (Python):**
```bash
python3 << 'EOF'
import cv2
import sys
cap = cv2.VideoCapture(sys.argv[1])
fps = cap.get(cv2.CAP_PROP_FPS)
frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration = frames / fps if fps > 0 else 0
print(f"Duration: {duration:.2f}s, FPS: {fps:.2f}, Frames: {frames}, Resolution: {width}x{height}")
cap.release()
EOF
```

### 1.4 Determine Output Directory

Check gitignore to find appropriate extraction location:

```bash
# Check existing gitignore patterns
cat .gitignore 2>/dev/null | grep -E "^\." | head -10
```

**Recommended location:** `.opencode/.video-frames/`

This location is chosen because:
1. Hidden directory (starts with `.`)
2. Under `.opencode/` which typically has local/temp patterns ignored
3. Keeps video analysis artifacts separate from code

If not already ignored, inform user:
```markdown
I'll extract frames to `.opencode/.video-frames/`. 

This directory should be gitignored. If it's not, I recommend adding this to your .gitignore:

```
# Video analysis frames (temporary)
.opencode/.video-frames/
```
```

Create the directory:
```bash
mkdir -p .opencode/.video-frames
```

### 1.5 Ask User for Frame Rate

Present frame rate options based on video duration:

```markdown
## Frame Rate Selection

Video duration: **{DURATION}** seconds
Original FPS: **{FPS}**
Total frames in video: **{TOTAL_FRAMES}**

How many frames should I extract?

| Option | Rate | Frames to Extract | Good For |
|--------|------|-------------------|----------|
| A | 1 fps | ~{DURATION} frames | Detailed analysis |
| B | 0.5 fps | ~{DURATION/2} frames | Standard analysis |
| C | 0.2 fps | ~{DURATION/5} frames | Quick overview |
| D | 2 fps | ~{DURATION*2} frames | Fast-moving content |
| Custom | ? fps | You specify | Specific needs |

**Recommendation:** For most videos, 0.5-1 fps provides good coverage without excessive frames.
```

**Output:** `<phase_complete phase="1"/>`

---

## Phase 2: Frame Extraction

### 2.1 Prepare Output Directory

```bash
# Create unique subdirectory for this video
VIDEO_NAME=$(basename "$VIDEO_PATH" | sed 's/\.[^.]*$//')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FRAMES_DIR=".opencode/.video-frames/${VIDEO_NAME}_${TIMESTAMP}"
mkdir -p "$FRAMES_DIR"
echo "Extracting frames to: $FRAMES_DIR"
```

### 2.2 Extract Frames

**Using ffmpeg (recommended):**
```bash
# Extract at specified FPS
# FPS=1 means 1 frame per second
# FPS=0.5 means 1 frame every 2 seconds
ffmpeg -i "$VIDEO_PATH" -vf "fps=${FPS}" -q:v 2 "${FRAMES_DIR}/frame_%04d.jpg" -hide_banner -loglevel error

# Count extracted frames
ls -1 "${FRAMES_DIR}"/*.jpg 2>/dev/null | wc -l
```

**Using OpenCV (Python):**
```bash
python3 << EOF
import cv2
import os
import sys

video_path = "$VIDEO_PATH"
output_dir = "$FRAMES_DIR"
target_fps = $FPS

cap = cv2.VideoCapture(video_path)
video_fps = cap.get(cv2.CAP_PROP_FPS)

# Calculate frame interval
frame_interval = int(video_fps / target_fps) if target_fps > 0 else int(video_fps)

frame_count = 0
saved_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    if frame_count % frame_interval == 0:
        saved_count += 1
        filename = os.path.join(output_dir, f"frame_{saved_count:04d}.jpg")
        cv2.imwrite(filename, frame)
    
    frame_count += 1

cap.release()
print(f"Extracted {saved_count} frames to {output_dir}")
EOF
```

### 2.3 Verify Extraction

```bash
# List extracted frames
ls -la "$FRAMES_DIR" | head -20

# Show first and last frame names
echo "First frame: $(ls -1 "$FRAMES_DIR"/*.jpg | head -1)"
echo "Last frame: $(ls -1 "$FRAMES_DIR"/*.jpg | tail -1)"
echo "Total frames: $(ls -1 "$FRAMES_DIR"/*.jpg | wc -l)"
```

**Output:** `<phase_complete phase="2"/>`

---

## Phase 3: Frame Analysis

### 3.1 Analysis Strategy

For each extracted frame:
1. Read the image using the Read tool (supports images)
2. Analyze what's visible in the frame
3. Note any changes from previous frame
4. Track key events/transitions

### 3.2 Analyze Frames

For each frame in sequence:

```markdown
### Frame {N} ({TIMESTAMP}s into video)

**Content observed:**
- [Describe what's visible in this frame]
- [Note any UI elements, text, people, objects]
- [Describe the scene/context]

**Changes from previous frame:**
- [What changed since last analyzed frame]
- [Any motion, transitions, new elements]

**Notable elements:**
- [Text visible: "..."]
- [UI state: ...]
- [Action occurring: ...]
```

### 3.3 Generate Summary Report

After analyzing all frames, create a comprehensive summary:

```markdown
# Video Analysis Report

**Video:** {VIDEO_PATH}
**Duration:** {DURATION}s
**Frames analyzed:** {COUNT}
**Frame rate used:** {FPS} fps
**Analysis date:** {DATE}

## Timeline Overview

| Time | Frame | Key Event/Content |
|------|-------|-------------------|
| 0:00 | 1 | [Opening scene description] |
| 0:05 | 2 | [What's happening] |
| ... | ... | ... |

## Content Summary

### Main Subjects/Elements
- [What appears most frequently]
- [Key characters/objects/screens]

### Key Events/Transitions
1. **{TIME}**: [Event description]
2. **{TIME}**: [Event description]
...

### Scene Breakdown
- **Opening ({TIME}-{TIME}):** [Description]
- **Middle ({TIME}-{TIME}):** [Description]  
- **Closing ({TIME}-{TIME}):** [Description]

## Detailed Observations

[More detailed analysis if the user requested focus areas]

## Recommendations

[If applicable - suggestions for video editing, content improvements, etc.]
```

### 3.4 Cleanup (Optional)

After analysis is complete, offer to clean up frames:

```bash
# Remove extracted frames
rm -rf "$FRAMES_DIR"
echo "Cleaned up: $FRAMES_DIR"
```

**Output:** `<promise>VIDEO ANALYSIS COMPLETE</promise>`

---

## Example Usage

### Analyzing a Screen Recording

```bash
/analyze-video ~/Downloads/app-demo.mp4 --fps 0.5
```

Output:
```markdown
## Video Analysis: app-demo.mp4

**Duration:** 45 seconds | **Frames analyzed:** 23 | **Rate:** 0.5 fps

### Timeline:
- **0:00-0:05**: App splash screen, logo animation
- **0:05-0:15**: Login screen displayed, user enters credentials
- **0:15-0:20**: Loading indicator shown
- **0:20-0:35**: Main dashboard with data charts
- **0:35-0:45**: Settings menu navigation

### Key UI Elements Observed:
- Login form with email/password fields
- Blue primary buttons
- Tab navigation at bottom
- Data visualization charts (bar, line)
...
```

---

## Troubleshooting

### ffmpeg not found after install
```bash
# Refresh shell
source ~/.bashrc  # or ~/.zshrc

# Check PATH
echo $PATH | tr ':' '\n' | grep -i ffmpeg
```

### OpenCV import error
```bash
# Reinstall with specific version
pip uninstall opencv-python
pip install opencv-python-headless  # Lighter, no GUI dependencies
```

### Video codec not supported
```bash
# Check video codecs
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1 "$VIDEO_PATH"

# If codec issues, try converting first
ffmpeg -i input.mov -c:v libx264 -crf 23 output.mp4
```

### Out of disk space
```bash
# Check available space
df -h .

# Use lower FPS or clean up old frames
rm -rf .opencode/.video-frames/*
```

---

## Cancellation

To cancel: `/cancel-video-analysis` or stop the conversation.

---

## Related

- `nanobanana_generate_image` - For generating images based on analysis
- `mobile_take_screenshot` - For capturing live device screens
- `/prd` - If analyzing video for feature planning
