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
  requirements: string[];
  diagramDescription: string;
  experience: string;
  timeTakenMinutes: number;
}): string {
  return `You are a principal engineer evaluating a FAANG system design interview.

## Candidate Profile
- Experience: ${params.experience} years
- Time taken: ${params.timeTakenMinutes} min

## System Design Prompt
${params.title}

## Requirements
${params.requirements.map((r) => `- ${r}`).join("\n")}

## Candidate's Design
${params.diagramDescription}

Evaluate strictly. Rate correctness, efficiency, clarity, completeness.

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
  }
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
  requirements: string[];
  code: string;
  experience: string;
  timeTakenMinutes: number;
}): string {
  return `You are a principal engineer evaluating a FAANG Low-Level Design (LLD) interview.

## Candidate Profile
- Experience: ${params.experience} years
- Time taken: ${params.timeTakenMinutes} min

## System Design Prompt
${params.title}

## Requirements
${params.requirements.map((r) => `- ${r}`).join("\n")}

## Candidate Code
${params.code}

Evaluate strictly on OOD principles (SOLID, patterns, modularity).

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
  }
}`;
}

export async function generateLLDReportGroq(params: {
  title: string;
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
    reference: params.referenceUrl
      ? { url: params.referenceUrl, label: params.referenceLabel || "Reference" }
      : undefined,
  };
}
