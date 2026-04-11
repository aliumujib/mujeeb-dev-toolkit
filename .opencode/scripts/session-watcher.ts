#!/usr/bin/env bun
/**
 * Session Watcher - Auto-imports new OpenCode sessions into Cipher
 * 
 * This script watches ~/.opencode/qmd-sessions/ for new session files
 * and automatically imports them into Cipher's knowledge memory.
 * 
 * Usage:
 *   bun run .opencode/scripts/session-watcher.ts
 *   
 * Or run as a background service:
 *   nohup bun run .opencode/scripts/session-watcher.ts > ~/.opencode/session-watcher.log 2>&1 &
 */

import { watch } from "fs";
import { readFile, readdir, writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";

const SESSIONS_DIR = join(homedir(), ".opencode", "qmd-sessions");
const STATE_FILE = join(homedir(), ".opencode", "session-watcher-state.json");
const CIPHER_DATA_DIR = join(homedir(), ".local", "share", "cipher-mcp", "data");

interface SessionData {
  sessionId: string;
  slug: string;
  projectId: string;
  directory: string;
  created: string;
  highlights: string;
  insights: string;
}

interface WatcherState {
  importedSessions: string[];
  lastRun: string;
}

async function loadState(): Promise<WatcherState> {
  try {
    const content = await readFile(STATE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { importedSessions: [], lastRun: new Date().toISOString() };
  }
}

async function saveState(state: WatcherState): Promise<void> {
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function parseSession(content: string, filename: string): SessionData | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const sessionId = frontmatter.match(/session_id:\s*(.+)/)?.[1]?.trim() || filename;
  const slug = frontmatter.match(/slug:\s*(.+)/)?.[1]?.trim() || "unknown";
  const projectId = frontmatter.match(/project_id:\s*(.+)/)?.[1]?.trim() || "unknown";
  const directory = frontmatter.match(/directory:\s*(.+)/)?.[1]?.trim() || "";
  const created = frontmatter.match(/created:\s*(.+)/)?.[1]?.trim() || "";

  const highlightsMatch = content.match(/## Conversation Highlights\n([\s\S]*?)(?=\n## |$)/);
  const highlights = highlightsMatch?.[1]?.trim() || "";

  const insightsMatch = content.match(/## Key Insights\n([\s\S]*?)(?=\n## |$)/);
  const insights = insightsMatch?.[1]?.trim() || "";

  if (!highlights && !insights) return null;

  return { sessionId, slug, projectId, directory, created, highlights, insights };
}

function formatForCipher(session: SessionData): string {
  const projectName = session.directory.split("/").pop() || "unknown";
  
  return `Session: ${session.slug} (${session.sessionId})
Project: ${projectName}
Directory: ${session.directory}
Date: ${session.created}

Conversation:
${session.highlights}

Key Insights:
${session.insights}`.trim();
}

async function importToCipher(session: SessionData): Promise<boolean> {
  const projectName = session.directory.split("/").pop() || "unknown";
  const interaction = formatForCipher(session);
  
  // Store as a JSON file for Cipher to process
  // This is a simple approach - in production, you'd call Cipher's API directly
  const importDir = join(CIPHER_DATA_DIR, "pending-imports");
  await mkdir(importDir, { recursive: true });
  
  const importFile = join(importDir, `${session.sessionId}.json`);
  const importData = {
    interaction,
    metadata: {
      projectId: projectName,
      source: "session-auto-import",
      sessionId: session.sessionId,
      created: session.created,
      importedAt: new Date().toISOString()
    }
  };
  
  await writeFile(importFile, JSON.stringify(importData, null, 2));
  return true;
}

async function processSession(filename: string, state: WatcherState): Promise<boolean> {
  if (state.importedSessions.includes(filename)) {
    return false; // Already imported
  }

  const filepath = join(SESSIONS_DIR, filename);
  const content = await readFile(filepath, "utf-8");
  const session = parseSession(content, filename);
  
  if (!session) {
    console.log(`⏭️  Skipping ${filename} (no content)`);
    return false;
  }

  const projectName = session.directory.split("/").pop() || "unknown";
  console.log(`\n📝 Importing: ${session.slug}`);
  console.log(`   Project: ${projectName}`);
  console.log(`   Date: ${session.created}`);

  const success = await importToCipher(session);
  
  if (success) {
    state.importedSessions.push(filename);
    console.log(`   ✅ Queued for import`);
  }
  
  return success;
}

async function processAllSessions(): Promise<void> {
  console.log("🔍 Scanning for new sessions...");
  const state = await loadState();
  
  const files = await readdir(SESSIONS_DIR);
  const mdFiles = files.filter(f => f.endsWith(".md")).sort();
  
  let imported = 0;
  let skipped = 0;
  
  for (const file of mdFiles) {
    try {
      const wasImported = await processSession(file, state);
      if (wasImported) imported++;
      else skipped++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
  
  state.lastRun = new Date().toISOString();
  await saveState(state);
  
  console.log(`\n📊 Summary: ${imported} imported, ${skipped} skipped`);
}

async function watchSessions(): Promise<void> {
  console.log("👁️  Watching for new sessions...");
  console.log(`   Directory: ${SESSIONS_DIR}`);
  
  const state = await loadState();
  
  watch(SESSIONS_DIR, async (eventType, filename) => {
    if (!filename || !filename.endsWith(".md")) return;
    if (eventType !== "rename" && eventType !== "change") return;
    
    // Debounce - wait for file to be fully written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const wasImported = await processSession(filename, state);
      if (wasImported) {
        await saveState(state);
      }
    } catch (error) {
      // File might not exist yet or be incomplete
    }
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  console.log("🧠 Cipher Session Importer");
  console.log("==========================\n");
  
  if (args.includes("--once")) {
    // Process all sessions once and exit
    await processAllSessions();
  } else if (args.includes("--watch")) {
    // Process existing, then watch for new
    await processAllSessions();
    await watchSessions();
    // Keep process alive
    await new Promise(() => {});
  } else {
    // Default: process all sessions once
    await processAllSessions();
  }
}

main().catch(console.error);
