import { promises as fs } from "fs";
import path from "path";
import type { QuestionDetailResponse } from "./leetcode-client";
import type { BankEntryOut } from "./build-bank-entry";

const LC_JSON_PATH = path.resolve(__dirname, "../../src/data/leetcode-problems.json");
const BANK_PATH = path.resolve(__dirname, "../../src/lib/dsa-knowledge-bank.ts");
const MARKER = "// === INGEST_MARKER ===";

async function atomicWrite(target: string, content: string): Promise<void> {
  const tmp = `${target}.tmp`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, target);
}

export async function appendToLeetcodeJson(details: QuestionDetailResponse[]): Promise<number> {
  const raw = await fs.readFile(LC_JSON_PATH, "utf8");
  const obj = JSON.parse(raw) as Record<string, QuestionDetailResponse>;
  let added = 0;
  for (const d of details) {
    const key = d.questionFrontendId;
    if (!(key in obj)) {
      obj[key] = d;
      added += 1;
    }
  }
  // Pretty-print to match existing formatting (2-space indent, trailing newline)
  const out = JSON.stringify(obj, null, 2) + "\n";
  await atomicWrite(LC_JSON_PATH, out);
  return added;
}

export function serializeBankEntry(entry: BankEntryOut, indent = "    "): string {
  // Hand-formatted to match existing dsa-knowledge-bank.ts style.
  const i = indent;
  const i2 = indent + "  ";
  const i3 = indent + "    ";
  const p = entry.problem;
  return [
    `${i}{`,
    `${i2}problem: {`,
    `${i3}id: ${JSON.stringify(p.id)},`,
    `${i3}title: ${JSON.stringify(p.title)},`,
    `${i3}topic: ${JSON.stringify(p.topic)},`,
    `${i3}difficulty: ${JSON.stringify(p.difficulty)},`,
    `${i3}leetcodeNumber: ${p.leetcodeNumber},`,
    `${i3}companies: ${JSON.stringify(p.companies)},`,
    `${i3}tags: ${JSON.stringify(p.tags)},`,
    `${i3}url: ${JSON.stringify(p.url)},`,
    `${i3}approach: ${JSON.stringify(p.approach)},`,
    `${i3}timeComplexity: ${JSON.stringify(p.timeComplexity)},`,
    `${i3}spaceComplexity: ${JSON.stringify(p.spaceComplexity)},`,
    `${i2}},`,
    `${i2}interviewSignal: ${JSON.stringify(entry.interviewSignal)},`,
    `${i2}canonicalCases: [],`,
    `${i}},`,
  ].join("\n");
}

export async function appendToBankFile(entries: BankEntryOut[]): Promise<void> {
  if (entries.length === 0) return;
  const src = await fs.readFile(BANK_PATH, "utf8");
  const markerIdx = src.indexOf(MARKER);
  if (markerIdx === -1) {
    throw new Error(`INGEST_MARKER not found in ${BANK_PATH}. Run Task 1 first.`);
  }
  // Find start of the marker line so we can insert before its leading whitespace.
  const lineStart = src.lastIndexOf("\n", markerIdx) + 1;
  const insertion = entries.map((e) => serializeBankEntry(e)).join("\n") + "\n";
  const next = src.slice(0, lineStart) + insertion + src.slice(lineStart);
  await atomicWrite(BANK_PATH, next);
}

if (require.main === module) {
  const sample: BankEntryOut = {
    problem: {
      id: "kb-099-foo",
      title: "Foo",
      topic: "stack",
      difficulty: "easy",
      leetcodeNumber: 999,
      companies: ["google"],
      tags: ["stack"],
      url: "https://leetcode.com/problems/foo/",
      approach: "",
      timeComplexity: "",
      spaceComplexity: "",
    },
    interviewSignal: "test",
    canonicalCases: [],
  };
  const out = serializeBankEntry(sample);
  console.log(out);
  const assert = require("node:assert/strict");
  assert.ok(out.includes(`leetcodeNumber: 999,`));
  assert.ok(out.includes(`canonicalCases: [],`));
  assert.ok(out.startsWith("    {"));
  console.log("file-writers serializer self-test: passed");
}
