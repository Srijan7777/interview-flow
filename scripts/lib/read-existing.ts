import { promises as fs } from "fs";
import path from "path";

const BANK_PATH = path.resolve(__dirname, "../../src/lib/dsa-knowledge-bank.ts");

export async function readBankSource(): Promise<string> {
  return await fs.readFile(BANK_PATH, "utf8");
}

export async function readExistingLeetcodeNumbers(): Promise<Set<number>> {
  const src = await readBankSource();
  const matches = src.matchAll(/leetcodeNumber:\s*(\d+)/g);
  const out = new Set<number>();
  for (const m of matches) out.add(parseInt(m[1], 10));
  return out;
}

export async function nextSequence(): Promise<number> {
  const src = await readBankSource();
  // ids look like "kb-NNN-slug" — find the largest NNN
  const matches = src.matchAll(/id:\s*"kb-(\d+)-/g);
  let max = 0;
  for (const m of matches) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max + 1;
}

if (require.main === module) {
  const assert = require("node:assert/strict");
  (async () => {
    const existing = await readExistingLeetcodeNumbers();
    assert.ok(existing.has(1), "expected LC #1 (Two Sum) in existing bank");
    assert.ok(existing.has(146), "expected LC #146 (LRU Cache) in existing bank");
    assert.ok(existing.size >= 30, `expected >= 30 existing problems, got ${existing.size}`);
    const seq = await nextSequence();
    assert.ok(seq > 30, `expected next seq > 30, got ${seq}`);
    console.log(`read-existing self-test: ${existing.size} problems, next seq = ${seq}`);
  })();
}
