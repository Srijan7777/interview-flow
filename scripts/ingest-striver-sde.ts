// Idempotent ingest of LeetCode favorite list "eeudwo2i" into the DSA knowledge bank.
// Run: npx tsx scripts/ingest-striver-sde.ts [--dry-run] [--limit N]
//
// What it does:
//  1. Fetches the 117-problem list via LC GraphQL.
//  2. Skips any LC# already present in src/lib/dsa-knowledge-bank.ts.
//  3. For each new problem: fetches full detail, appends to leetcode-problems.json,
//     appends a skeleton bank entry to dsa-knowledge-bank.ts (before INGEST_MARKER).
//  4. Prints a summary.

import { promises as fs } from "fs";
import path from "path";
import { fetchFavoriteList, fetchQuestionDetail, sleep } from "./lib/leetcode-client";
import { readExistingLeetcodeNumbers, nextSequence } from "./lib/read-existing";
import { buildBankEntry } from "./lib/build-bank-entry";
import { appendToLeetcodeJson, appendToBankFile } from "./lib/file-writers";

const FAVORITE_SLUG = "eeudwo2i";
const POLITE_DELAY_MS = 500;
const LOG_PATH = path.resolve(__dirname, "ingest.log");

async function log(msg: string): Promise<void> {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  await fs.appendFile(LOG_PATH, line, "utf8").catch(() => {});
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  await log(`Starting ingest. dry-run=${dryRun} limit=${limit === Infinity ? "all" : limit}`);

  const list = await fetchFavoriteList(FAVORITE_SLUG);
  await log(`Fetched ${list.length} problems from favorite ${FAVORITE_SLUG}`);

  const existing = await readExistingLeetcodeNumbers();
  await log(`Existing bank has ${existing.size} problems`);

  let seq = await nextSequence();
  const toIngest = list.filter((p) => !existing.has(parseInt(p.questionFrontendId, 10))).slice(0, limit);
  await log(`Will ingest ${toIngest.length} new problems (skipping ${list.length - toIngest.length} duplicates)`);

  if (toIngest.length === 0) {
    await log("Nothing to do.");
    return;
  }

  const newEntries = [];
  const newDetails = [];
  let failed = 0;

  for (let i = 0; i < toIngest.length; i++) {
    const summary = toIngest[i];
    try {
      await log(`[${i + 1}/${toIngest.length}] LC#${summary.questionFrontendId} ${summary.title} (${summary.titleSlug})`);
      const detail = await fetchQuestionDetail(summary.titleSlug);
      const entry = buildBankEntry(summary, seq);
      newEntries.push(entry);
      newDetails.push(detail);
      seq += 1;
    } catch (e) {
      failed += 1;
      await log(`  FAILED: ${(e as Error).message}`);
    }
    await sleep(POLITE_DELAY_MS);
  }

  if (dryRun) {
    await log(`DRY RUN complete. Would add ${newEntries.length} bank entries + ${newDetails.length} JSON details. Failed: ${failed}.`);
    await log(`Sample bank entry: ${JSON.stringify(newEntries[0]?.problem, null, 2)}`);
    return;
  }

  await log("Writing leetcode-problems.json...");
  const addedJson = await appendToLeetcodeJson(newDetails);
  await log(`  added ${addedJson} JSON entries`);

  await log("Writing dsa-knowledge-bank.ts...");
  await appendToBankFile(newEntries);
  await log(`  added ${newEntries.length} bank entries`);

  await log(`DONE. Added: ${newEntries.length}. Failed: ${failed}. Existing skipped: ${list.length - toIngest.length}.`);
}

main().catch((e) => {
  console.error("INGEST FAILED:", e);
  process.exit(1);
});
