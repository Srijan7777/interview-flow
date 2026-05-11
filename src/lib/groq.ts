import { Problem, SessionReport, DsaRound, DsaRoundReport } from "@/types";
import { getLeetCodeDescriptionText, getLeetCodeExamplesRaw } from "@/lib/leetcode-data";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface GroqResponse {
  choices: { message: { content: string } }[];
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const response = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API failed: ${response.status} ${errText}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0].message.content;
}

function buildDSAPrompt(params: {
  problem: Problem;
  code: string;
  experience: string;
  timeTakenMinutes: number;
  allocatedMinutes: number;
}): string {
  return `You are a senior FAANG interviewer evaluating a coding solution.

## Candidate Profile
- Experience: ${params.experience} years
- Time allocated: ${params.allocatedMinutes} min
- Time taken: ${params.timeTakenMinutes} min

## Problem
- Title: ${params.problem.title} (LeetCode #${params.problem.leetcodeNumber})
- Topic: ${params.problem.topic}
- Difficulty: ${params.problem.difficulty}
- Optimal approach: ${params.problem.approach}
- Optimal time: ${params.problem.timeComplexity}
- Optimal space: ${params.problem.spaceComplexity}

## Candidate Code
\`\`\`
${params.code}
\`\`\`

Respond with ONLY valid JSON matching this schema:
{
  "score": {
    "overall": <1-10>,
    "breakdown": {
      "correctness": <1-10>,
      "efficiency": <1-10>,
      "clarity": <1-10>,
      "completeness": <1-10>
    }
  },
  "strengths": ["<strength1>", "<strength2>"],
  "issues": ["<issue1>", "<issue2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "missing": ["<missing1>"],
  "optimalApproach": {
    "summary": "<2-3 sentence summary>",
    "code": "<optimal solution>",
    "timeComplexity": "<complexity>",
    "spaceComplexity": "<complexity>",
    "keyInsights": ["<insight1>", "<insight2>"]
  },
  "recommendation": {
    "shouldRetry": <boolean>,
    "suggestedTopics": ["<topic1>"],
    "nextDifficulty": "easy"|"medium"|"hard"
  }
}`;
}

function buildHLDPrompt(params: {
  title: string;
  problemContext: string;
  requirements: string[];
  diagramDescription: string;
  experience: string;
  timeTakenMinutes: number;
}): string {
  const expYears = parseInt(params.experience) || 0;
  const expBand =
    expYears <= 1
      ? "entry-level (0-1 yrs): grade as a new grad; reward any reasonable architecture, do not expect deep distributed-systems mastery"
      : expYears <= 3
      ? "junior (2-3 yrs): grade against SDE II bar; reward concrete tech choices and basic capacity estimates"
      : expYears <= 6
      ? "mid-senior (4-6 yrs): grade against Senior SDE bar; expect trade-off discussion, failure modes, and scaling math"
      : "senior+ (7+ yrs): grade against Staff bar; expect deep dives, cross-cutting concerns, multi-region thinking";

  return `You are a SUPPORTIVE principal engineer running a FAANG mock system design interview.

Your goal: encourage candidates and accurately reward strong designs. Be LENIENT but honest.
This is practice, not a real interview - we want the candidate to leave motivated to keep practicing.

## Candidate Profile
- Experience: ${params.experience} years → ${expBand}
- Time taken: ${params.timeTakenMinutes} min

## Scoring Guide (calibrate to candidate's experience band above)
- 10 = production-ready design at staff+ level (reserved for exceptional answers)
- 9 = senior bar: all reqs covered with concrete tech + numbers + trade-offs
- 8 = solid mid bar: all reqs addressed, some hand-waving acceptable
- 7 = adequate: 1-2 reqs partially covered, missing depth in places
- 6 = passing: most reqs touched, lacks specificity
- 5 or below = significant gaps or wrong approach

## What to reward (do NOT deduct for missing these)
- Concrete tech choices (named DBs, message queues, caches)
- Capacity numbers (QPS, storage, latency budgets)
- Failure modes and mitigations
- Trade-off discussion (consistency vs availability, cost vs latency)
- Deep dives on bottlenecks
- API design or data model details
- Text-only diagrams ARE fine — do NOT deduct for lack of visual diagrams

## What to deduct for (be specific)
- Missing or mis-addressed requirements (cite which one)
- Wrong tech for the use case (justify why wrong)
- Internally inconsistent design (e.g. claims strong consistency but uses eventually-consistent store)

## Experience-aware bonus
- For entry/junior bands, ADD +1 to overall if the design shows clear thinking even if missing depth.
- For senior+ band, do NOT inflate — they should meet the senior bar.

## System Design Prompt
${params.title}

## Problem Context
${params.problemContext}

## Requirements (grading rubric — these are what MUST be addressed)
${params.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Candidate's Design
${params.diagramDescription}

## Follow-up questions
Generate 4-6 follow-up questions a real interviewer would ask based on the candidate's design.
- Mix easy/medium/hard
- Probe gaps you identified, OR push deeper on what they covered well
- Each follow-up should have a one-line hint to nudge their thinking

Respond with ONLY valid JSON:
{
  "score": {
    "overall": <1-10>,
    "breakdown": {
      "correctness": <1-10>,
      "efficiency": <1-10>,
      "clarity": <1-10>,
      "completeness": <1-10>
    }
  },
  "strengths": ["<strength1>", "<strength2>"],
  "issues": ["<issue1>", "<issue2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "missing": ["<missing1>", "<missing2>"],
  "optimalApproach": {
    "summary": "<3-4 sentences on reference architecture>",
    "pseudocode": "<component list and data flow>",
    "keyInsights": ["<insight1>", "<insight2>"]
  },
  "recommendation": {
    "shouldRetry": <boolean>,
    "suggestedTopics": ["<topic1>", "<topic2>"],
    "nextDifficulty": "easy"|"medium"|"hard"
  },
  "followUps": [
    { "question": "<interviewer follow-up Q>", "difficulty": "easy"|"medium"|"hard", "hint": "<one-line hint>" }
  ]
}`;
}

export async function generateDSAReportGroq(params: {
  problem: Problem;
  code: string;
  experience: string;
  timeTakenMinutes: number;
  allocatedMinutes: number;
}): Promise<SessionReport> {
  const prompt = buildDSAPrompt(params);
  const text = await callGroq(prompt);
  const parsed = JSON.parse(text);

  return {
    sessionId: "",
    generatedAt: new Date().toISOString(),
    sessionType: "dsa",
    experience: params.experience,
    problem: {
      id: params.problem.id,
      title: params.problem.title,
      topic: params.problem.topic,
      difficulty: params.problem.difficulty,
      leetcodeNumber: params.problem.leetcodeNumber,
    },
    score: parsed.score,
    strengths: parsed.strengths,
    issues: parsed.issues,
    improvements: parsed.improvements,
    missing: parsed.missing,
    optimalApproach: parsed.optimalApproach,
    recommendation: parsed.recommendation,
    reference: params.problem.url
      ? { url: params.problem.url, label: "LeetCode" }
      : undefined,
  };
}

export async function generateHLDReportGroq(params: {
  title: string;
  problemContext: string;
  requirements: string[];
  diagramDescription: string;
  experience: string;
  timeTakenMinutes: number;
  referenceUrl?: string;
  referenceLabel?: string;
}): Promise<SessionReport> {
  const prompt = buildHLDPrompt(params);
  const text = await callGroq(prompt);
  const parsed = JSON.parse(text);

  return {
    sessionId: "",
    generatedAt: new Date().toISOString(),
    sessionType: "hld",
    experience: params.experience,
    problem: {
      id: "",
      title: params.title,
      topic: "system-design",
      difficulty: "hard",
      leetcodeNumber: 0,
    },
    score: parsed.score,
    strengths: parsed.strengths,
    issues: parsed.issues,
    improvements: parsed.improvements,
    missing: parsed.missing,
    optimalApproach: parsed.optimalApproach,
    recommendation: parsed.recommendation,
    interviewerFollowUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
    reference: params.referenceUrl
      ? { url: params.referenceUrl, label: params.referenceLabel || "Reference" }
      : undefined,
  };
}

export async function generateRoundReport(round: DsaRound, experience: string): Promise<DsaRoundReport> {
  const questionsText = round.questions
    .map((q, i) => {
      const timeStr = q.timeTakenMinutes !== undefined ? `${q.timeTakenMinutes}/${q.allocatedMinutes}` : "N/A";
      const lcNum = q.problem.leetcodeNumber;
      const description = lcNum ? getLeetCodeDescriptionText(lcNum) : "";
      const examples = lcNum ? getLeetCodeExamplesRaw(lcNum) : "";
      const descBlock = description
        ? `Problem Description:\n${description.slice(0, 2000)}\n`
        : `Problem Description: (not available — grade by inferring from title and code)\n`;
      const examplesBlock = examples
        ? `Example Test Cases:\n${examples.slice(0, 800)}\n`
        : "";
      return `=== Q${i + 1}: ${q.problem.title} (${q.problem.difficulty}) ===
Topic: ${q.problem.topic}
LeetCode #: ${lcNum ?? "N/A"}
Time: ${timeStr} min
Result: ${q.result || "not attempted"}
Auto-tests: ${q.testPassed ?? 0}/${q.testTotal ?? 0}
Language: ${q.language || "unknown"}

${descBlock}
${examplesBlock}
Candidate Code:
\`\`\`${q.language || ""}
${q.code || "(no code submitted)"}
\`\`\``;
    })
    .join("\n\n---\n\n");

  const prompt = `You are a senior FAANG interviewer evaluating a multi-question coding round.

## Round Summary
- Experience: ${experience} years
- Total Questions: ${round.questions.length}
- Total Time Allocated: ${round.questions.reduce((s, q) => s + q.allocatedMinutes, 0)} min
- Total Time Taken: ${round.questions.reduce((s, q) => s + (q.timeTakenMinutes || 0), 0)} min

## Detailed Question Breakdown
${questionsText}

For EACH question, evaluate the candidate's code against the problem description and example test cases. Identify specific bugs, off-by-one errors, missing edge cases, suboptimal complexity, naming issues. Be specific — quote variable names or line excerpts where useful. If the code is correct, say so plainly.

Return ONLY valid JSON matching this exact shape:
{
  "questions": [
    {
      "index": 0,
      "score": 8,
      "feedback": "Concrete summary citing the candidate's code: what works, what's wrong. 2-4 sentences.",
      "strengths": ["Specific thing they did well, referencing their code"],
      "issues": ["Specific bug or edge case missed, with the variable/line called out"]
    }
  ],
  "score": {
    "overall": 8,
    "breakdown": {
      "correctness": 8,
      "efficiency": 7,
      "clarity": 9,
      "completeness": 8
    }
  },
  "strengths": ["list of strengths"],
  "issues": ["list of issues"],
  "improvements": ["list of improvements"],
  "missing": ["list of missing items"],
  "optimalApproach": {
    "summary": "overall summary of how to approach these problems",
    "timeComplexity": "varies per question",
    "spaceComplexity": "varies per question",
    "keyInsights": ["pattern insight 1", "pattern insight 2"]
  },
  "recommendation": {
    "shouldRetry": false,
    "suggestedTopics": ["topic1", "topic2"],
    "nextDifficulty": "medium"
  },
  "followUps": {
    "0": [
      { "question": "What if the input was a stream?", "difficulty": "medium", "hint": "Think about memory" },
      { "question": "How to handle duplicates?", "difficulty": "easy", "hint": "Hash set" }
    ],
    "1": [ { "question": "Optimize for space", "difficulty": "hard", "hint": "In-place" } ]
  },
  "weakTopics": ["dynamic-programming", "graphs"]
}`;

  const text = await callGroq(prompt);
  const parsed = JSON.parse(text);

  // Build per-question feedback map keyed by question index
  const questionFeedback: DsaRoundReport["questionFeedback"] = {};
  if (Array.isArray(parsed.questions)) {
    for (const q of parsed.questions) {
      if (typeof q?.index === "number") {
        questionFeedback[q.index] = {
          score: typeof q.score === "number" ? q.score : 5,
          feedback: typeof q.feedback === "string" ? q.feedback : "",
          strengths: Array.isArray(q.strengths) ? q.strengths : undefined,
          issues: Array.isArray(q.issues) ? q.issues : undefined,
        };
      }
    }
  }

  // Backfill per-question score onto the round questions so weakness tracker works
  const questionsWithScore = round.questions.map((q, i) => ({
    ...q,
    score: questionFeedback[i]?.score ?? q.score,
  }));

  const report: DsaRoundReport = {
    sessionId: "",
    generatedAt: new Date().toISOString(),
    sessionType: "dsa",
    experience: experience,
    problem: {
      id: "",
      title: `Round: ${round.questions.length} Questions`,
      topic: "dsa-round",
      difficulty: "hard",
      leetcodeNumber: 0,
    },
    score: parsed.score || { overall: 5, breakdown: { correctness: 5, efficiency: 5, clarity: 5, completeness: 5 } },
    strengths: parsed.strengths || [],
    issues: parsed.issues || [],
    improvements: parsed.improvements || [],
    missing: parsed.missing || [],
    optimalApproach: parsed.optimalApproach || { summary: "", keyInsights: [] },
    recommendation: parsed.recommendation || { shouldRetry: true, suggestedTopics: [], nextDifficulty: "medium" },
    questions: questionsWithScore,
    totalAllocatedMinutes: round.questions.reduce((s, q) => s + q.allocatedMinutes, 0),
    totalTimeTakenMinutes: round.questions.reduce((s, q) => s + (q.timeTakenMinutes || 0), 0),
    followUps: parsed.followUps || {},
    weakTopics: parsed.weakTopics || [],
    questionFeedback,
  };

  return report;
}

function buildLLDPrompt(params: {
  title: string;
  problemContext: string;
  requirements: string[];
  code: string;
  experience: string;
  timeTakenMinutes: number;
}): string {
  const expYears = parseInt(params.experience) || 0;
  const expBand =
    expYears <= 1
      ? "entry-level (0-1 yrs): grade as a new grad; reward any reasonable OOD; do not expect mastery of all SOLID/design patterns"
      : expYears <= 3
      ? "junior (2-3 yrs): grade against SDE II bar; reward clean class boundaries and basic SOLID use"
      : expYears <= 6
      ? "mid-senior (4-6 yrs): grade against Senior SDE bar; expect SOLID, key patterns, extensibility hooks"
      : "senior+ (7+ yrs): grade against Staff bar; expect mastery — extensibility, testability, deep pattern fluency";

  return `You are a SUPPORTIVE principal engineer running a FAANG mock Low-Level Design (LLD) interview.

Your goal: encourage candidates and accurately reward solid OOD. Be LENIENT but honest.
This is practice, not a real interview - we want the candidate to leave motivated.

## Candidate Profile
- Experience: ${params.experience} years → ${expBand}
- Time taken: ${params.timeTakenMinutes} min

## Scoring Guide (calibrate to experience band above)
- 10 = production-grade design at staff+ level (rare)
- 9 = senior bar: clean SOLID, appropriate patterns, extensibility shown
- 8 = solid mid bar: requirements met, mostly clean OOD, minor issues
- 7 = adequate: works but rigid; some SOLID violations
- 6 = passing: works but tightly coupled or hard to extend
- 5 or below = significant design issues or missing requirements

## What to reward (do NOT deduct for missing these)
- Clear class boundaries and single responsibility
- Use of relevant design patterns (Strategy, Factory, Observer, etc.) when they fit
- Extensibility hooks (new types added without changing existing classes)
- Encapsulation (private fields, public methods, immutability where right)
- Test-friendly design (DI, interfaces over concrete)
- Concrete handling of edge cases mentioned in requirements

## What to deduct for (be specific)
- Missing or mis-handled requirements (cite which one)
- Hardcoded values where extensibility was explicitly asked
- God class (all logic in one class)
- Anemic models (no behavior, just data) when domain logic belongs there
- Internally inconsistent design

## Experience-aware bonus
- For entry/junior bands, ADD +1 to overall if class structure shows clear thinking.
- For senior+ band, do NOT inflate — they should meet the senior bar.

## LLD Problem
${params.title}

## Problem Context
${params.problemContext}

## Requirements (grading rubric — these are what MUST be addressed)
${params.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Candidate Code
\`\`\`
${params.code}
\`\`\`

## Follow-up questions
Generate 4-6 follow-up questions a real interviewer would ask based on the candidate's code.
- Mix easy/medium/hard
- Probe gaps in OOD OR push deeper on what they covered well
- Examples: "How would you extend X to support Y?", "What if the system needs thread safety?", "What pattern would help here?"
- Each follow-up gets a one-line hint

Respond with ONLY valid JSON:
{
  "score": {
    "overall": <1-10>,
    "breakdown": {
      "correctness": <1-10>,
      "efficiency": <1-10>,
      "clarity": <1-10>,
      "completeness": <1-10>
    }
  },
  "strengths": ["<strength1>", "<strength2>"],
  "issues": ["<issue1>", "<issue2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "missing": ["<missing1>", "<missing2>"],
  "optimalApproach": {
    "summary": "<3-4 sentences on ideal class structure>",
    "pseudocode": "<core classes and relationships>",
    "keyInsights": ["<insight1>", "<insight2>"]
  },
  "recommendation": {
    "shouldRetry": <boolean>,
    "suggestedTopics": ["<topic1>", "<topic2>"],
    "nextDifficulty": "easy"|"medium"|"hard"
  },
  "followUps": [
    { "question": "<interviewer follow-up Q>", "difficulty": "easy"|"medium"|"hard", "hint": "<one-line hint>" }
  ]
}`;
}

export async function generateLLDReportGroq(params: {
  title: string;
  problemContext: string;
  requirements: string[];
  code: string;
  experience: string;
  timeTakenMinutes: number;
  referenceUrl?: string;
  referenceLabel?: string;
}): Promise<SessionReport> {
  const prompt = buildLLDPrompt(params);
  const text = await callGroq(prompt);
  const parsed = JSON.parse(text);

  return {
    sessionId: "",
    generatedAt: new Date().toISOString(),
    sessionType: "lld",
    experience: params.experience,
    problem: {
      id: "",
      title: params.title,
      topic: "low-level-design",
      difficulty: "hard",
      leetcodeNumber: 0,
    },
    score: parsed.score,
    strengths: parsed.strengths,
    issues: parsed.issues,
    improvements: parsed.improvements,
    missing: parsed.missing,
    optimalApproach: parsed.optimalApproach,
    recommendation: parsed.recommendation,
    interviewerFollowUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
    reference: params.referenceUrl
      ? { url: params.referenceUrl, label: params.referenceLabel || "Reference" }
      : undefined,
  };
}
