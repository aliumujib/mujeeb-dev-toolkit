/**
 * Loop Controller Plugin
 * 
 * Enforces phased workflows (PRD, Unit Test, E2E loops).
 * When the AI finishes a response, this plugin checks if we're in a loop
 * and whether the current phase is complete. If not done, it sends a
 * follow-up message to continue the workflow.
 * 
 * This is the core feature that makes /prd, /ut, /e2e actually loop
 * through all phases instead of stopping early.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs"
import { join, basename } from "path"
import * as yaml from "yaml"

interface LoopState {
  loop_type: "prd" | "ut" | "e2e"
  current_phase: number
  max_phase: number
  feature_name?: string
  target?: string
  scope?: string
  started_at: string
  spec_path?: string
}

interface PhaseConfig {
  maxPhase: number
  prompts: Record<number, string>
  completionCheck?: (state: LoopState, directory: string) => boolean
}

const LOOP_CONFIGS: Record<string, PhaseConfig> = {
  prd: {
    maxPhase: 4,
    prompts: {
      2: "Continue to Phase 2: Interview + Exploration. Ask 8-10 questions covering core problem, success criteria, MVP scope, technical constraints, UX flows, edge cases, error states, and tradeoffs.",
      3: "Continue to Phase 3: Spec Write. Write a comprehensive specification to plans/{feature_name}/spec.md including Implementation Stories section.",
      4: "Continue to Phase 4: Task Handoff. Use todowrite to create tasks from the spec's Implementation Stories section. Each story becomes a todo item with id, content (title + key acceptance criteria), status: pending, and priority based on dependencies.",
    },
    completionCheck: (state, directory) => {
      // Phase 3 auto-completes if spec file exists
      if (state.current_phase === 3 && state.feature_name) {
        const specPath = join(directory, "plans", state.feature_name, "spec.md")
        return existsSync(specPath)
      }
      return false
    },
  },
  ut: {
    maxPhase: 2,
    prompts: {
      2: "Continue to Phase 2: Task Handoff. Use todowrite to create tasks for each test gap identified. Include file path, current coverage, and key test scenarios in each task content.",
    },
  },
  e2e: {
    maxPhase: 2,
    prompts: {
      2: "Continue to Phase 2: Task Handoff. Use todowrite to create tasks for each critical user flow. Include flow description and key steps in each task content.",
    },
  },
}

// Regex to find phase completion markers
const PHASE_MARKER_REGEX = /<phase_complete\s+phase="(\d+)"(?:\s+(\w+)="([^"]*)")*\s*\/?>/g
const PROMISE_MARKER_REGEX = /<promise>([^<]+)<\/promise>/g

function findLoopStateFile(directory: string): { path: string; state: LoopState } | null {
  const opencodeDir = join(directory, ".opencode")
  
  if (!existsSync(opencodeDir)) {
    return null
  }

  const files = readdirSync(opencodeDir)
  
  // Look for any loop state file
  for (const loopType of ["prd", "ut", "e2e"]) {
    const pattern = new RegExp(`^${loopType}-loop-.*\\.local\\.md$`)
    const stateFile = files.find(f => pattern.test(f))
    
    if (stateFile) {
      const filePath = join(opencodeDir, stateFile)
      try {
        const content = readFileSync(filePath, "utf-8")
        // Parse YAML frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/)
        if (match) {
          const state = yaml.parse(match[1]) as LoopState
          return { path: filePath, state }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return null
}

function parsePhaseMarker(text: string): { phase: number; attributes: Record<string, string> } | null {
  // Find the LAST phase marker (in case there are examples in the text)
  let lastMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null

  const regex = new RegExp(PHASE_MARKER_REGEX.source, "g")
  while ((match = regex.exec(text)) !== null) {
    lastMatch = match
  }

  if (!lastMatch) {
    return null
  }

  const phase = parseInt(lastMatch[1], 10)
  const attributes: Record<string, string> = {}

  // Parse additional attributes like feature_name="auth"
  const attrRegex = /(\w+)="([^"]*)"/g
  let attrMatch: RegExpExecArray | null
  while ((attrMatch = attrRegex.exec(lastMatch[0])) !== null) {
    if (attrMatch[1] !== "phase") {
      attributes[attrMatch[1]] = attrMatch[2]
    }
  }

  return { phase, attributes }
}

function hasPromiseMarker(text: string): boolean {
  return PROMISE_MARKER_REGEX.test(text)
}

function updateLoopState(filePath: string, state: LoopState): void {
  const frontmatter = yaml.stringify(state)
  const content = `---\n${frontmatter}---\n`
  writeFileSync(filePath, content)
}

export const LoopControllerPlugin: Plugin = async ({ client, directory, $ }) => {
  await client.app.log({
    body: {
      service: "loop-controller",
      level: "info",
      message: "Loop controller initialized",
    },
  })

  return {
    "session.idle": async ({ sessionId }) => {
      try {
        // Check if there's an active loop
        const loopInfo = findLoopStateFile(directory)
        if (!loopInfo) {
          return // No active loop
        }

        const { path: statePath, state } = loopInfo
        const config = LOOP_CONFIGS[state.loop_type]

        if (!config) {
          await client.app.log({
            body: {
              service: "loop-controller",
              level: "warn",
              message: `Unknown loop type: ${state.loop_type}`,
            },
          })
          return
        }

        // Get the last assistant message to check for phase markers
        // Note: We need to get this from the session somehow
        // For now, we'll rely on the state file being updated by the commands
        
        // Check if auto-completion criteria are met
        if (config.completionCheck && config.completionCheck(state, directory)) {
          await client.app.log({
            body: {
              service: "loop-controller",
              level: "info",
              message: `Phase ${state.current_phase} auto-completed via file detection`,
            },
          })
          
          // Advance to next phase
          state.current_phase += 1
          updateLoopState(statePath, state)
        }

        // Check if we need to continue
        if (state.current_phase >= config.maxPhase) {
          await client.app.log({
            body: {
              service: "loop-controller",
              level: "info",
              message: `Loop ${state.loop_type} completed all ${config.maxPhase} phases`,
            },
          })
          return // All phases complete
        }

        // Get the prompt for the next phase
        const nextPhase = state.current_phase + 1
        let prompt = config.prompts[nextPhase]

        if (!prompt) {
          return // No prompt defined for this phase
        }

        // Replace placeholders in prompt
        if (state.feature_name) {
          prompt = prompt.replace(/{feature_name}/g, state.feature_name)
        }

        await client.app.log({
          body: {
            service: "loop-controller",
            level: "info",
            message: `Advancing to phase ${nextPhase} of ${state.loop_type} loop`,
          },
        })

        // Send follow-up message to continue the loop
        // Using the client SDK to send a message programmatically
        await client.message.create({
          body: {
            sessionId,
            content: prompt,
          },
        })

      } catch (error) {
        await client.app.log({
          body: {
            service: "loop-controller",
            level: "error",
            message: `Loop controller error: ${error}`,
          },
        })
      }
    },

    // Also listen for message updates to detect phase completion markers
    "message.updated": async ({ message }) => {
      if (message.role !== "assistant") {
        return
      }

      // Check for phase completion marker in the message content
      const content = typeof message.content === "string" 
        ? message.content 
        : JSON.stringify(message.content)

      const phaseInfo = parsePhaseMarker(content)
      if (!phaseInfo) {
        return
      }

      // Check for promise marker (loop complete)
      if (hasPromiseMarker(content)) {
        await client.app.log({
          body: {
            service: "loop-controller",
            level: "info",
            message: "Promise marker detected - loop complete",
          },
        })
        return
      }

      // Update loop state with the completed phase
      const loopInfo = findLoopStateFile(directory)
      if (!loopInfo) {
        return
      }

      const { path: statePath, state } = loopInfo

      if (phaseInfo.phase === state.current_phase) {
        // Phase completed, update state
        state.current_phase = phaseInfo.phase + 1

        // Capture attributes
        if (phaseInfo.attributes.feature_name) {
          state.feature_name = phaseInfo.attributes.feature_name
        }
        if (phaseInfo.attributes.spec_path) {
          state.spec_path = phaseInfo.attributes.spec_path
        }

        updateLoopState(statePath, state)

        await client.app.log({
          body: {
            service: "loop-controller",
            level: "info",
            message: `Phase ${phaseInfo.phase} marked complete, advancing to phase ${state.current_phase}`,
            extra: phaseInfo.attributes,
          },
        })
      }
    },
  }
}
