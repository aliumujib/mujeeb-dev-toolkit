---
description: Test Android branch changes on device with video recording
---

# Android Branch Test

Test the current branch's changes on a connected Android device or emulator.
Each test scenario is recorded as a video for evidence.

## Arguments

- `--base <branch>` - Base branch to compare against (default: main)
- `--skip-build` - Skip building APK (app already installed)
- `--output <dir>` - Output directory for evidence (default: ./test-evidence)
- `<focus>` - Optional focus hint (e.g., "focus on login screen")

## Workflow

This command initiates a 4-phase testing workflow:

1. **Device Setup** - Verify device, build & install app, setup video recording
2. **Change Analysis** - Analyze git diff, classify change types
3. **Test Planning** - Create test scenarios based on changes
4. **Test Execution** - Run tests with video recording, generate report

## Example Usage

```bash
/test-branch                              # Test current branch vs main
/test-branch --base develop               # Test vs develop branch
/test-branch --skip-build                 # Skip build step
/test-branch "focus on profile screen"    # Test with focus hint
```

## Output

Evidence is saved to `./test-evidence/<branch>/<timestamp>/`:
- `videos/` - Screen recordings of each test
- `screenshots/` - Before/after screenshots
- `report.md` - Full test report with links to evidence

## Prerequisites

- Android device connected (USB debugging) or emulator running
- `adb` in PATH
- App builds successfully
- `mobile-mcp` server enabled

---

Load the skill and begin Phase 1:

Use the `android-branch-test` skill for detailed instructions.

**Phase 1: Device Setup**

1. Check for connected devices using `mobile_list_available_devices`
2. Get device info (screen size, orientation)
3. Build and install the app (unless --skip-build)
4. Setup video recording directory
5. Verify recording works

Begin by listing available devices.
