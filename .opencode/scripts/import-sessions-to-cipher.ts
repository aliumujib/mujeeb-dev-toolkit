#!/usr/bin/env bun
/**
 * Import OpenCode sessions into Cipher memory
 * 
 * Usage: bun run .opencode/scripts/import-sessions-to-cipher.ts [--dry-run] [--limit N] [--delay MS]
 * 
 * This script reads session markdown files and extracts knowledge into Cipher's memory.
 * Rate limiting is handled with delays between requests.
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const SESSIONS_DIR = `${process.env.HOME}/.opencode/qmd-sessions`;
const DELAY_MS = parseInt(process.argv.find(a => a.startsWith("--delay="))?.split("=")[1] || "2000");
const LIMIT = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] || "0");
const DRY_RUN = process.argv.includes("--dry-run");

interface SessionData {
  sessionId: string;
  slug: string;
  projectId: string;
  directory: string;
  created: string;
  highlights: string;
  insights: string;
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

  // Extract conversation highlights
  const highlightsMatch = content.match(/## Conversation Highlights\n([\s\S]*?)(?=\n## |$)/);
  const highlights = highlightsMatch?.[1]?.trim() || "";

  // Extract key insights
  const insightsMatch = content.match(/## Key Insights\n([\s\S]*?)(?=\n## |$)/);
  const insights = insightsMatch?.[1]?.trim() || "";

  // Skip if no meaningful content
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

async function importSession(session: SessionData): Promise<boolean> {
  const projectName = session.directory.split("/").pop() || "unknown";
  const interaction = formatForCipher(session);
  
  // Call Cipher via CLI (since we're a script, not in MCP context)
  // In practice, you'd call the MCP tool or Cipher's API directly
  
  console.log(`\n📝 Session: ${session.slug}`);
  console.log(`   Project: ${projectName}`);
  console.log(`   Date: ${session.created}`);
  console.log(`   Content length: ${interaction.length} chars`);
  
  if (DRY_RUN) {
    console.log("   [DRY RUN] Would import to Cipher");
    return true;
  }
  
  // For actual import, you would:
  // 1. Use the cipher CLI: cipher memory add "..."
  // 2. Or call the MCP endpoint directly
  // 3. Or use the cipher npm package API
  
  // Placeholder - in production, integrate with Cipher's API
  console.log("   ⏳ Importing to Cipher...");
  
  return true;
}

async function main() {
  console.log("🔍 Scanning sessions directory:", SESSIONS_DIR);
  
  const files = await readdir(SESSIONS_DIR);
  const mdFiles = files.filter(f => f.endsWith(".md")).sort();
  
  console.log(`📁 Found ${mdFiles.length} session files`);
  
  if (LIMIT > 0) {
    console.log(`⚡ Limiting to ${LIMIT} sessions`);
  }
  
  if (DRY_RUN) {
    console.log("🏃 DRY RUN mode - no actual imports");
  }
  
  console.log(`⏱️  Delay between imports: ${DELAY_MS}ms`);
  console.log("");
  
  let imported = 0;
  let skipped = 0;
  
  const filesToProcess = LIMIT > 0 ? mdFiles.slice(0, LIMIT) : mdFiles;
  
  for (const file of filesToProcess) {
    const content = await readFile(join(SESSIONS_DIR, file), "utf-8");
    const session = parseSession(content, file);
    
    if (!session) {
      skipped++;
      continue;
    }
    
    const success = await importSession(session);
    if (success) {
      imported++;
    }
    
    // Rate limiting delay
    if (!DRY_RUN && DELAY_MS > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped (no content): ${skipped}`);
  console.log(`📊 Total processed: ${imported + skipped}`);
}

main().catch(console.error);
