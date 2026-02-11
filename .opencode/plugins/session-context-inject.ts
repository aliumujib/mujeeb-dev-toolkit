/**
 * Session Context Injection Plugin
 * 
 * Queries qmd for relevant past session context and injects it into conversations.
 * Requires qmd to be installed: `brew install qmd` or `cargo install qmd`
 * 
 * Setup:
 * 1. Install qmd
 * 2. Initialize collection: qmd init -c opencode-sessions ~/.opencode/qmd-sessions
 * 3. Sync sessions: ./scripts/sync-opencode-sessions.sh
 */

import type { Plugin } from "@opencode-ai/plugin"
import { execSync } from "child_process"
import { existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const QMD_SESSIONS_DIR = join(homedir(), ".opencode", "qmd-sessions")
const MAX_CONTEXT_CHARS = 4000

function isQmdInstalled(): boolean {
  try {
    execSync("command -v qmd", { stdio: "pipe" })
    return true
  } catch {
    return false
  }
}

function isQmdInitialized(): boolean {
  return existsSync(QMD_SESSIONS_DIR)
}

function queryQmd(query: string, limit: number = 3): string | null {
  try {
    const result = execSync(
      `qmd search -c opencode-sessions -n ${limit} "${query.replace(/"/g, '\\"')}"`,
      {
        cwd: QMD_SESSIONS_DIR,
        stdio: ["pipe", "pipe", "pipe"],
        encoding: "utf-8",
        timeout: 5000,
      }
    )
    return result.trim() || null
  } catch {
    return null
  }
}

function truncateContext(context: string, maxChars: number): string {
  if (context.length <= maxChars) return context
  return context.substring(0, maxChars) + "\n\n[...truncated for brevity]"
}

export const SessionContextInjectPlugin: Plugin = async ({ client, directory }) => {
  // Check prerequisites on plugin load
  const qmdInstalled = isQmdInstalled()
  const qmdInitialized = isQmdInitialized()

  if (!qmdInstalled) {
    await client.app.log({
      body: {
        service: "session-context-inject",
        level: "warn",
        message: "qmd not installed. Session context injection disabled. Install with: brew install qmd",
      },
    })
  } else if (!qmdInitialized) {
    await client.app.log({
      body: {
        service: "session-context-inject",
        level: "warn",
        message: `qmd sessions not initialized. Run: qmd init -c opencode-sessions ${QMD_SESSIONS_DIR}`,
      },
    })
  }

  return {
    "message.created": async ({ message }) => {
      // Only process user messages
      if (message.role !== "user") return

      // Skip if qmd not available
      if (!qmdInstalled || !qmdInitialized) return

      // Extract text content from message
      const textContent = message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join(" ")

      if (!textContent || textContent.length < 10) return

      try {
        // Query qmd for relevant past context
        const context = queryQmd(textContent)

        if (context) {
          const truncatedContext = truncateContext(context, MAX_CONTEXT_CHARS)

          await client.app.log({
            body: {
              service: "session-context-inject",
              level: "info",
              message: `Injected ${truncatedContext.length} chars of past session context`,
            },
          })

          // Add context as a system message
          // Note: This creates a system reminder with past context
          return {
            systemReminder: `<past-session-context>
The following is relevant context from past sessions that may help with the current request:

${truncatedContext}
</past-session-context>`,
          }
        }
      } catch (error) {
        await client.app.log({
          body: {
            service: "session-context-inject",
            level: "error",
            message: `Failed to query session context: ${error}`,
          },
        })
      }
    },
  }
}
