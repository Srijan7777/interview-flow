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
