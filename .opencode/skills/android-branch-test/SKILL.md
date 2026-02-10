---
name: android-branch-test
description: Test Android branch changes on real devices/emulators using mobile-mcp. Analyzes git diff, creates test plan based on change type (Compose, XML, networking, etc.), executes tests with video recording, and reports results.
---

# Android Branch Test - Device Testing Workflow

**Current branch:** !`git branch --show-current 2>/dev/null || echo "not in git repo"`
**Base branch:** !`git rev-parse --abbrev-ref HEAD@{upstream} 2>/dev/null | sed 's|origin/||' || echo "main"`

Test Android branch changes on connected devices or emulators using mobile-mcp.
Each test scenario is recorded as a video for evidence and review.

## Prerequisites

Before starting, ensure:
- Android SDK installed with `adb` in PATH
- Device connected via USB (with USB debugging enabled) OR emulator running
- App builds successfully (`./gradlew assembleDebug`)
- mobile-mcp server enabled in OpenCode config
- Sufficient storage on device for video recordings (~10MB per 30sec)

## The 4-Phase Approach

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | Device Setup | Verify device, build & install app |
| 2 | Change Analysis | Analyze git diff, classify change types |
| 3 | Test Planning | Create test scenarios per change type |
| 4 | Test Execution | Run tests using mobile-mcp, report results |

## Starting the Workflow

```bash
/test-branch                              # Test current branch vs main
/test-branch --base develop               # Test vs specific base
/test-branch --skip-build                 # Skip build (app already installed)
/test-branch --output ./test-evidence     # Custom output directory
/test-branch "focus on login screen"      # With focus hint
```

## Output Directory Structure

All evidence (videos, screenshots) is saved to `./test-evidence/<branch-name>/<timestamp>/`:

```
test-evidence/
└── feature-new-login/
    └── 2024-01-15_14-30-00/
        ├── videos/
        │   ├── test-1-login-visual.mp4
        │   ├── test-2-login-flow.mp4
        │   └── test-3-login-error.mp4
        ├── screenshots/
        │   ├── test-1-before.png
        │   ├── test-1-after.png
        │   └── ...
        └── report.md
```

---

## Phase 1: Device Setup

### 1.1 Check Available Devices

Use mobile-mcp to list devices:
```
mobile_list_available_devices
```

If no devices found:
- Check `adb devices` output
- For emulator: start one via Android Studio or `emulator -avd <name>`
- For real device: enable USB debugging, trust the computer

### 1.2 Get Device Info

```
mobile_get_screen_size
mobile_get_orientation
```

### 1.3 Build & Install App (unless --skip-build)

```bash
# Build debug APK
./gradlew assembleDebug

# Find APK path (usually app/build/outputs/apk/debug/app-debug.apk)
find . -name "*.apk" -path "*/debug/*" | head -1
```

Install using mobile-mcp:
```
mobile_install_app(path: "<apk-path>")
```

### 1.4 Launch App

```
mobile_launch_app(packageName: "<app.package.name>")
```

Get package name from `AndroidManifest.xml` or `build.gradle`.

### 1.5 Setup Video Recording Directory

Create local output directory and verify device recording capability:

```bash
# Create local evidence directory
BRANCH_NAME=$(git branch --show-current | tr '/' '-')
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
OUTPUT_DIR="./test-evidence/${BRANCH_NAME}/${TIMESTAMP}"
mkdir -p "${OUTPUT_DIR}/videos" "${OUTPUT_DIR}/screenshots"

# Verify screenrecord is available on device
adb shell which screenrecord

# Create device-side recording directory
adb shell mkdir -p /sdcard/test-recordings

# Check available storage on device
adb shell df /sdcard | tail -1
```

Store `OUTPUT_DIR` for use in Phase 4.

### 1.6 Verify Recording Works

Quick test to ensure recording functions:

```bash
# Start a 3-second test recording
adb shell "screenrecord --time-limit 3 /sdcard/test-recordings/verify.mp4" &
sleep 4

# Verify file was created
adb shell ls -la /sdcard/test-recordings/verify.mp4

# Clean up test file
adb shell rm /sdcard/test-recordings/verify.mp4
```

If recording fails, check:
- Device Android version (screenrecord requires 4.4+)
- SELinux permissions on some devices
- For emulators: GPU emulation mode may affect recording

**Output:** `<phase_complete phase="1"/>`

---

## Phase 2: Change Analysis

Analyze what changed in the branch to determine test strategy.

### 2.1 Get Changed Files

```bash
# Get diff against base branch
git diff --name-only origin/main...HEAD

# Get detailed diff for classification
git diff origin/main...HEAD --stat
```

### 2.2 Classify Changes

Categorize each changed file:

| Category | File Patterns | Test Strategy |
|----------|---------------|---------------|
| **Compose UI** | `**/ui/**/*.kt`, `*Composable*.kt`, `*Screen.kt`, `*Component.kt` | Visual inspection, interaction test |
| **XML Layouts** | `**/res/layout/*.xml`, `**/res/drawable/*.xml` | Visual inspection, orientation test |
| **Navigation** | `**/navigation/*.kt`, `NavGraph*.kt`, `*Navigator.kt` | Flow test, back navigation |
| **ViewModel** | `*ViewModel.kt`, `*UiState.kt` | State changes, loading/error states |
| **Repository/Data** | `*Repository.kt`, `*DataSource.kt`, `**/data/**` | Data display, offline behavior |
| **Networking** | `*Api.kt`, `*Service.kt`, `**/network/**`, `**/api/**` | API response handling, error states |
| **Database** | `*Dao.kt`, `*Entity.kt`, `**/database/**` | Persistence, data integrity |
| **DI/Config** | `*Module.kt`, `**/di/**`, `build.gradle*` | App launch, feature availability |
| **Resources** | `**/res/values/*.xml`, `strings.xml`, `colors.xml` | Text display, theming |

### 2.3 Identify Affected Screens

Map changed files to screens:
1. Trace Composables/Fragments to their parent screens
2. Check navigation graph for affected destinations
3. Note any shared components that affect multiple screens

### 2.4 Summarize Analysis

Create a summary like:
```
## Change Analysis Summary

**Changed files:** 12
**Categories detected:**
- Compose UI: 5 files (LoginScreen, ProfileScreen)
- ViewModel: 2 files (LoginViewModel, ProfileViewModel)  
- Networking: 3 files (AuthApi, UserRepository)
- Resources: 2 files (strings.xml, colors.xml)

**Affected screens:** Login, Profile, Settings
**Risk level:** Medium (auth flow changes)
```

**Output:** `<phase_complete phase="2"/>`

---

## Phase 3: Test Planning

Create test scenarios based on change categories.

### 3.1 Test Scenario Templates

#### For Compose UI / XML Layout Changes:

| Scenario | Steps | Verification |
|----------|-------|--------------|
| Visual inspection | Navigate to screen | Screenshot, check layout |
| Interaction | Tap buttons, fill forms | Elements respond correctly |
| Orientation | Rotate device | Layout adapts |
| Dark mode | Toggle theme | Colors/contrast correct |
| Different screen sizes | (if emulator) Test on tablet | Responsive layout |

#### For Navigation Changes:

| Scenario | Steps | Verification |
|----------|-------|--------------|
| Forward navigation | Tap through flow | Correct screens appear |
| Back navigation | Press back button | Previous screen, no crashes |
| Deep link | Open URL (if applicable) | Lands on correct screen |
| State preservation | Navigate away and back | State preserved |

#### For ViewModel / State Changes:

| Scenario | Steps | Verification |
|----------|-------|--------------|
| Initial state | Launch screen | Correct initial UI |
| Loading state | Trigger data load | Loading indicator shows |
| Success state | Wait for data | Data displays correctly |
| Error state | (if testable) Trigger error | Error message shows |
| Empty state | (if applicable) No data | Empty state UI |

#### For Networking Changes:

| Scenario | Steps | Verification |
|----------|-------|--------------|
| Happy path | Perform action | Success response handled |
| Slow network | (emulator) Throttle network | Loading states work |
| Network error | Enable airplane mode | Error handling works |
| Retry | After error, retry | Recovery works |

#### For Database/Persistence Changes:

| Scenario | Steps | Verification |
|----------|-------|--------------|
| Save data | Enter and save | Data persists |
| Load data | Relaunch app | Data loads correctly |
| Update data | Modify existing | Updates reflect |
| Delete data | Remove item | Deletion works |

### 3.2 Create Test Plan

Use `todowrite` to create test tasks:

```json
{
  "todos": [
    {"id": "test-1", "content": "Test: LoginScreen visual - verify layout, form fields, button states", "status": "pending", "priority": "high"},
    {"id": "test-2", "content": "Test: Login flow - enter credentials, tap login, verify navigation to home", "status": "pending", "priority": "high"},
    {"id": "test-3", "content": "Test: Login error - invalid credentials, verify error message displays", "status": "pending", "priority": "high"},
    {"id": "test-4", "content": "Test: Orientation - rotate on login screen, verify layout adapts", "status": "pending", "priority": "medium"}
  ]
}
```

### 3.3 Confirm Plan with User

Present the test plan and ask:
- "Does this cover the critical paths?"
- "Any specific scenarios to add?"
- "Ready to execute tests?"

**Output:** `<phase_complete phase="3"/>`

---

## Phase 4: Test Execution

Execute each test scenario using mobile-mcp with video recording.

### 4.1 Mobile-MCP Tool Reference

**Navigation:**
```
mobile_click_on_screen_at_coordinates(x, y)      # Tap at position
mobile_swipe_on_screen(direction: "up|down|left|right", startX, startY, endX, endY)
mobile_press_button(button: "BACK|HOME|ENTER")
mobile_open_url(url: "scheme://path")            # Deep link
```

**Input:**
```
mobile_type_keys(text: "input text", submit: true|false)
```

**Inspection:**
```
mobile_take_screenshot()                          # Get visual state
mobile_list_elements_on_screen()                  # Get UI hierarchy
mobile_get_screen_size()
mobile_get_orientation()
mobile_set_orientation(orientation: "portrait|landscape")
```

**App Control:**
```
mobile_launch_app(packageName: "com.example.app")
mobile_terminate_app(packageName: "com.example.app")
```

### 4.2 Video Recording Commands

**Start recording** (before each test):
```bash
# Generate unique filename for this test
TEST_ID="test-1"  # e.g., test-1, test-2, etc.
TEST_NAME="login-visual"  # sanitized test name
VIDEO_FILE="/sdcard/test-recordings/${TEST_ID}-${TEST_NAME}.mp4"

# Start recording in background (max 180 seconds)
# Use --bugreport for higher quality with metadata
adb shell "screenrecord --verbose --time-limit 180 ${VIDEO_FILE}" &
RECORD_PID=$!

# Give recording time to initialize
sleep 1
```

**Stop recording** (after each test):
```bash
# Gracefully stop recording (sends SIGINT)
adb shell "pkill -INT screenrecord"

# Wait for file to finalize
sleep 2

# Verify recording was saved
adb shell ls -la ${VIDEO_FILE}
```

**Pull video to local** (after stopping):
```bash
# Pull video from device to local output directory
adb pull ${VIDEO_FILE} "${OUTPUT_DIR}/videos/"

# Verify local file
ls -la "${OUTPUT_DIR}/videos/${TEST_ID}-${TEST_NAME}.mp4"

# Optional: Clean up device storage
adb shell rm ${VIDEO_FILE}
```

### 4.3 Execution Pattern (with Video)

For each test scenario:

```bash
# === BEFORE TEST ===
TEST_ID="test-1"
TEST_NAME="login-screen-visual"
VIDEO_FILE="/sdcard/test-recordings/${TEST_ID}-${TEST_NAME}.mp4"

# 1. Start video recording
adb shell "screenrecord --time-limit 180 ${VIDEO_FILE}" &
sleep 1

# 2. Take "before" screenshot
mobile_take_screenshot()
mobile_save_screenshot(path: "${OUTPUT_DIR}/screenshots/${TEST_ID}-before.png")
```

```
# === EXECUTE TEST ===
# 3. Navigate to starting screen
mobile_launch_app(packageName: "com.example.app")

# 4. Execute test steps using mobile-mcp tools
mobile_list_elements_on_screen()  # Find elements
mobile_click_on_screen_at_coordinates(x: 200, y: 530)  # Interact
mobile_type_keys(text: "test input")  # Input
# ... more steps
```

```bash
# === AFTER TEST ===
# 5. Take "after" screenshot
mobile_take_screenshot()
mobile_save_screenshot(path: "${OUTPUT_DIR}/screenshots/${TEST_ID}-after.png")

# 6. Stop recording
adb shell "pkill -INT screenrecord"
sleep 2

# 7. Pull video to local
adb pull ${VIDEO_FILE} "${OUTPUT_DIR}/videos/"

# 8. Clean up device
adb shell rm ${VIDEO_FILE}

# 9. Record result (Pass/Fail)
```

### 4.4 Batch Pull All Videos (Alternative)

If you prefer to pull all videos at the end:

```bash
# List all recordings on device
adb shell ls -la /sdcard/test-recordings/

# Pull entire directory
adb pull /sdcard/test-recordings/ "${OUTPUT_DIR}/videos/"

# Clean up device
adb shell rm -rf /sdcard/test-recordings/*
```

### 4.5 Exploring Device Storage

To find recordings or troubleshoot:

```bash
# List sdcard contents
adb shell ls -la /sdcard/

# Check recordings directory
adb shell ls -la /sdcard/test-recordings/

# Check file sizes (ensure recording worked)
adb shell du -h /sdcard/test-recordings/*

# Check available space
adb shell df -h /sdcard

# Find all mp4 files on device
adb shell find /sdcard -name "*.mp4" -type f 2>/dev/null
```

### 4.6 Finding Element Coordinates

Use `mobile_list_elements_on_screen()` to get element positions:
- Look for element by text, content description, or resource ID
- Get bounds/coordinates
- Use center of bounds for tap

Example flow:
```
1. mobile_list_elements_on_screen()
   -> Find "Login" button at bounds [100, 500, 300, 560]
   -> Center: x=200, y=530

2. mobile_click_on_screen_at_coordinates(x: 200, y: 530)

3. mobile_take_screenshot() to verify result
```

### 4.7 Test Report Format

For each test, record:

```markdown
### Test: <name>
**Test ID:** test-1
**Status:** PASS | FAIL
**Duration:** 45 seconds

**Evidence:**
- Video: [test-1-login-visual.mp4](./videos/test-1-login-visual.mp4)
- Before: [test-1-before.png](./screenshots/test-1-before.png)
- After: [test-1-after.png](./screenshots/test-1-after.png)

**Steps:**
1. Launch app - OK
2. Navigate to login screen - OK
3. Verify form fields present - OK
4. Check button states - FAILED: Submit button enabled before input

**Notes:** Button should be disabled until email/password filled
```

### 4.8 Summary Report

After all tests, write report to `${OUTPUT_DIR}/report.md`:

```markdown
# Test Execution Report

**Branch:** feature/new-login
**Base:** main
**Device:** Pixel 6 (Android 14) / Emulator API 34
**Date:** 2024-01-15 14:30:00
**Output Directory:** ./test-evidence/feature-new-login/2024-01-15_14-30-00/

## Results Summary

| Test ID | Test Name | Status | Video | Duration |
|---------|-----------|--------|-------|----------|
| test-1 | LoginScreen visual | PASS | [video](./videos/test-1-login-visual.mp4) | 32s |
| test-2 | Login flow | PASS | [video](./videos/test-2-login-flow.mp4) | 45s |
| test-3 | Login error | FAIL | [video](./videos/test-3-login-error.mp4) | 28s |
| test-4 | Orientation | PASS | [video](./videos/test-4-orientation.mp4) | 20s |

### Overall: 3/4 PASSED (75%)

## Evidence Directory

```
videos/
  test-1-login-visual.mp4 (2.3 MB)
  test-2-login-flow.mp4 (3.1 MB)
  test-3-login-error.mp4 (1.8 MB)
  test-4-orientation.mp4 (1.5 MB)

screenshots/
  test-1-before.png
  test-1-after.png
  test-2-before.png
  test-2-after.png
  ...
```

## Issues Found

### 1. Login error handling (test-3)
**Severity:** High
**Video:** [test-3-login-error.mp4](./videos/test-3-login-error.mp4) @ 0:15

**Expected:** Error snackbar appears when invalid credentials submitted
**Actual:** No visual feedback to user, form just clears

**Screenshot comparison:**
- Before submit: [test-3-before.png](./screenshots/test-3-before.png)
- After submit: [test-3-after.png](./screenshots/test-3-after.png)

## Recommendations

1. **Must fix before merge:**
   - Add error handling UI for login failures

2. **Consider:**
   - Add loading indicator during auth request
   - Disable submit button while request in flight

## Device Info

- Model: Pixel 6
- Android: 14 (API 34)
- Screen: 1080x2400 @ 420dpi
- Orientation: Portrait (tested both)
```

### 4.9 Finalize and Cleanup

After all tests complete:

```bash
# List all evidence collected
ls -la "${OUTPUT_DIR}/videos/"
ls -la "${OUTPUT_DIR}/screenshots/"

# Get total size of evidence
du -sh "${OUTPUT_DIR}"

# Clean up device storage
adb shell rm -rf /sdcard/test-recordings

# Verify report was written
cat "${OUTPUT_DIR}/report.md"
```

**Output:** `<promise>BRANCH TEST COMPLETE</promise>`

---

## Troubleshooting

### No devices found
```bash
adb kill-server && adb start-server
adb devices
```

### App won't install
- Check for existing installation: `mobile_uninstall_app(packageName: "...")`
- Verify APK path is correct
- Check device has enough storage

### Elements not found
- Wait for screen to fully load
- Use `mobile_take_screenshot()` to see actual state
- Try `mobile_list_elements_on_screen()` multiple times

### Coordinates off
- Screen density varies by device
- Always use `mobile_list_elements_on_screen()` to get fresh coordinates
- Account for status bar / navigation bar

### Video Recording Issues

**Recording not starting:**
```bash
# Check if screenrecord exists
adb shell which screenrecord

# Check if another recording is running
adb shell ps | grep screenrecord

# Kill stuck recording process
adb shell pkill screenrecord
```

**Video file is 0 bytes or corrupt:**
- Ensure recording ran for at least 1 second before stopping
- Wait 2+ seconds after `pkill` before pulling
- Check device storage: `adb shell df -h /sdcard`

**Permission denied on /sdcard:**
```bash
# Some devices restrict /sdcard access
# Try using app-specific directory
adb shell screenrecord /data/local/tmp/test.mp4

# Or check SELinux
adb shell getenforce
```

**Recording stops immediately:**
- Check Android version (screenrecord requires 4.4+)
- On some devices, max resolution must be specified:
```bash
adb shell screenrecord --size 1280x720 /sdcard/test.mp4
```

**Cannot pull video - file not found:**
```bash
# List what's actually on device
adb shell ls -la /sdcard/test-recordings/

# Check if file is still being written
adb shell lsof | grep screenrecord
```

**Videos too large:**
- Reduce bitrate: `--bit-rate 4000000` (4Mbps, default is 20Mbps)
- Reduce resolution: `--size 720x1280`
- Use time limit: `--time-limit 60`

```bash
# Example: Lower quality recording
adb shell screenrecord --bit-rate 4000000 --size 720x1280 /sdcard/test.mp4
```

### Emulator-Specific Issues

**Recording fails on emulator:**
- Use software rendering: `emulator -avd <name> -gpu swiftshader_indirect`
- Some emulator GPU modes don't support screenrecord

**Emulator too slow:**
- Use x86/x86_64 system images with hardware acceleration
- Allocate more RAM to emulator
- Close other resource-heavy apps

---

## Cancellation

To cancel: `/cancel-test-branch` or stop the conversation.

---

## Related

- `mobile-mcp` documentation
- `/complete` - Mark tasks complete after fixing issues found
- `todoread` / `todowrite` - Task management
