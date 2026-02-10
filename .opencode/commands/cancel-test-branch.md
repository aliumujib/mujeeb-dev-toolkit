---
description: Cancel an in-progress Android branch test
---

# Cancel Branch Test

Cancels the current Android branch testing session.

## Cleanup Actions

1. Stop any running screen recordings
2. Pull any recorded videos from device
3. Clean up device storage
4. Save partial report (if any tests completed)

## Usage

```bash
/cancel-test-branch
```

---

## Execution

```bash
# Stop any running recordings
adb shell pkill -INT screenrecord 2>/dev/null || true
sleep 2

# Check if there are recordings to salvage
RECORDINGS=$(adb shell ls /sdcard/test-recordings/ 2>/dev/null | wc -l)

if [ "$RECORDINGS" -gt 0 ]; then
    echo "Found $RECORDINGS recording(s) on device"
    
    # Create output directory if needed
    BRANCH_NAME=$(git branch --show-current | tr '/' '-')
    OUTPUT_DIR="./test-evidence/${BRANCH_NAME}/cancelled-$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p "${OUTPUT_DIR}/videos"
    
    # Pull recordings
    adb pull /sdcard/test-recordings/ "${OUTPUT_DIR}/videos/"
    
    echo "Salvaged recordings to: ${OUTPUT_DIR}/videos/"
fi

# Clean up device
adb shell rm -rf /sdcard/test-recordings 2>/dev/null || true

echo "Branch test cancelled."
```

Test session cancelled. Any recorded evidence has been salvaged to the output directory.
