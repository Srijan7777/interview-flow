# Striver DSA Bank Ingest — Design

**Date:** 2026-05-10
**Scope:** Bulk import of curated LeetCode problem list (favorite slug `eeudwo2i`, 117 problems) into the in-repo DSA knowledge bank. DSA only this round. LLD/HLD deferred. Web crawler deferred to a separate spec.

## Goals

- Add ~104 net-new DSA problems (117 in source list, ~13 already in bank).
- Zero changes to API routes or runtime architecture.
- Idempotent, re-runnable script.
- Problems are immediately browsable, viewable, and runnable against LeetCode example cases. Submit is gated until phase-2 AI-fill (see "Phase 2" below).

## Non-goals

- LLD/HLD bank expansion.
- Web crawler / scheduled ingestion.
- Migration to Supabase tables.
- AI-generated `interviewSignal`, `approach`, `complexities`, or `canonicalCases`.

## Architecture

Single Node script: `scripts/ingest-striver-sde.ts`. Runs locally via `npx tsx`. Fetches LeetCode GraphQL, appends to two existing source files:

- `src/data/leetcode-problems.json` — raw LC detail keyed by `questionFrontendId`
- `src/lib/dsa-knowledge-bank.ts` — curated bank entries (`DSA_KNOWLEDGE_BANK.problems[]`)

Atomic writes via `*.tmp` rename. Crash = no partial damage.

## Data flow

```
Step 1  POST leetcode.com/graphql
        query favoriteQuestionList(favoriteSlug: "eeudwo2i", limit: 250)
        → 117 entries with: questionFrontendId, titleSlug, title, difficulty, topicTags

Step 2  for each entry:
          if leetcodeNumber already in bank → skip (dedup)
          POST leetcode.com/graphql
            query getQuestion(titleSlug)
            → content (HTML), exampleTestcases, codeSnippets, hints, similarQuestions, stats
          append to leetcode-problems.json
          build bank skeleton entry (see "Bank entry shape") → append to dsa-knowledge-bank.ts
          sleep 500ms

Step 3  print summary: added N, skipped M existing, failed K
```

## Bank entry shape

For each ingested problem, the script writes:

```ts
{
  problem: {
    id: "kb-NNN-<slug>",                    // NNN = sequential after existing 36
    title: "<from LC>",
    topic: mapTopic(lcTopicTags),           // see "Topic mapping"
    difficulty: "<from LC, lowercased>",    // easy | medium | hard
    leetcodeNumber: N,
    companies: ["google", "amazon", "meta", "microsoft"],  // default BIG_TECH
    tags: lcTopicTags.map(t => t.slug),
    url: `https://leetcode.com/problems/${slug}/`,
    approach: "",                           // phase-2 AI fill
    timeComplexity: "",                     // phase-2 AI fill
    spaceComplexity: "",                    // phase-2 AI fill
  },
  interviewSignal: `Striver SDE list · ${difficulty} ${primaryTopic} problem.`,
  canonicalCases: [],                       // phase-2 AI fill (CRITICAL: blocks submit)
}
```

## Topic mapping

The bank's `rotation` array expands from 11 → 20 buckets to absorb Striver coverage:

```
arrays-and-hashing, strings, two-pointers, sliding-window, binary-search,
stack, linked-list, binary-tree, bst, heap, graphs, trie,
dynamic-programming, greedy, recursion, backtracking,
bit-manipulation, math, intervals, design
```

`mapTopic(lcTags)` — first-match wins, priority-ordered:

```
"Linked List"                            → linked-list
"Tree" | "Binary Tree"                   → binary-tree
"Binary Search Tree"                     → bst
"Trie"                                   → trie
"Graph" | "DFS" | "BFS" | "Topological Sort" → graphs
"Heap" | "Priority Queue"                → heap
"Dynamic Programming"                    → dynamic-programming
"Backtracking"                           → backtracking
"Greedy"                                 → greedy
"Bit Manipulation"                       → bit-manipulation
"Math"                                   → math
"Sliding Window"                         → sliding-window
"Two Pointers"                           → two-pointers
"Binary Search"                          → binary-search
"Stack" | "Monotonic Stack"              → stack
"String"                                 → strings
default                                  → arrays-and-hashing
```

Hand-override map for known mismatches (e.g., LC #200 "Number of Islands" tagged `Array+DFS` → force `graphs`). Override list lives at top of script.

Existing 36 problems are unchanged.

## Submit-button gate

`canonicalCases` is required by `/api/test/route.ts` (used to grade submissions). New entries land with `canonicalCases: []`. Add a guard:

```ts
// src/app/api/test/route.ts
if (!curatedProblem.canonicalCases?.length) {
  return Response.json({
    ok: false,
    draft: true,
    message: "Test cases pending — submit disabled for this problem"
  });
}
```

Solve page (`src/app/session/dsa/solve/page.tsx`) reads `draft: true` from the test response and disables the Submit button with a tooltip. **Run** still works (executes against LeetCode example cases).

## Error handling

- LC API 429: exponential backoff, 3 retries, then log + skip.
- LC API 404 / malformed JSON: log + skip, continue.
- Network failure: 3 retries, then abort. Re-run resumes from where it left off (idempotent via dedup).
- `mapTopic()` miss: falls back to `arrays-and-hashing`, logs warning.

## Testing

Dry-run mode prints intended additions without writing. Manual sanity check after run: open `/setup`, confirm DSA preview pulls 5 fresh problems and the count grew.

## Run

```
package.json:
  "ingest:striver":     "tsx scripts/ingest-striver-sde.ts"
  "ingest:dry":         "tsx scripts/ingest-striver-sde.ts --dry-run"
```

One-shot. Output: console + `scripts/ingest.log`.

## Phase 2 (separate spec, not this round)

`scripts/ai-fill-bank.ts` — reads bank, finds entries with empty `canonicalCases` / `approach` / `interviewSignal`, calls Claude API (Sonnet) to generate them, writes back. Estimated cost ~$2 for 117 problems. Solve-page Submit button automatically re-enables once `canonicalCases` populated.

## Risks

- LeetCode GraphQL changes shape → script breaks. Mitigation: abort early on schema mismatch, log expected vs got.
- 117-problem source list could grow / shrink upstream → script is idempotent, re-run absorbs additions; removals stay in bank (acceptable, no auto-prune).
- Topic taxonomy expansion (11 → 20) means existing UI components that render topic chips need to handle 9 new strings. They already render whatever string is passed; no code change expected, but spot-check after first run.
