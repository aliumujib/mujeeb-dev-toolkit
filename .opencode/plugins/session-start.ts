/**
 * Session Start Plugin
 * 
 * Records session information when a new session begins.
 * Creates a state file that other plugins can reference.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"

export const SessionStartPlugin: Plugin = async ({ client, directory, $ }) => {
  return {
    "session.created": async ({ sessionId }) => {
      try {
        // Ensure .opencode directory exists
        const opencodeDir = join(directory, ".opencode")
        if (!existsSync(opencodeDir)) {
          mkdirSync(opencodeDir, { recursive: true })
        }

        // Write current session file
        const sessionFile = join(opencodeDir, ".current_session")
        const sessionData = {
          session_id: sessionId,
          started_at: new Date().toISOString(),
          directory,
        }

        writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2))

        await client.app.log({
          body: {
            service: "session-start",
            level: "info",
            message: `Session started: ${sessionId}`,
            extra: sessionData,
          },
        })
      } catch (error) {
        await client.app.log({
          body: {
            service: "session-start",
            level: "error",
            message: `Failed to record session start: ${error}`,
          },
        })
      }
    },
  }
}
