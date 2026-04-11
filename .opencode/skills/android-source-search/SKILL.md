---
name: android-source-search
description: Search Android OS framework source code (ConnectivityService, WifiManager, etc.) to understand internal APIs, permission checks, and system behavior. Use when debugging Android framework interactions or investigating "why does Android do X?"
---

# Android Source Code Search Skill

Search the Android Open Source Project (AOSP) to understand framework internals, permission checks, and system behavior.

## When to Use

- Investigating "why does this Android API return X?"
- Understanding permission requirements for system APIs
- Debugging framework interactions (WiFi, Connectivity, Bluetooth, etc.)
- Finding out what flags/constants are available
- Tracing how system services implement APIs
- Discovering hidden APIs or workarounds

## Quick Start

```bash
# Search for a method implementation
/search-android "getNetworkCapabilities implementation"

# Search specific file
/search-android "shouldRedactLocationSensitiveFields" --file ConnectivityService.java

# Find permission checks
/search-android "checkLocationPermission" --package wifi

# Get specific lines from a file
/search-android --show ConnectivityService.java:2900-3000
```

## Architecture

```
Android Source Code
    ↓
android.googlesource.com (TEXT format, base64 encoded)
    ↓
curl + base64 decode + grep/sed
    ↓
Extracted source code
```

## Core Techniques

### 1. Search for Methods/Classes

Use the Android Code Search web interface first to find file locations:

```bash
# Step 1: Search web UI (use Playwright for JS-heavy sites)
URL="https://cs.android.com/search?q=shouldRedactLocationSensitiveFields%20lang:java"

# Step 2: Extract file path from results
# Example result: packages/modules/Connectivity/service/src/com/android/server/ConnectivityService.java

# Step 3: Download raw file
BASE_URL="https://android.googlesource.com/platform"
REPO="packages/modules/Connectivity"
BRANCH="refs/heads/main"
FILE_PATH="service/src/com/android/server/ConnectivityService.java"

curl -s "${BASE_URL}/${REPO}/+/${BRANCH}/${FILE_PATH}?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))"
```

### 2. Get Specific Line Ranges

```bash
# Get lines 3080-3150 from a file
curl -s "https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  sed -n '3080,3150p'
```

### 3. Search Within a Downloaded File

```bash
# Download and search for a pattern
curl -s "${FILE_URL}?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  grep -A 30 "methodName"
```

### 4. Find Line Numbers

```bash
# Find where a method is defined
curl -s "${FILE_URL}?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  grep -n "methodName" | head -20
```

## Common Search Patterns

### Permission Checks

```bash
# Find how Android checks permissions
/search-android "checkLocationPermission" --file WifiServiceImpl.java
/search-android "enforceAccessPermission" --file ConnectivityService.java
/search-android "checkCallersLocationPermission"
```

### Flag/Constant Values

```bash
# Find flag definitions
/search-android "FLAG_INCLUDE_LOCATION_INFO" --file ConnectivityManager.java
/search-android "REDACT_FOR_ACCESS_FINE_LOCATION" --file NetworkCapabilities.java
```

### Method Implementations

```bash
# Find how a public API is implemented
/search-android "getNetworkCapabilities(" --file ConnectivityService.java
/search-android "getCurrentNetwork" --file WifiManager.java
```

### Callback Handling

```bash
# Find callback dispatch logic
/search-android "callCallbackForRequest" --file ConnectivityService.java
/search-android "onCapabilitiesChanged" --file NetworkCallback.java
```

## Key AOSP Repositories

| Repository | Path | Contents |
|------------|------|----------|
| **frameworks/base** | `platform/frameworks/base` | Core Android framework |
| **Connectivity** | `platform/packages/modules/Connectivity` | ConnectivityService, NetworkCallback |
| **WiFi** | `platform/packages/modules/Wifi` | WifiManager, WifiService |
| **Bluetooth** | `platform/packages/modules/Bluetooth` | BluetoothManager, BLE |
| **Location** | `platform/packages/modules/GeoLocation` | LocationManager, GPS |

## URL Patterns

### Android Code Search (Web UI)
```
https://cs.android.com/search?q=<query>%20lang:java
```

### Googlesource (Raw Files)
```
https://android.googlesource.com/platform/<repo>/+/refs/heads/main/<file-path>?format=TEXT
```

### Example URLs

```bash
# ConnectivityService.java
https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java?format=TEXT

# WifiInfo.java
https://android.googlesource.com/platform/packages/modules/Wifi/+/refs/heads/main/framework/java/android/net/wifi/WifiInfo.java?format=TEXT

# NetworkCapabilities.java
https://android.googlesource.com/platform/frameworks/base/+/refs/heads/master/core/java/android/net/NetworkCapabilities.java?format=TEXT
```

## Workflow Example

### Investigating "Why does getNetworkCapabilities() redact SSID?"

```bash
# Step 1: Search for the method
/search-android "getNetworkCapabilities" --file ConnectivityService.java

# Step 2: Find the implementation (around line 2928)
curl -s "https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  sed -n '2920,2940p'

# Step 3: Find what createWithLocationInfoSanitizedIfNecessaryWhenParceled does
curl -s "https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  grep -n "createWithLocationInfoSanitizedIfNecessaryWhenParceled" | head -5

# Step 4: Get that method (around line 3115)
curl -s "https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  sed -n '3115,3150p'

# Step 5: Find retrieveRequiredRedactions
curl -s "https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
  sed -n '3087,3120p'
```

**Discovery**: `includeLocationSensitiveInfo` is hardcoded to `false` in the public API!

## Helper Functions

### Decode AOSP File

```bash
decode_aosp_file() {
    local url="$1"
    curl -s "${url}?format=TEXT" | \
      python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))"
}

# Usage
decode_aosp_file "https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java"
```

### Search and Extract

```bash
search_aosp() {
    local file_url="$1"
    local pattern="$2"
    local context_lines="${3:-20}"
    
    curl -s "${file_url}?format=TEXT" | \
      python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
      grep -A "${context_lines}" "${pattern}"
}

# Usage
search_aosp "https://android.googlesource.com/.../ConnectivityService.java" "getNetworkCapabilities" 30
```

### Get Line Range

```bash
get_lines() {
    local file_url="$1"
    local start_line="$2"
    local end_line="$3"
    
    curl -s "${file_url}?format=TEXT" | \
      python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" | \
      sed -n "${start_line},${end_line}p"
}

# Usage
get_lines "https://android.googlesource.com/.../ConnectivityService.java" 3080 3120
```

## Best Practices

### 1. Start with Web Search

Always start at https://cs.android.com/search to find the correct file path and line numbers.

### 2. Use Playwright for Web UI

If you need to interact with the web search UI:

```bash
playwriter session new
playwriter -s 1 -e '
await page.goto("https://cs.android.com/search?q=shouldRedactLocationSensitiveFields%20lang:java");
await page.waitForSelector("a[href*=\"ConnectivityService.java\"]");
const link = await page.$("a[href*=\"ConnectivityService.java\"]");
const href = await link.getAttribute("href");
console.log("File URL:", href);
'
```

### 3. Cache File Contents

If you need to search the same file multiple times, download it once:

```bash
# Download once
curl -s "https://android.googlesource.com/.../ConnectivityService.java?format=TEXT" | \
  python3 -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))" > /tmp/ConnectivityService.java

# Search multiple times
grep -A 20 "getNetworkCapabilities" /tmp/ConnectivityService.java
grep -n "retrieveRequiredRedactions" /tmp/ConnectivityService.java
```

### 4. Understand Branches

- `refs/heads/main` - Latest development
- `refs/heads/master` - Stable (for older repos)
- `android-latest-release` - Latest stable release
- Specific tags like `android-12.0.0_r1` for release versions

### 5. Handle Base64 Decoding Errors

If base64 decode fails, the file might not exist or the URL is wrong:

```bash
# Check if file exists first
curl -I "https://android.googlesource.com/.../File.java"

# Try different branch
# main → master → android-latest-release
```

## Common Gotchas

### 1. URL Encoding

Space in search queries must be `%20`:
```
❌ https://cs.android.com/search?q=get network capabilities
✅ https://cs.android.com/search?q=get%20network%20capabilities
```

### 2. File Paths

File paths in googlesource URLs don't have leading slash:
```
❌ /service/src/com/android/server/ConnectivityService.java
✅ service/src/com/android/server/ConnectivityService.java
```

### 3. Repository Structure Changes

Repositories can move between Android versions. If file not found:
- Try `frameworks/base` instead of `packages/modules/X`
- Check multiple branches
- Search cs.android.com to find current location

### 4. Private/Hidden APIs

Some framework internals are `@hide` but still searchable:
```java
/** @hide */
public void someInternalMethod() { ... }
```

These appear in source but not in SDK docs.

## Integration with Development

### Finding Workarounds

When an API doesn't work as expected, search the source to find:
1. Alternative APIs that access the same data
2. Flags or options that change behavior
3. Permission requirements
4. Version-specific behavior

### Understanding Breaking Changes

When upgrading targetSdk:
```bash
# Compare method across Android versions
# Android 11 (R)
get_lines "...?format=TEXT" 100 150 > /tmp/api30.txt

# Android 12 (S)  
get_lines "...?format=TEXT" 100 150 > /tmp/api31.txt

# Diff
diff /tmp/api30.txt /tmp/api31.txt
```

### Reporting Bugs

Include source code links in bug reports:
```
Expected: SSID should be available with FLAG_INCLUDE_LOCATION_INFO
Actual: Returns <unknown ssid>

Source: https://android.googlesource.com/platform/packages/modules/Connectivity/+/refs/heads/main/service/src/com/android/server/ConnectivityService.java#2933

The issue is on line 2933 where includeLocationSensitiveInfo is hardcoded to false.
```

## Troubleshooting

### "base64: invalid input"

The file URL is wrong or file doesn't exist. Double-check:
- Repository path
- Branch name
- File path

### "curl: (22) The requested URL returned error: 404"

File moved or renamed. Search cs.android.com to find new location.

### "python3: command not found"

Use `python` instead:
```bash
curl -s "${url}?format=TEXT" | \
  python -c "import sys, base64; print(base64.b64decode(sys.stdin.read()).decode('utf-8'))"
```

### Empty output from grep

Pattern might not exist in that file/version. Try:
- Different search pattern
- Case-insensitive: `grep -i`
- Wider context: `grep -A 50`

## Related Skills

- **playwriter**: For automating cs.android.com web UI
- **mobile-security-coder**: For understanding Android security model
- **android-branch-test**: For testing changes based on framework behavior

## Resources

- [Android Code Search](https://cs.android.com/)
- [Android Source (Googlesource)](https://android.googlesource.com/)
- [AOSP Repository List](https://android.googlesource.com/)
- [Android API Reference](https://developer.android.com/reference)

---

**Last Updated**: March 24, 2026
