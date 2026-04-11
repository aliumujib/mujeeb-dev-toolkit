#!/usr/bin/env bun
/**
 * Process Pending Cipher Imports
 * 
 * This script processes JSON files queued by session-watcher.ts
 * and imports them into Cipher via the MCP protocol.
 * 
 * Usage:
 *   bun run .opencode/scripts/process-cipher-imports.ts [--dry-run] [--limit N]
 * 
 * Note: This outputs import commands that should be run within OpenCode
 * where the Cipher MCP is available.
 */

import { readFile, readdir, unlink, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const PENDING_DIR = join(homedir(), ".local", "share", "cipher-mcp", "data", "pending-imports");
const PROCESSED_DIR = join(homedir(), ".local", "share", "cipher-mcp", "data", "processed-imports");

interface ImportData {
  interaction: string;
  metadata: {
    projectId: string;
    source: string;
    sessionId: string;
    created: string;
    importedAt: string;
  };
}

async function listPending(): Promise<string[]> {
  try {
    const files = await readdir(PENDING_DIR);
    return files.filter(f => f.endsWith(".json"));
  } catch {
    return [];
  }
}

async function processSingle(filename: string, dryRun: boolean): Promise<boolean> {
  const filepath = join(PENDING_DIR, filename);
  const content = await readFile(filepath, "utf-8");
  const data: ImportData = JSON.parse(content);
  
  console.log(`\n📝 Processing: ${data.metadata.sessionId}`);
  console.log(`   Project: ${data.metadata.projectId}`);
  console.log(`   Source: ${data.metadata.source}`);
  console.log(`   Content: ${data.interaction.length} chars`);
  
  if (dryRun) {
    console.log("   [DRY RUN] Would import to Cipher");
    return true;
  }
  
  // Output the MCP call format for manual execution
  // In a real scenario, you'd use an MCP client library
  console.log(`\n   📤 MCP Call:`);
  console.log(`   cipher_extract_and_operate_memory({`);
  console.log(`     interaction: "${data.interaction.substring(0, 100)}...",`);
  console.log(`     memoryMetadata: ${JSON.stringify(data.metadata)},`);
  console.log(`     options: { autoExtractKnowledgeInfo: true, confidenceThreshold: 0.5 }`);
  console.log(`   })`);
  
  // Move to processed
  await mkdir(PROCESSED_DIR, { recursive: true });
  await writeFile(join(PROCESSED_DIR, filename), content);
  await unlink(filepath);
  
  console.log(`   ✅ Moved to processed`);
  return true;
}

async function generateBatchScript(files: string[]): Promise<void> {
  const batchFile = join(PENDING_DIR, "..", "batch-import.json");
  const imports: ImportData[] = [];
  
  for (const file of files) {
    const content = await readFile(join(PENDING_DIR, file), "utf-8");
    imports.push(JSON.parse(content));
  }
  
  await writeFile(batchFile, JSON.stringify(imports, null, 2));
  console.log(`\n📄 Batch file created: ${batchFile}`);
  console.log(`   Contains ${imports.length} imports ready for processing`);
  console.log(`\n   To import in OpenCode, use this pattern for each entry:`);
  console.log(`   cipher_extract_and_operate_memory({ interaction, memoryMetadata, options })`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find(a => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 0;
  const batch = args.includes("--batch");
  
  console.log("🧠 Cipher Import Processor");
  console.log("==========================\n");
  
  const pending = await listPending();
  console.log(`📂 Found ${pending.length} pending imports`);
  
  if (pending.length === 0) {
    console.log("\n✨ No pending imports. Run session-watcher.ts first.");
    return;
  }
  
  if (batch) {
    // Generate a batch file for bulk processing
    await generateBatchScript(pending);
    return;
  }
  
  const toProcess = limit > 0 ? pending.slice(0, limit) : pending;
  
  if (dryRun) {
    console.log("🏃 DRY RUN mode\n");
  }
  
  let processed = 0;
  let failed = 0;
  
  for (const file of toProcess) {
    try {
      await processSingle(file, dryRun);
      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      failed++;
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Remaining: ${pending.length - processed}`);
}

main().catch(console.error);
