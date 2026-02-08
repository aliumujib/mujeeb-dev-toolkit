/**
 * Git Safety Guard Plugin
 * 
 * Blocks destructive git and filesystem commands to prevent accidental data loss.
 * Intercepts bash commands before execution and throws an error if dangerous.
 */

import type { Plugin } from "@opencode-ai/plugin"

// Destructive patterns with explanations
const DESTRUCTIVE_PATTERNS: [RegExp, string][] = [
  // git checkout that discards changes (but not branch operations)
  [/git\s+checkout\s+--\s+/, "git checkout -- discards uncommitted changes"],
  [/git\s+checkout\s+\.\s*$/, "git checkout . discards all uncommitted changes"],
  [/git\s+checkout\s+HEAD\s+--/, "git checkout HEAD -- discards changes"],

  // git restore without --staged (discards working tree changes)
  [/git\s+restore\s+(?!.*--staged)(?!.*-S).*\S/, "git restore discards uncommitted changes (use --staged for staging area)"],

  // git reset destructive variants
  [/git\s+reset\s+--hard/, "git reset --hard discards all uncommitted changes"],
  [/git\s+reset\s+--merge/, "git reset --merge can discard changes"],

  // git clean (removes untracked files)
  [/git\s+clean\s+-[a-zA-Z]*f/, "git clean -f permanently deletes untracked files"],

  // force push
  [/git\s+push\s+.*--force(?!-with-lease)/, "git push --force can overwrite remote history (use --force-with-lease)"],
  [/git\s+push\s+.*-f(?:\s|$)/, "git push -f can overwrite remote history"],

  // force delete branch
  [/git\s+branch\s+-D/, "git branch -D force deletes without merge check (use -d)"],

  // stash destruction
  [/git\s+stash\s+drop/, "git stash drop permanently deletes stashed changes"],
  [/git\s+stash\s+clear/, "git stash clear deletes ALL stashed changes"],

  // git rm (deletes files from working tree unless --cached)
  [/git\s+rm\s+(?!.*--cached)/, "git rm permanently deletes files (use --cached to only unstage)"],

  // rm -rf (except common temp/build dirs)
  [/rm\s+-[a-zA-Z]*r[a-zA-Z]*f|rm\s+-[a-zA-Z]*f[a-zA-Z]*r/, "rm -rf permanently deletes files"],
]

// Patterns that are safe despite matching destructive patterns
const SAFE_PATTERNS: RegExp[] = [
  /git\s+checkout\s+-b/,  // create new branch
  /git\s+checkout\s+-B/,  // create/reset branch
  /git\s+checkout\s+--orphan/,  // create orphan branch
  /git\s+restore\s+--staged/,  // unstage files (safe)
  /git\s+restore\s+-S/,  // unstage files (safe)
  // common build/temp dirs are safe to rm -rf
  /rm\s+-rf\s+(\/tmp\/|\/var\/tmp\/|node_modules|\.next|dist\/|build\/|__pycache__|\.pytest_cache|\.mypy_cache|target\/|\.gradle|\.cache)/,
]

function isSafeCommand(command: string): boolean {
  return SAFE_PATTERNS.some(pattern => pattern.test(command))
}

function checkDestructive(command: string): { blocked: boolean; reason: string } {
  if (isSafeCommand(command)) {
    return { blocked: false, reason: "" }
  }

  for (const [pattern, reason] of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      return { blocked: true, reason }
    }
  }

  return { blocked: false, reason: "" }
}

export const GitGuardPlugin: Plugin = async ({ client }) => {
  await client.app.log({
    body: {
      service: "git-guard",
      level: "info",
      message: "Git safety guard initialized",
    },
  })

  return {
    "tool.execute.before": async (input, output) => {
      // Only check bash commands
      if (input.tool !== "bash") {
        return
      }

      const command = output.args?.command as string
      if (!command) {
        return
      }

      const { blocked, reason } = checkDestructive(command)

      if (blocked) {
        await client.app.log({
          body: {
            service: "git-guard",
            level: "warn",
            message: `Blocked destructive command: ${command.slice(0, 100)}`,
            extra: { reason },
          },
        })

        throw new Error(
          `BLOCKED: ${reason}\n\n` +
          `Command: ${command.slice(0, 100)}${command.length > 100 ? "..." : ""}\n\n` +
          `If you need to run this command, ask the user to run it manually.`
        )
      }
    },
  }
}
