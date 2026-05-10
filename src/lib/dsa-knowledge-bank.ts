import type { Problem } from "@/types";

export interface CanonicalCase {
  label: string;
  input: string;
  output: string;
  notes?: string;
}

export interface KnowledgeBankEntry {
  problem: Problem;
  interviewSignal: string;
  canonicalCases: CanonicalCase[];
}

export interface KnowledgeBank {
  version: number;
  rotation: string[];
  selectionRules: string[];
  problems: KnowledgeBankEntry[];
}

export interface KnowledgeBankFilters {
  topics?: string[];
  companies?: string[];
  difficulties?: Problem["difficulty"][];
  limit?: number;
  excludeIds?: string[];
  experienceLevels?: string[];
  randomize?: boolean;
  randomSeed?: number;
}

export interface KnowledgeBankPracticeProblem extends Problem {
  interviewSignal: string;
  canonicalCases: CanonicalCase[];
}

const BIG_TECH = ["google", "amazon", "meta", "microsoft"];
const DIFFICULTY_ORDER: Record<Problem["difficulty"], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export const DSA_KNOWLEDGE_BANK: KnowledgeBank = {
  version: 1,
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
  selectionRules: [
    "Prefer canonical big-tech staples with stable problem statements.",
    "Bias toward patterns that recur across Google, Amazon, Meta, and Microsoft screens.",
    "Keep at least one easy, one medium, and one advanced follow-up in each core bucket.",
    "Use representative edge cases, not every LeetCode example verbatim.",
  ],
  problems: [
    {
      problem: {
        id: "kb-001-two-sum",
        title: "Two Sum",
        topic: "arrays-and-hashing",
        difficulty: "easy",
        leetcodeNumber: 1,
        companies: BIG_TECH,
        tags: ["hash-map", "complement"],
        url: "https://leetcode.com/problems/two-sum/",
        approach: "Use a hash map to store seen values and look up complements in one pass.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Baseline hash-map complement question that frequently appears in screens and warm-up rounds.",
      canonicalCases: [
        { label: "Standard", input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
        { label: "Middle pair", input: "nums = [3,2,4], target = 6", output: "[1,2]" },
        { label: "Duplicate values", input: "nums = [3,3], target = 6", output: "[0,1]" },
      ],
    },
    {
      problem: {
        id: "kb-002-valid-parentheses",
        title: "Valid Parentheses",
        topic: "stack",
        difficulty: "easy",
        leetcodeNumber: 20,
        companies: BIG_TECH,
        tags: ["stack"],
        url: "https://leetcode.com/problems/valid-parentheses/",
        approach: "Push opening brackets, validate each closing bracket against the stack top, and reject any mismatch.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Classic stack hygiene problem that checks basic parsing discipline and edge-case handling.",
      canonicalCases: [
        { label: "Simple pair", input: 's = "()"', output: "true" },
        { label: "Mixed types", input: 's = "()[]{}"', output: "true" },
        { label: "Mismatch", input: 's = "([)]"', output: "false", notes: "Crossed ordering should fail." },
      ],
    },
    {
      problem: {
        id: "kb-003-best-time-stock",
        title: "Best Time to Buy and Sell Stock",
        topic: "arrays-and-hashing",
        difficulty: "easy",
        leetcodeNumber: 121,
        companies: ["amazon", "meta", "google", "microsoft"],
        tags: ["greedy", "one-pass"],
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        approach: "Track the minimum price so far and the best profit in one pass.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Greedy one-pass staple that is often used to probe invariant tracking and amortized thinking.",
      canonicalCases: [
        { label: "Profit exists", input: "prices = [7,1,5,3,6,4]", output: "5" },
        { label: "Monotone down", input: "prices = [7,6,4,3,1]", output: "0" },
        { label: "Single gain", input: "prices = [1,2]", output: "1" },
      ],
    },
    {
      problem: {
        id: "kb-004-contains-duplicate",
        title: "Contains Duplicate",
        topic: "arrays-and-hashing",
        difficulty: "easy",
        leetcodeNumber: 217,
        companies: BIG_TECH,
        tags: ["hash-set"],
        url: "https://leetcode.com/problems/contains-duplicate/",
        approach: "Use a set to track seen values and reject as soon as a repeat appears.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Fast signal for set membership, short-circuiting, and duplicate detection.",
      canonicalCases: [
        { label: "Has repeat", input: "nums = [1,2,3,1]", output: "true" },
        { label: "All unique", input: "nums = [1,2,3,4]", output: "false" },
        { label: "Late repeat", input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: "true" },
      ],
    },
    {
      problem: {
        id: "kb-005-product-except-self",
        title: "Product of Array Except Self",
        topic: "arrays-and-hashing",
        difficulty: "medium",
        leetcodeNumber: 238,
        companies: BIG_TECH,
        tags: ["prefix-suffix", "array"],
        url: "https://leetcode.com/problems/product-of-array-except-self/",
        approach: "Build prefix and suffix products so every position is computed without division.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Common follow-up to test array decomposition and handling zeros without division.",
      canonicalCases: [
        { label: "All positive", input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
        { label: "Single zero", input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
        { label: "Two values", input: "nums = [2,3]", output: "[3,2]" },
      ],
    },
    {
      problem: {
        id: "kb-006-longest-substring",
        title: "Longest Substring Without Repeating Characters",
        topic: "sliding-window",
        difficulty: "medium",
        leetcodeNumber: 3,
        companies: ["google", "amazon", "meta", "apple"],
        tags: ["sliding-window", "hash-map"],
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        approach: "Use a sliding window with last-seen indexes to move the left boundary on duplicates.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(min(n, m))",
      },
      interviewSignal: "Canonical sliding-window question used to check window invariants and duplicate eviction logic.",
      canonicalCases: [
        { label: "Repeated pattern", input: 's = "abcabcbb"', output: "3" },
        { label: "Single char", input: 's = "bbbbb"', output: "1" },
        { label: "Window shift", input: 's = "pwwkew"', output: "3" },
      ],
    },
    {
      problem: {
        id: "kb-007-container-water",
        title: "Container With Most Water",
        topic: "two-pointers",
        difficulty: "medium",
        leetcodeNumber: 11,
        companies: ["amazon", "google", "meta", "apple"],
        tags: ["two-pointers"],
        url: "https://leetcode.com/problems/container-with-most-water/",
        approach: "Move the shorter wall inward because width shrinks on every step.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "High-signal two-pointer reasoning problem that rewards proof of why greedy moves are safe.",
      canonicalCases: [
        { label: "Reference", input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" },
        { label: "Two walls", input: "height = [1,1]", output: "1" },
        { label: "Symmetric peak", input: "height = [4,3,2,1,4]", output: "16" },
      ],
    },
    {
      problem: {
        id: "kb-008-merge-intervals",
        title: "Merge Intervals",
        topic: "intervals",
        difficulty: "medium",
        leetcodeNumber: 56,
        companies: ["google", "amazon", "meta", "microsoft"],
        tags: ["sort", "intervals"],
        url: "https://leetcode.com/problems/merge-intervals/",
        approach: "Sort by start time, then fold overlapping intervals into the current merged range.",
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "A baseline interval-merge problem that often leads to meeting-room and scheduling variants.",
      canonicalCases: [
        { label: "Overlap chain", input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
        { label: "Touching edges", input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
        { label: "Nested", input: "intervals = [[1,4],[0,4]]", output: "[[0,4]]" },
      ],
    },
    {
      problem: {
        id: "kb-009-top-k-frequent",
        title: "Top K Frequent Elements",
        topic: "heap",
        difficulty: "medium",
        leetcodeNumber: 347,
        companies: BIG_TECH,
        tags: ["hash-map", "heap"],
        url: "https://leetcode.com/problems/top-k-frequent-elements/",
        approach: "Count frequencies, then use a heap or bucket strategy to extract the top k items.",
        timeComplexity: "O(n log k)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Common heap/hash-map combination that also checks how candidates handle tie-breaking and output order.",
      canonicalCases: [
        { label: "Two hot items", input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]", notes: "Order can be normalized." },
        { label: "Single item", input: "nums = [1], k = 1", output: "[1]" },
        { label: "Mixed frequencies", input: "nums = [4,1,-1,2,-1,2,3], k = 2", output: "[-1,2]", notes: "Any order of the top two is acceptable." },
      ],
    },
    {
      problem: {
        id: "kb-010-binary-search",
        title: "Binary Search",
        topic: "binary-search",
        difficulty: "easy",
        leetcodeNumber: 704,
        companies: BIG_TECH,
        tags: ["binary-search"],
        url: "https://leetcode.com/problems/binary-search/",
        approach: "Maintain an invariant on the search window and shrink it until the target is found or ruled out.",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Basic search invariant question that still surfaces in live interviews and as a building block for harder problems.",
      canonicalCases: [
        { label: "Target found", input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
        { label: "Target missing", input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
        { label: "Single element", input: "nums = [5], target = 5", output: "0" },
      ],
    },
    {
      problem: {
        id: "kb-011-rotated-search",
        title: "Search in Rotated Sorted Array",
        topic: "binary-search",
        difficulty: "medium",
        leetcodeNumber: 33,
        companies: ["google", "amazon", "meta", "microsoft"],
        tags: ["binary-search", "rotation"],
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        approach: "Use the sorted half to decide which side contains the target on every iteration.",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "A canonical twist on binary search that checks whether the candidate can preserve the invariant through rotation.",
      canonicalCases: [
        { label: "Pivoted", input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
        { label: "Absent", input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
        { label: "Single element miss", input: "nums = [1], target = 0", output: "-1" },
      ],
    },
    {
      problem: {
        id: "kb-012-sliding-window-maximum",
        title: "Sliding Window Maximum",
        topic: "heap",
        difficulty: "hard",
        leetcodeNumber: 239,
        companies: BIG_TECH,
        tags: ["deque", "heap", "sliding-window"],
        url: "https://leetcode.com/problems/sliding-window-maximum/",
        approach: "Maintain a monotonic deque of candidate indexes so each element enters and leaves once.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(k)",
      },
      interviewSignal: "Deque-based monotonic structure problem that is common in stronger big-tech rounds.",
      canonicalCases: [
        { label: "Reference", input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" },
        { label: "Single window", input: "nums = [1], k = 1", output: "[1]" },
        { label: "Full width", input: "nums = [9,11], k = 2", output: "[11]" },
      ],
    },
    {
      problem: {
        id: "kb-013-number-of-islands",
        title: "Number of Islands",
        topic: "graphs",
        difficulty: "medium",
        leetcodeNumber: 200,
        companies: BIG_TECH,
        tags: ["dfs", "bfs", "grid"],
        url: "https://leetcode.com/problems/number-of-islands/",
        approach: "Traverse each unseen land cell with DFS or BFS and mark the connected component as visited.",
        timeComplexity: "O(m * n)",
        spaceComplexity: "O(m * n)",
      },
      interviewSignal: "Core graph/grid traversal question used to check flood-fill reasoning and visited-state management.",
      canonicalCases: [
        {
          label: "Single island",
          input: "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
          output: "1",
        },
        {
          label: "Multiple islands",
          input: "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]",
          output: "3",
        },
        {
          label: "All water",
          input: "grid = [[\"0\",\"0\"],[\"0\",\"0\"]]",
          output: "0",
        },
      ],
    },
    {
      problem: {
        id: "kb-014-course-schedule",
        title: "Course Schedule",
        topic: "graphs",
        difficulty: "medium",
        leetcodeNumber: 207,
        companies: BIG_TECH,
        tags: ["topological-sort", "graph"],
        url: "https://leetcode.com/problems/course-schedule/",
        approach: "Detect cycles with topological sorting or DFS coloring on the prerequisite graph.",
        timeComplexity: "O(v + e)",
        spaceComplexity: "O(v + e)",
      },
      interviewSignal: "Standard DAG-cycle question that maps well to dependency graphs and scheduling systems.",
      canonicalCases: [
        { label: "Simple acyclic", input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" },
        { label: "Two-node cycle", input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: "false" },
        { label: "Layered DAG", input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", output: "true" },
      ],
    },
    {
      problem: {
        id: "kb-015-house-robber",
        title: "House Robber",
        topic: "dynamic-programming",
        difficulty: "medium",
        leetcodeNumber: 198,
        companies: ["google", "amazon", "meta", "apple"],
        tags: ["dp", "1d-dp"],
        url: "https://leetcode.com/problems/house-robber/",
        approach: "Keep two rolling states: best up to the previous house and best up to the one before it.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Classic 1D DP pattern that checks whether candidates can express recurrence and compress state.",
      canonicalCases: [
        { label: "Alternating picks", input: "nums = [1,2,3,1]", output: "4" },
        { label: "Mixed values", input: "nums = [2,7,9,3,1]", output: "12" },
        { label: "Small array", input: "nums = [2,1,1,2]", output: "4" },
      ],
    },
    {
      problem: {
        id: "kb-016-coin-change",
        title: "Coin Change",
        topic: "dynamic-programming",
        difficulty: "medium",
        leetcodeNumber: 322,
        companies: BIG_TECH,
        tags: ["dp", "unbounded-knapsack"],
        url: "https://leetcode.com/problems/coin-change/",
        approach: "Use bottom-up DP where each amount stores the fewest coins needed to reach it.",
        timeComplexity: "O(amount * numberOfCoins)",
        spaceComplexity: "O(amount)",
      },
      interviewSignal: "Important for recurrence design, impossible-state handling, and unbounded knapsack intuition.",
      canonicalCases: [
        { label: "Reachable", input: "coins = [1,2,5], amount = 11", output: "3" },
        { label: "Unreachable", input: "coins = [2], amount = 3", output: "-1" },
        { label: "Zero amount", input: "coins = [1], amount = 0", output: "0" },
      ],
    },
    {
      problem: {
        id: "kb-017-kth-largest",
        title: "Kth Largest Element in an Array",
        topic: "heap",
        difficulty: "medium",
        leetcodeNumber: 215,
        companies: BIG_TECH,
        tags: ["heap", "quickselect"],
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
        approach: "Use a min-heap of size k or a partition-based quickselect to isolate the kth largest value.",
        timeComplexity: "O(n log k)",
        spaceComplexity: "O(k)",
      },
      interviewSignal: "A common heap/selection question that appears in both coding screens and optimization follow-ups.",
      canonicalCases: [
        { label: "Reference", input: "nums = [3,2,1,5,6,4], k = 2", output: "5" },
        { label: "Duplicates", input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" },
        { label: "Single value", input: "nums = [1], k = 1", output: "1" },
      ],
    },
    {
      problem: {
        id: "kb-018-daily-temperatures",
        title: "Daily Temperatures",
        topic: "stack",
        difficulty: "medium",
        leetcodeNumber: 739,
        companies: ["amazon", "meta", "google", "microsoft"],
        tags: ["monotonic-stack"],
        url: "https://leetcode.com/problems/daily-temperatures/",
        approach: "Use a monotonic decreasing stack of indexes and resolve each day when a warmer temperature appears.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Monotonic-stack pattern that is very common in big-tech interviews and interview prep sets.",
      canonicalCases: [
        { label: "Reference", input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" },
        { label: "Increasing", input: "temperatures = [30,40,50,60]", output: "[1,1,1,0]" },
        { label: "Tiny", input: "temperatures = [30,60,90]", output: "[1,1,0]" },
      ],
    },
    {
      problem: {
        id: "kb-019-lru-cache",
        title: "LRU Cache",
        topic: "design",
        difficulty: "medium",
        leetcodeNumber: 146,
        companies: BIG_TECH,
        tags: ["design", "hash-map", "doubly-linked-list"],
        url: "https://leetcode.com/problems/lru-cache/",
        approach: "Combine a hash map for O(1) lookup with a doubly linked list for O(1) recency updates.",
        timeComplexity: "O(1) per operation",
        spaceComplexity: "O(capacity)",
      },
      interviewSignal: "One of the most important design/data-structure hybrids for big-tech interviews and system-agnostic design thinking.",
      canonicalCases: [
        {
          label: "Eviction path",
          input: "capacity = 2; ops = [put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)]",
          output: "[1,-1,-1,3,4]",
        },
        {
          label: "Overwrite key",
          input: "capacity = 1; ops = [put(2,1), get(2), put(2,2), get(2)]",
          output: "[1,2]",
        },
        {
          label: "Single slot churn",
          input: "capacity = 2; ops = [put(2,1), put(1,1), put(2,3), put(4,1), get(1), get(2)]",
          output: "[-1,3]",
        },
      ],
    },
    {
      problem: {
        id: "kb-020-implement-trie",
        title: "Implement Trie (Prefix Tree)",
        topic: "trie",
        difficulty: "medium",
        leetcodeNumber: 208,
        companies: BIG_TECH,
        tags: ["trie", "design"],
        url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
        approach: "Store children pointers per character and mark terminal nodes for exact-word checks.",
        timeComplexity: "O(length of word)",
        spaceComplexity: "O(total characters)",
      },
      interviewSignal: "A foundational prefix-structure question that shows up in search, autocomplete, and dictionary-style prompts.",
      canonicalCases: [
        {
          label: "Basic workflow",
          input: "ops = [insert(\"apple\"), search(\"apple\"), search(\"app\"), startsWith(\"app\"), insert(\"app\"), search(\"app\")]",
          output: "[null,true,false,true,null,true]",
        },
        {
          label: "Shared prefix",
          input: "ops = [insert(\"car\"), insert(\"card\"), search(\"car\"), startsWith(\"car\"), search(\"cards\")]",
          output: "[null,null,true,true,false]",
        },
        {
          label: "Empty trie queries",
          input: "ops = [search(\"a\"), startsWith(\"a\")]",
          output: "[false,false]",
        },
      ],
    },
    {
      problem: {
        id: "kb-021-longest-repeating-character-replacement",
        title: "Longest Repeating Character Replacement",
        topic: "sliding-window",
        difficulty: "medium",
        leetcodeNumber: 424,
        companies: ["google", "amazon", "meta", "microsoft"],
        tags: ["sliding-window", "frequency"],
        url: "https://leetcode.com/problems/longest-repeating-character-replacement/",
        approach: "Maintain a sliding window and track the most frequent character inside the current window.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Good interview problem for proving window validity and handling amortized updates of a dominant frequency.",
      canonicalCases: [
        { label: "Balanced pattern", input: 's = "ABAB", k = 2', output: "4" },
        { label: "Mixed run", input: 's = "AABABBA", k = 1', output: "4" },
        { label: "All same", input: 's = "AAAA", k = 2', output: "4" },
      ],
    },
    {
      problem: {
        id: "kb-022-reverse-linked-list",
        title: "Reverse Linked List",
        topic: "linked-list",
        difficulty: "easy",
        leetcodeNumber: 206,
        companies: BIG_TECH,
        tags: ["linked-list", "pointer-manipulation"],
        url: "https://leetcode.com/problems/reverse-linked-list/",
        approach: "Iteratively reverse `next` pointers while tracking previous, current, and next nodes.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Foundational pointer-manipulation problem that screens linked-list fluency quickly.",
      canonicalCases: [
        { label: "Standard", input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
        { label: "Single node", input: "head = [1]", output: "[1]" },
        { label: "Empty list", input: "head = []", output: "[]" },
      ],
    },
    {
      problem: {
        id: "kb-023-linked-list-cycle",
        title: "Linked List Cycle",
        topic: "linked-list",
        difficulty: "easy",
        leetcodeNumber: 141,
        companies: BIG_TECH,
        tags: ["linked-list", "fast-slow-pointers"],
        url: "https://leetcode.com/problems/linked-list-cycle/",
        approach: "Use Floyd's slow/fast pointers to detect whether two pointers ever meet.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "A classic pointer invariant check that appears often as a warm-up or safety question.",
      canonicalCases: [
        { label: "Has cycle", input: "head = [3,2,0,-4], pos = 1", output: "true" },
        { label: "No cycle", input: "head = [1,2], pos = -1", output: "false" },
        { label: "Self cycle", input: "head = [1], pos = 0", output: "true" },
      ],
    },
    {
      problem: {
        id: "kb-024-merge-two-lists",
        title: "Merge Two Sorted Lists",
        topic: "linked-list",
        difficulty: "easy",
        leetcodeNumber: 21,
        companies: BIG_TECH,
        tags: ["linked-list", "merge"],
        url: "https://leetcode.com/problems/merge-two-sorted-lists/",
        approach: "Walk both lists with a dummy head and stitch nodes in sorted order.",
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(1)",
      },
      interviewSignal: "Simple linked-list merge that tests careful pointer advancement and base-case handling.",
      canonicalCases: [
        { label: "Interleaved", input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
        { label: "One empty", input: "list1 = [], list2 = []", output: "[]" },
        { label: "Left empty", input: "list1 = [], list2 = [0]", output: "[0]" },
      ],
    },
    {
      problem: {
        id: "kb-025-add-two-numbers",
        title: "Add Two Numbers",
        topic: "linked-list",
        difficulty: "medium",
        leetcodeNumber: 2,
        companies: BIG_TECH,
        tags: ["linked-list", "carry"],
        url: "https://leetcode.com/problems/add-two-numbers/",
        approach: "Add digit-by-digit with carry, creating a new list node for each computed digit.",
        timeComplexity: "O(max(n, m))",
        spaceComplexity: "O(max(n, m))",
      },
      interviewSignal: "Classic linked-list arithmetic problem that checks carry propagation and list construction discipline.",
      canonicalCases: [
        { label: "Different lengths", input: "l1 = [2,4,3], l2 = [5,6,4]", output: "[7,0,8]" },
        { label: "Carry chain", input: "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", output: "[8,9,9,9,0,0,0,1]" },
        { label: "Zero plus zero", input: "l1 = [0], l2 = [0]", output: "[0]" },
      ],
    },
    {
      problem: {
        id: "kb-026-invert-binary-tree",
        title: "Invert Binary Tree",
        topic: "trees",
        difficulty: "easy",
        leetcodeNumber: 226,
        companies: BIG_TECH,
        tags: ["tree", "dfs", "bfs"],
        url: "https://leetcode.com/problems/invert-binary-tree/",
        approach: "Swap left and right children recursively or iteratively with a queue.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(h)",
      },
      interviewSignal: "Minimal tree traversal question that establishes recursion, queue handling, and structural mutation basics.",
      canonicalCases: [
        { label: "Balanced tree", input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
        { label: "Single node", input: "root = [1]", output: "[1]" },
        { label: "Empty tree", input: "root = []", output: "[]" },
      ],
    },
    {
      problem: {
        id: "kb-027-validate-bst",
        title: "Validate Binary Search Tree",
        topic: "trees",
        difficulty: "medium",
        leetcodeNumber: 98,
        companies: BIG_TECH,
        tags: ["tree", "bst", "inorder"],
        url: "https://leetcode.com/problems/validate-binary-search-tree/",
        approach: "Propagate allowable value bounds or confirm strict increasing order via inorder traversal.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(h)",
      },
      interviewSignal: "Common tree invariant question that surfaces off-by-one and duplicate-handling mistakes.",
      canonicalCases: [
        { label: "Valid BST", input: "root = [2,1,3]", output: "true" },
        { label: "Invalid right child", input: "root = [5,1,4,null,null,3,6]", output: "false" },
        { label: "Duplicate value", input: "root = [2,2,2]", output: "false" },
      ],
    },
    {
      problem: {
        id: "kb-028-binary-tree-level-order",
        title: "Binary Tree Level Order Traversal",
        topic: "trees",
        difficulty: "medium",
        leetcodeNumber: 102,
        companies: BIG_TECH,
        tags: ["tree", "bfs"],
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        approach: "Traverse the tree level by level using a queue and collect each layer separately.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "A basic BFS tree question that often precedes zigzag, right-side view, or vertical order variants.",
      canonicalCases: [
        { label: "Reference", input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" },
        { label: "Single node", input: "root = [1]", output: "[[1]]" },
        { label: "Empty tree", input: "root = []", output: "[]" },
      ],
    },
    {
      problem: {
        id: "kb-029-lowest-common-ancestor",
        title: "Lowest Common Ancestor of a Binary Tree",
        topic: "trees",
        difficulty: "medium",
        leetcodeNumber: 236,
        companies: BIG_TECH,
        tags: ["tree", "dfs", "ancestor"],
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
        approach: "Recurse into both subtrees; if both sides return a node, the current root is the LCA.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(h)",
      },
      interviewSignal: "A strong interview staple for recursive decomposition and reasoning about ancestors in a tree.",
      canonicalCases: [
        { label: "Split below root", input: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1", output: "3" },
        { label: "Same subtree", input: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4", output: "5" },
        { label: "Direct ancestor", input: "root = [2,1], p = 2, q = 1", output: "2" },
      ],
    },
    {
      problem: {
        id: "kb-030-subsets",
        title: "Subsets",
        topic: "backtracking",
        difficulty: "medium",
        leetcodeNumber: 78,
        companies: BIG_TECH,
        tags: ["backtracking", "power-set"],
        url: "https://leetcode.com/problems/subsets/",
        approach: "At each step, choose to include or exclude the current number while collecting every path.",
        timeComplexity: "O(n * 2^n)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Core backtracking/power-set question that tests recursive branching and state restoration.",
      canonicalCases: [
        { label: "Three elements", input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" },
        { label: "Single element", input: "nums = [0]", output: "[[],[0]]" },
        { label: "Empty set", input: "nums = []", output: "[[]]" },
      ],
    },
    {
      problem: {
        id: "kb-031-permutations",
        title: "Permutations",
        topic: "backtracking",
        difficulty: "medium",
        leetcodeNumber: 46,
        companies: BIG_TECH,
        tags: ["backtracking", "permutation"],
        url: "https://leetcode.com/problems/permutations/",
        approach: "Build permutations by choosing unused elements and backtracking after each branch.",
        timeComplexity: "O(n * n!)",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "Another canonical recursion question that checks branching factor awareness and visited-state tracking.",
      canonicalCases: [
        { label: "Three values", input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
        { label: "Two values", input: "nums = [0,1]", output: "[[0,1],[1,0]]" },
        { label: "Single value", input: "nums = [1]", output: "[[1]]" },
      ],
    },
    {
      problem: {
        id: "kb-032-combination-sum",
        title: "Combination Sum",
        topic: "backtracking",
        difficulty: "medium",
        leetcodeNumber: 39,
        companies: BIG_TECH,
        tags: ["backtracking", "search-tree"],
        url: "https://leetcode.com/problems/combination-sum/",
        approach: "Explore candidates from a non-decreasing index so the same value can be reused without generating duplicates.",
        timeComplexity: "Exponential in the worst case",
        spaceComplexity: "O(target / minCandidate)",
      },
      interviewSignal: "A standard combination-search question that probes pruning, deduping, and branch ordering.",
      canonicalCases: [
        { label: "Classic", input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]" },
        { label: "Two combos", input: "candidates = [2,3,5], target = 8", output: "[[2,2,2,2],[2,3,3],[3,5]]" },
        { label: "No solution", input: "candidates = [5,10], target = 3", output: "[]" },
      ],
    },
    {
      problem: {
        id: "kb-033-word-search",
        title: "Word Search",
        topic: "backtracking",
        difficulty: "medium",
        leetcodeNumber: 79,
        companies: BIG_TECH,
        tags: ["backtracking", "grid", "dfs"],
        url: "https://leetcode.com/problems/word-search/",
        approach: "Depth-first search from each cell with visited marking and immediate pruning when characters mismatch.",
        timeComplexity: "O(m * n * 4^L)",
        spaceComplexity: "O(L)",
      },
      interviewSignal: "Very common grid-backtracking question that merges DFS, pruning, and visited-state handling.",
      canonicalCases: [
        {
          label: "Exists",
          input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"",
          output: "true",
        },
        {
          label: "Not exists",
          input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCB\"",
          output: "false",
        },
        {
          label: "Single cell",
          input: "board = [[\"A\"]], word = \"A\"",
          output: "true",
        },
      ],
    },
    {
      problem: {
        id: "kb-034-design-add-search-words",
        title: "Design Add and Search Words Data Structure",
        topic: "trie",
        difficulty: "medium",
        leetcodeNumber: 211,
        companies: BIG_TECH,
        tags: ["trie", "wildcard-search", "design"],
        url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
        approach: "Use a trie and branch recursively when the query contains wildcard characters.",
        timeComplexity: "O(length of word) average, exponential only in wildcard-heavy paths",
        spaceComplexity: "O(total characters)",
      },
      interviewSignal: "A strong trie-style design question that is a step up from plain prefix matching.",
      canonicalCases: [
        {
          label: "Wildcard match",
          input: "ops = [addWord(\"bad\"), addWord(\"dad\"), addWord(\"mad\"), search(\"pad\"), search(\"bad\"), search(\".ad\"), search(\"b..\")]",
          output: "[null,null,null,false,true,true,true]",
        },
        {
          label: "Exact and wildcard",
          input: "ops = [addWord(\"a\"), addWord(\"ab\"), search(\"a\"), search(\"a.\"), search(\".\")]",
          output: "[null,null,true,true,true]",
        },
        {
          label: "Empty trie",
          input: "ops = [search(\".\")]",
          output: "[false]",
        },
      ],
    },
    {
      problem: {
        id: "kb-035-min-stack",
        title: "Min Stack",
        topic: "stack",
        difficulty: "medium",
        leetcodeNumber: 155,
        companies: BIG_TECH,
        tags: ["stack", "design"],
        url: "https://leetcode.com/problems/min-stack/",
        approach: "Store the running minimum alongside each stack entry or keep a secondary min stack.",
        timeComplexity: "O(1) per operation",
        spaceComplexity: "O(n)",
      },
      interviewSignal: "A small but important design question that checks whether constant-time invariants are maintained correctly.",
      canonicalCases: [
        {
          label: "Basic flow",
          input: "ops = [push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()]",
          output: "[null,null,null,-3,null,0,-2]",
        },
        {
          label: "Duplicates",
          input: "ops = [push(2), push(2), getMin(), pop(), getMin()]",
          output: "[null,null,2,null,2]",
        },
        {
          label: "Single push",
          input: "ops = [push(5), top(), getMin()]",
          output: "[null,5,5]",
        },
      ],
    },
    // === INGEST_MARKER === (do not remove — used by scripts/ingest-striver-sde.ts to splice new entries)
  ],
};

export function getKnowledgeBankProblemById(leetcodeNumber: number): KnowledgeBankEntry | undefined {
  return DSA_KNOWLEDGE_BANK.problems.find((entry) => entry.problem.leetcodeNumber === leetcodeNumber);
}

export function getKnowledgeBankProblemByTitle(title: string): KnowledgeBankEntry | undefined {
  const normalizedTitle = title.trim().toLowerCase();
  return DSA_KNOWLEDGE_BANK.problems.find((entry) => entry.problem.title.toLowerCase() === normalizedTitle);
}

// Seedable shuffle — Fisher-Yates with xorshift
function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = [...arr];
  let s = seed ?? Date.now();
  const rand = () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s < 0 ? ~s + 1 : s) % 10000) / 10000;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Labels which experience levels each problem is appropriate for
const EXP_LEVEL_MAP: Record<string, string[]> = {
  // Easy + fundamental → all levels
  "arrays-and-hashing": ["0-1", "1-3", "3-5", "5+"],
  "stack": ["0-1", "1-3", "3-5"],
  "two-pointers": ["0-1", "1-3", "3-5"],
  "sliding-window": ["1-3", "3-5", "5+"],
  "binary-search": ["1-3", "3-5", "5+"],
  "intervals": ["1-3", "3-5", "5+"],
  "linked-list": ["0-1", "1-3", "3-5"],
  "trees": ["1-3", "3-5", "5+"],
  "graphs": ["3-5", "5+"],
  "dynamic-programming": ["3-5", "5+"],
  "backtracking": ["1-3", "3-5", "5+"],
  "heap": ["1-3", "3-5", "5+"],
  "trie": ["3-5", "5+"],
  "design": ["3-5", "5+"],
  "system-design": ["3-5", "5+"],
};

export function getExperienceLevelsForProblem(topic: string, difficulty: string): string[] {
  const all = ["0-1", "1-3", "3-5", "5+"];
  return all.filter((e) => isAppropriateForExp(topic, difficulty, e));
}

function isAppropriateForExp(topic: string, difficulty: string, exp: string): boolean {
  const allowed = EXP_LEVEL_MAP[topic] || ["0-1", "1-3", "3-5", "5+"];
  if (!allowed.includes(exp)) return false;
  // Additional difficulty gate
  if (exp === "0-1" && difficulty === "hard") return false;
  if (exp === "5+" && difficulty === "easy") return false;
  return true;
}

export function selectKnowledgeBankProblems(
  filters: KnowledgeBankFilters = {}
): KnowledgeBankEntry[] {
  const limit = Math.max(1, filters.limit ?? 5);
  const topicFilter = normalizeList(filters.topics);
  const companyFilter = normalizeList(filters.companies);
  const difficultyFilter = new Set(filters.difficulties ?? []);
  const excludeSet = new Set(filters.excludeIds ?? []);
  const expLevels = filters.experienceLevels ?? [];
  const randomize = filters.randomize ?? true;

  let filtered = DSA_KNOWLEDGE_BANK.problems
    .filter((entry) => {
      if (excludeSet.has(entry.problem.id)) return false;
      const topicMatches = topicFilter.length === 0 || topicFilter.includes(entry.problem.topic);
      const companyMatches =
        companyFilter.length === 0 ||
        entry.problem.companies.some((company) => companyFilter.includes(company.toLowerCase()));
      const difficultyMatches =
        difficultyFilter.size === 0 || difficultyFilter.has(entry.problem.difficulty);
      const expMatches =
        expLevels.length === 0 ||
        expLevels.some((e) => isAppropriateForExp(entry.problem.topic, entry.problem.difficulty, e));

      return topicMatches && companyMatches && difficultyMatches && expMatches;
    });

  if (randomize) {
    filtered = shuffle(filtered, filters.randomSeed);
    // Post-shuffle: still group by difficulty if difficulties filter set
    if (difficultyFilter.size > 0) {
      filtered.sort((a, b) =>
        DIFFICULTY_ORDER[a.problem.difficulty] - DIFFICULTY_ORDER[b.problem.difficulty]
      );
    }
  } else {
    filtered.sort((left, right) => {
      const difficultyDelta =
        DIFFICULTY_ORDER[left.problem.difficulty] - DIFFICULTY_ORDER[right.problem.difficulty];
      if (difficultyDelta !== 0) return difficultyDelta;
      const topicDelta = left.problem.topic.localeCompare(right.problem.topic);
      if (topicDelta !== 0) return topicDelta;
      return left.problem.leetcodeNumber - right.problem.leetcodeNumber;
    });
  }

  if (filtered.length <= limit) {
    return filtered;
  }

  const grouped = new Map<string, KnowledgeBankEntry[]>();
  for (const entry of filtered) {
    const bucket = grouped.get(entry.problem.topic) ?? [];
    bucket.push(entry);
    grouped.set(entry.problem.topic, bucket);
  }

  const topicOrder = [
    ...DSA_KNOWLEDGE_BANK.rotation.filter((topic) => grouped.has(topic)),
    ...Array.from(grouped.keys()).filter((topic) => !DSA_KNOWLEDGE_BANK.rotation.includes(topic)),
  ];

  const selected: KnowledgeBankEntry[] = [];
  let round = 0;

  while (selected.length < limit) {
    let addedThisRound = false;

    for (const topic of topicOrder) {
      const bucket = grouped.get(topic);
      if (!bucket || round >= bucket.length) {
        continue;
      }

      selected.push(bucket[round]);
      addedThisRound = true;

      if (selected.length === limit) {
        break;
      }
    }

    if (!addedThisRound) {
      break;
    }

    round += 1;
  }

  return selected;
}

export function getKnowledgeBankPracticeProblems(
  filters: KnowledgeBankFilters = {}
): KnowledgeBankPracticeProblem[] {
  return selectKnowledgeBankProblems(filters).map((entry) => ({
    ...entry.problem,
    interviewSignal: entry.interviewSignal,
    canonicalCases: entry.canonicalCases,
  }));
}

function normalizeList(values?: string[]): string[] {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}
