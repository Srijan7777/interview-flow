# Striver DSA Bank Ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ingest ~104 net-new DSA problems from LeetCode favorite list `eeudwo2i` (117 total, ~13 already in bank) into `src/lib/dsa-knowledge-bank.ts` + `src/data/leetcode-problems.json` via an idempotent Node script.

**Architecture:** Single TS script (`scripts/ingest-striver-sde.ts`) using two-step LeetCode GraphQL: (1) `favoriteQuestionList` for the 117-entry list with topic tags, (2) `getQuestion` per slug for full detail (description, code stubs, examples, hints). Writes are atomic (`*.tmp` → rename). Topic taxonomy expanded from 11 → 20 buckets. Submit button gated on empty `canonicalCases` until phase-2 AI fill.

**Tech Stack:** Node.js, TypeScript, `npx tsx`, LeetCode public GraphQL endpoint. No test framework — minimal inline `node:assert` self-checks.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/dsa-knowledge-bank.ts` | Modify | Expand `rotation` array 11→20. Add `// === INGEST_MARKER ===` comment marker before closing `]` of `problems` array. |
| `scripts/lib/map-topic.ts` | Create | Pure: `mapTopic(lcTagNames: string[]): string` — first-match priority logic. Self-tests via `--self-test`. |
| `scripts/lib/leetcode-client.ts` | Create | Functions: `fetchFavoriteList(slug)`, `fetchQuestionDetail(slug)`. Wraps GraphQL, retries, 500ms politeness sleep. |
| `scripts/lib/build-bank-entry.ts` | Create | Pure: `buildBankEntry(lcSummary, lcDetail, sequence): KnowledgeBankEntry` — produces skeleton entry. |
| `scripts/lib/read-existing.ts` | Create | `readExistingLeetcodeNumbers(): Set<number>` + `nextSequence(): number` — regex-scan bank file. |
| `scripts/lib/file-writers.ts` | Create | `appendToLeetcodeJson(entries)`, `appendToBankFile(serializedEntries)` — atomic via `*.tmp`. |
| `scripts/ingest-striver-sde.ts` | Create | Main orchestrator. Flags: `--dry-run`, `--self-test`, `--limit N`. |
| `src/app/api/test/route.ts` | Modify | Add guard: empty `canonicalCases` → return `{ ok: false, draft: true, message }`. |
| `src/app/session/dsa/solve/page.tsx` | Modify | If response has `draft: true`, disable Submit + show tooltip. |
| `package.json` | Modify | Add `ingest:striver`, `ingest:dry`, `ingest:self-test` scripts. |
| `scripts/ingest.log` | Create at runtime | Append-only log of each run. Gitignored. |
| `.gitignore` | Modify | Add `scripts/ingest.log` and `scripts/*.tmp`. |

---

## Task 1: Prep the bank file (rotation expansion + marker)

**Files:**
- Modify: `src/lib/dsa-knowledge-bank.ts`

- [ ] **Step 1: Replace the `rotation` array (line ~48-60) with the 20-bucket version**

In `src/lib/dsa-knowledge-bank.ts`, replace:

```ts
  rotation: [
    "arrays-and-hashing",
    "stack",
    "sliding-window",
    "two-pointers",
    "intervals",
    "binary-search",
    "heap",
    "graphs",
    "dynamic-programming",
    "design",
    "trie",
  ],
```

with:

```ts
  rotation: [
    "arrays-and-hashing",
    "strings",
    "two-pointers",
    "sliding-window",
    "binary-search",
    "stack",
    "linked-list",
    "binary-tree",
    "bst",
    "heap",
    "graphs",
    "trie",
    "dynamic-programming",
    "greedy",
    "recursion",
    "backtracking",
    "bit-manipulation",
    "math",
    "intervals",
    "design",
  ],
```

- [ ] **Step 2: Add the INGEST_MARKER right before the closing `]` of the `problems` array**

Find the last problem entry. After its closing `},`, before the `]` that closes `problems:`, insert:

```ts
    // === INGEST_MARKER === (do not remove — used by scripts/ingest-striver-sde.ts to splice new entries)
```

The result looks like (last existing entry → marker → close array):

```ts
    {
      problem: { ... },          // last existing problem
      interviewSignal: "...",
      canonicalCases: [ ... ],
    },
    // === INGEST_MARKER === (do not remove — used by scripts/ingest-striver-sde.ts to splice new entries)
  ],
};
```

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `cd C:/Users/Admin/interview-web && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors related to `dsa-knowledge-bank.ts`.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Admin/interview-web
git add src/lib/dsa-knowledge-bank.ts
git commit -m "chore: expand DSA topic rotation 11→20, add ingest marker

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Topic mapper (`scripts/lib/map-topic.ts`)

**Files:**
- Create: `scripts/lib/map-topic.ts`

- [ ] **Step 1: Create the file with the priority-ordered mapper**

```ts
// Maps LeetCode topic-tag names to our 20-bucket taxonomy.
// First match wins. Order matters — more specific tags listed before general.

const RULES: { match: string[]; bucket: string }[] = [
  { match: ["Linked List"], bucket: "linked-list" },
  { match: ["Binary Search Tree"], bucket: "bst" },
  { match: ["Tree", "Binary Tree"], bucket: "binary-tree" },
  { match: ["Trie"], bucket: "trie" },
  { match: ["Graph", "Depth-First Search", "Breadth-First Search", "Topological Sort", "Union Find"], bucket: "graphs" },
  { match: ["Heap (Priority Queue)", "Heap", "Priority Queue"], bucket: "heap" },
  { match: ["Dynamic Programming"], bucket: "dynamic-programming" },
  { match: ["Backtracking"], bucket: "backtracking" },
  { match: ["Greedy"], bucket: "greedy" },
  { match: ["Bit Manipulation"], bucket: "bit-manipulation" },
  { match: ["Sliding Window"], bucket: "sliding-window" },
  { match: ["Two Pointers"], bucket: "two-pointers" },
  { match: ["Binary Search"], bucket: "binary-search" },
  { match: ["Monotonic Stack", "Stack"], bucket: "stack" },
  { match: ["Recursion"], bucket: "recursion" },
  { match: ["String"], bucket: "strings" },
  { match: ["Math", "Number Theory"], bucket: "math" },
];

// Hand-overrides for known LC-tag-vs-our-taxonomy mismatches.
// Key = LC questionFrontendId.
const OVERRIDES: Record<string, string> = {
  "200": "graphs",      // Number of Islands — tagged Array+DFS, but it's a graph problem
  "994": "graphs",      // Rotting Oranges
  "133": "graphs",      // Clone Graph (already correct via DFS rule, but explicit)
};

export function mapTopic(lcTagNames: string[], questionFrontendId?: string): string {
  if (questionFrontendId && OVERRIDES[questionFrontendId]) {
    return OVERRIDES[questionFrontendId];
  }
  for (const rule of RULES) {
    if (rule.match.some((tag) => lcTagNames.includes(tag))) {
      return rule.bucket;
    }
  }
  return "arrays-and-hashing";
}
```

- [ ] **Step 2: Add a self-test block at the end of the file**

Append to `scripts/lib/map-topic.ts`:

```ts
// Self-test: run via `npx tsx scripts/lib/map-topic.ts`
if (require.main === module) {
  const assert = require("node:assert/strict");
  assert.equal(mapTopic(["Linked List", "Math"]), "linked-list");
  assert.equal(mapTopic(["Math", "Linked List"]), "linked-list");
  assert.equal(mapTopic(["Binary Search Tree", "Tree"]), "bst");
  assert.equal(mapTopic(["Tree"]), "binary-tree");
  assert.equal(mapTopic(["Hash Table", "Array"]), "arrays-and-hashing");
  assert.equal(mapTopic(["Array", "Depth-First Search"], "200"), "graphs");
  assert.equal(mapTopic(["String"]), "strings");
  assert.equal(mapTopic(["Greedy", "Array"]), "greedy");
  assert.equal(mapTopic(["Heap (Priority Queue)"]), "heap");
  assert.equal(mapTopic(["Bit Manipulation", "Math"]), "bit-manipulation");
  console.log("map-topic self-test: 10/10 passed");
}
```

- [ ] **Step 3: Run the self-test and verify all 10 pass**

Run: `cd C:/Users/Admin/interview-web && npx tsx scripts/lib/map-topic.ts`
Expected: `map-topic self-test: 10/10 passed`

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/map-topic.ts
git commit -m "feat(ingest): topic mapper for 20-bucket taxonomy

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Bank entry builder (`scripts/lib/build-bank-entry.ts`)

**Files:**
- Create: `scripts/lib/build-bank-entry.ts`

- [ ] **Step 1: Create the builder + the input/output shapes**

```ts
import { mapTopic } from "./map-topic";

export type LcSummary = {
  questionFrontendId: string;
  titleSlug: string;
  title: string;
  difficulty: string; // "EASY" | "MEDIUM" | "HARD"
  topicTags: { name: string; slug: string }[];
};

export type LcDetail = {
  // not consumed here directly — passed through to leetcode-problems.json by the writer
  // but we may use codeSnippets to assert at least one common language exists
  codeSnippets?: { lang: string; langSlug: string; code: string }[];
};

// Shape mirrors KnowledgeBankEntry in src/lib/dsa-knowledge-bank.ts.
// Kept structural here to avoid importing from src/ into scripts/.
export type BankEntryOut = {
  problem: {
    id: string;
    title: string;
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    leetcodeNumber: number;
    companies: string[];
    tags: string[];
    url: string;
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
  };
  interviewSignal: string;
  canonicalCases: Array<{ label: string; input: string; output: string; notes?: string }>;
};

const BIG_TECH = ["google", "amazon", "meta", "microsoft"];

export function buildBankEntry(summary: LcSummary, sequence: number): BankEntryOut {
  const lcNumber = parseInt(summary.questionFrontendId, 10);
  const topic = mapTopic(
    summary.topicTags.map((t) => t.name),
    summary.questionFrontendId
  );
  const difficulty = summary.difficulty.toLowerCase() as "easy" | "medium" | "hard";
  const seqStr = String(sequence).padStart(3, "0");

  return {
    problem: {
      id: `kb-${seqStr}-${summary.titleSlug}`,
      title: summary.title,
      topic,
      difficulty,
      leetcodeNumber: lcNumber,
      companies: BIG_TECH,
      tags: summary.topicTags.map((t) => t.slug),
      url: `https://leetcode.com/problems/${summary.titleSlug}/`,
      approach: "",
      timeComplexity: "",
      spaceComplexity: "",
    },
    interviewSignal: `Striver SDE list · ${difficulty} ${topic} problem.`,
    canonicalCases: [],
  };
}
```

- [ ] **Step 2: Add a self-test block**

Append to `scripts/lib/build-bank-entry.ts`:

```ts
if (require.main === module) {
  const assert = require("node:assert/strict");
  const out = buildBankEntry(
    {
      questionFrontendId: "73",
      titleSlug: "set-matrix-zeroes",
      title: "Set Matrix Zeroes",
      difficulty: "MEDIUM",
      topicTags: [{ name: "Array", slug: "array" }, { name: "Hash Table", slug: "hash-table" }, { name: "Matrix", slug: "matrix" }],
    },
    37
  );
  assert.equal(out.problem.id, "kb-037-set-matrix-zeroes");
  assert.equal(out.problem.leetcodeNumber, 73);
  assert.equal(out.problem.difficulty, "medium");
  assert.equal(out.problem.topic, "arrays-and-hashing");
  assert.equal(out.problem.url, "https://leetcode.com/problems/set-matrix-zeroes/");
  assert.equal(out.canonicalCases.length, 0);
  assert.equal(out.problem.approach, "");
  assert.deepEqual(out.problem.tags, ["array", "hash-table", "matrix"]);
  console.log("build-bank-entry self-test: 8/8 passed");
}
```

- [ ] **Step 3: Run the self-test**

Run: `cd C:/Users/Admin/interview-web && npx tsx scripts/lib/build-bank-entry.ts`
Expected: `build-bank-entry self-test: 8/8 passed`

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/build-bank-entry.ts
git commit -m "feat(ingest): bank entry skeleton builder

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Read existing state (`scripts/lib/read-existing.ts`)

**Files:**
- Create: `scripts/lib/read-existing.ts`

- [ ] **Step 1: Create the reader using regex on the bank file**

```ts
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
```

- [ ] **Step 2: Add a self-test that runs against the real bank file**

Append:

```ts
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
```

- [ ] **Step 3: Run the self-test**

Run: `cd C:/Users/Admin/interview-web && npx tsx scripts/lib/read-existing.ts`
Expected: prints `read-existing self-test: 36 problems, next seq = 37` (numbers may vary if bank changes).

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/read-existing.ts
git commit -m "feat(ingest): read existing LC numbers and sequence from bank

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: LeetCode GraphQL client (`scripts/lib/leetcode-client.ts`)

**Files:**
- Create: `scripts/lib/leetcode-client.ts`

- [ ] **Step 1: Create the client with two queries + retry**

```ts
const LC_GQL = "https://leetcode.com/graphql";
const UA = "Mozilla/5.0 (compatible; interview-web-ingest/1.0)";

export type FavoriteListResponse = {
  questionFrontendId: string;
  titleSlug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topicTags: { name: string; slug: string }[];
};

export type QuestionDetailResponse = {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  content: string;
  exampleTestcases: string;
  sampleTestCase: string;
  codeSnippets: { lang: string; langSlug: string; code: string }[];
  topicTags: { name: string; slug: string }[];
  hints: string[];
  similarQuestions: string;
  stats: string;
};

async function gql<T>(query: string, variables: Record<string, unknown>, attempt = 0): Promise<T> {
  const res = await fetch(LC_GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) {
    if (attempt >= 3) throw new Error("LC rate-limited after 3 retries");
    const wait = 1000 * Math.pow(2, attempt);
    console.warn(`LC 429, sleeping ${wait}ms then retrying...`);
    await sleep(wait);
    return gql<T>(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`LC HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new Error(`LC GQL errors: ${JSON.stringify(json.errors)}`);
  if (!json.data) throw new Error("LC response missing data");
  return json.data;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchFavoriteList(slug: string, limit = 250): Promise<FavoriteListResponse[]> {
  const query = `
    query favoriteQuestionList($favoriteSlug: String!, $limit: Int, $skip: Int) {
      favoriteQuestionList(favoriteSlug: $favoriteSlug, limit: $limit, skip: $skip) {
        questions {
          questionFrontendId
          titleSlug
          title
          difficulty
          topicTags { name slug }
        }
        totalLength
        hasMore
      }
    }
  `;
  type Wrap = { favoriteQuestionList: { questions: FavoriteListResponse[]; totalLength: number; hasMore: boolean } };
  const data = await gql<Wrap>(query, { favoriteSlug: slug, limit, skip: 0 });
  return data.favoriteQuestionList.questions;
}

export async function fetchQuestionDetail(titleSlug: string): Promise<QuestionDetailResponse> {
  const query = `
    query getQuestion($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        content
        exampleTestcases
        sampleTestCase
        codeSnippets { lang langSlug code }
        topicTags { name slug }
        hints
        similarQuestions
        stats
      }
    }
  `;
  type Wrap = { question: QuestionDetailResponse | null };
  const data = await gql<Wrap>(query, { titleSlug });
  if (!data.question) throw new Error(`LC question not found: ${titleSlug}`);
  return data.question;
}
```

- [ ] **Step 2: Smoke-test the client against the live API**

Append a small main:

```ts
if (require.main === module) {
  (async () => {
    console.log("Fetching favorite list eeudwo2i...");
    const list = await fetchFavoriteList("eeudwo2i");
    console.log(`Got ${list.length} problems. First: LC#${list[0].questionFrontendId} ${list[0].title}`);
    console.log(`Fetching detail for ${list[0].titleSlug}...`);
    const detail = await fetchQuestionDetail(list[0].titleSlug);
    console.log(`Detail OK: title=${detail.title}, codeSnippets=${detail.codeSnippets.length} langs`);
  })();
}
```

- [ ] **Step 3: Run the smoke test**

Run: `cd C:/Users/Admin/interview-web && npx tsx scripts/lib/leetcode-client.ts`
Expected: `Got 117 problems. First: LC#1 Two Sum` then `Detail OK: title=Two Sum, codeSnippets=N langs`

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/leetcode-client.ts
git commit -m "feat(ingest): LeetCode GraphQL client with retry

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: File writers (`scripts/lib/file-writers.ts`)

**Files:**
- Create: `scripts/lib/file-writers.ts`

- [ ] **Step 1: Create atomic JSON writer + bank-file splicer**

```ts
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
```

- [ ] **Step 2: Smoke-test the bank serializer (pure function, no I/O)**

Append:

```ts
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
```

- [ ] **Step 3: Run the smoke test**

Run: `cd C:/Users/Admin/interview-web && npx tsx scripts/lib/file-writers.ts`
Expected: prints the serialized entry then `file-writers serializer self-test: passed`.

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/file-writers.ts
git commit -m "feat(ingest): atomic file writers for JSON + bank file splice

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Main orchestrator (`scripts/ingest-striver-sde.ts`)

**Files:**
- Create: `scripts/ingest-striver-sde.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create the orchestrator script**

```ts
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
```

- [ ] **Step 2: Add npm scripts to `package.json`**

Find the `"scripts"` block and replace:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
```

with:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "ingest:striver": "tsx scripts/ingest-striver-sde.ts",
    "ingest:dry": "tsx scripts/ingest-striver-sde.ts --dry-run --limit=3"
  },
```

- [ ] **Step 3: Append to `.gitignore`**

Open `C:/Users/Admin/interview-web/.gitignore` and append:

```
# ingest script artifacts
scripts/ingest.log
scripts/*.tmp
src/data/*.tmp
src/lib/*.tmp
```

- [ ] **Step 4: Run dry-run with `--limit=3` to sanity-check end-to-end**

Run: `cd C:/Users/Admin/interview-web && npx tsx scripts/ingest-striver-sde.ts --dry-run --limit=3`
Expected: log lines fetching 3 problems, prints sample bank entry JSON, says `DRY RUN complete. Would add 3 bank entries`. No file modifications.

Confirm no file changes: `git status --short` should show only `.gitignore`, `package.json`, `scripts/` additions — not `dsa-knowledge-bank.ts` or `leetcode-problems.json`.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest-striver-sde.ts package.json .gitignore
git commit -m "feat(ingest): main orchestrator + npm scripts + gitignore

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Submit-button gate in `/api/test/route.ts`

**Files:**
- Modify: `src/app/api/test/route.ts`

- [ ] **Step 1: Read the existing route to find where `canonicalCases` is accessed**

Run: `grep -n "canonicalCases" src/app/api/test/route.ts`
Expected: lines around 123-124.

- [ ] **Step 2: Add the empty-cases guard immediately before that block**

In `src/app/api/test/route.ts`, locate the block that does:

```ts
total: curatedProblem.canonicalCases.length,
results: curatedProblem.canonicalCases.map((testCase, index) => ({
```

Add this guard immediately before that block (i.e., right after `curatedProblem` is resolved):

```ts
if (!curatedProblem.canonicalCases || curatedProblem.canonicalCases.length === 0) {
  return Response.json({
    ok: false,
    draft: true,
    message: "Test cases pending — submit disabled for this problem.",
    total: 0,
    passed: 0,
    results: [],
  });
}
```

The `total/passed/results` fields are included so the existing client code that reads them doesn't NPE.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/test/route.ts
git commit -m "feat(test-runner): return draft:true when canonicalCases empty

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Solve page reads draft flag

**Files:**
- Modify: `src/app/session/dsa/solve/page.tsx`

- [ ] **Step 1: Find the submit handler**

Run: `grep -n "handleSubmitQuestion\|/api/test" src/app/session/dsa/solve/page.tsx`
Expected: `handleSubmitQuestion` around line 162; `fetch("/api/test"` around lines 135 and 168.

- [ ] **Step 2: Add a `draft` state flag and read it from the test response**

Near the existing `useState` declarations (around line 46), add:

```tsx
const [isDraft, setIsDraft] = useState(false);
```

Then locate `handleRunTests` (around line 130). After parsing `testResult` (around line 145), add:

```tsx
if (testResult.draft) {
  setIsDraft(true);
} else {
  setIsDraft(false);
}
```

Do the same in `handleSubmitQuestion` (around line 162) — after parsing `testResult`, before continuing the submit flow:

```tsx
if (testResult.draft) {
  setIsDraft(true);
  alert("Submit disabled: this problem's test cases are pending curation. You can still Run, but Submit will be enabled once cases are added.");
  return;
}
```

- [ ] **Step 3: Disable Submit button when `isDraft` is true**

Locate the Submit button (around line 353). Find the existing pattern:

```tsx
disabled={submitting}
```

on the Submit button (NOT the Run button — Run stays enabled). Change to:

```tsx
disabled={submitting || isDraft}
title={isDraft ? "Test cases pending curation for this problem" : undefined}
```

- [ ] **Step 4: Manually verify**

Restart dev server (`npm run dev`). Pick any existing problem (e.g. Two Sum) — Submit should be enabled, Run + Submit work. We can't fully test the draft path until Task 10 ingests new problems with empty cases.

- [ ] **Step 5: Commit**

```bash
git add src/app/session/dsa/solve/page.tsx
git commit -m "feat(solve): disable submit when problem is draft (no canonical cases)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Run the real ingest

**Files:**
- Modify (by script): `src/data/leetcode-problems.json`, `src/lib/dsa-knowledge-bank.ts`

- [ ] **Step 1: Confirm clean working tree (no unrelated edits)**

Run: `cd C:/Users/Admin/interview-web && git status --short`
Expected: empty (everything from Tasks 1-9 already committed).

- [ ] **Step 2: Run the ingest for real**

Run: `cd C:/Users/Admin/interview-web && npm run ingest:striver`
Expected log tail: `DONE. Added: ~104. Failed: 0. Existing skipped: ~13.` (exact numbers depend on dedup overlap).

- [ ] **Step 3: Inspect the diff before committing**

Run: `cd C:/Users/Admin/interview-web && git diff --stat`
Expected: `src/data/leetcode-problems.json` and `src/lib/dsa-knowledge-bank.ts` modified, large insertions.

Spot-check 3 random new entries:
```bash
grep -A 10 "kb-040-" src/lib/dsa-knowledge-bank.ts | head -15
grep -A 10 "kb-080-" src/lib/dsa-knowledge-bank.ts | head -15
grep -A 10 "kb-120-" src/lib/dsa-knowledge-bank.ts | head -15
```

Confirm: each has `problem: { id, title, topic, difficulty, leetcodeNumber, ... }`, `interviewSignal: "Striver SDE list..."`, `canonicalCases: [],`.

- [ ] **Step 4: TypeScript compile check**

Run: `cd C:/Users/Admin/interview-web && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors related to bank file.

- [ ] **Step 5: Commit the data**

```bash
git add src/data/leetcode-problems.json src/lib/dsa-knowledge-bank.ts
git commit -m "data: ingest Striver SDE list (+104 problems via LeetCode favorite eeudwo2i)

Bank: 36 → 140 problems. Empty canonicalCases on new entries (phase-2 AI fill).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: End-to-end manual verification

- [ ] **Step 1: Restart dev server**

If running, stop and restart:
```
cd C:/Users/Admin/interview-web && npm run dev
```

- [ ] **Step 2: Verify setup page DSA preview shows new problems**

Navigate to `http://localhost:3000/setup`, sign in if needed, click DSA → click "Refresh" on the bank preview. Some titles should be ones not in the original 36 (e.g., "Set Matrix Zeroes", "3Sum", "Trapping Rain Water" — depends on what's in the favorite list).

- [ ] **Step 3: Pick a new problem, start a session, verify Run + Submit gating**

Start a session with an experience level + DSA → enter the round → click into a new problem.

- Run button → should execute against LeetCode example cases (works regardless of canonicalCases). Verify output looks normal.
- Submit button → should be disabled or show "Test cases pending" alert when clicked. Verify the disable/alert path works.

- [ ] **Step 4: Verify existing problems still submit correctly**

Pick LC #1 (Two Sum) or any of the original 36. Submit should still work end-to-end.

- [ ] **Step 5: Confirm no regression in dashboard**

Navigate to `/dashboard`. Stats render. No errors in console.

- [ ] **Step 6: Commit any verification fixes (if needed)**

If verification turned up bugs, fix them as discrete commits referencing the failing scenario.

---

## Phase 2 (deferred, separate plan)

`scripts/ai-fill-bank.ts` — reads bank, finds entries with empty `canonicalCases`/`approach`/`interviewSignal`, calls Claude Sonnet via the existing `ANTHROPIC_API_KEY`, writes back. Estimated cost ~$2 for 104 problems. Not in scope of this plan.

---

## Self-review notes

- Spec coverage: rotation expansion (Task 1), entry shape (Task 3), topic mapper (Task 2), submit gate (Tasks 8-9), idempotency (Task 4 dedup + Task 7 main loop), atomic writes (Task 6), error handling (Task 5 retries), dry-run + run (Tasks 7+10).
- Type consistency: `BankEntryOut` shape in Task 3 matches what `serializeBankEntry` reads in Task 6. `LcSummary` returned by `fetchFavoriteList` matches what `buildBankEntry` consumes.
- No placeholders in code blocks.
- One thing the spec mentioned but isn't a code task: phase-2 AI fill — captured as a deferred section, not a TODO in code.
