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
