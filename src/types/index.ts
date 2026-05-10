export interface Problem {
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
  timesAttempted?: number;
  lastAttemptDate?: string | null;
  description?: string;
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  codeStub?: string;
  diagram?: string;
}

export interface Progress {
  version: number;
  targetCompanies: string[];
  mockDay: string;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
  totalProblems: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  byTopic: Record<string, number>;
  mockInterviews: {
    completed: number;
    history: string[];
  };
  weeklyGoal: {
    target: number;
    completedThisWeek: number;
    weekStart: string;
  };
}

export interface SessionLogEntry {
  date: string;
  type: "daily-problem" | "mock-interview" | "hld" | "lld";
  problemId: string;
  topic: string;
  result: "solved" | "partial" | "stuck";
  timeMinutes: number;
  score: number;
  notes: string;
}

export interface AttemptedProblem {
  problemId: string;
  dates: string[];
  bestResult: string;
  attempts: number;
  avgTime: number;
  selfScore: number;
  needsReview: boolean;
}

export interface TestResultItem {
  testCase: number;
  label: string;
  passed: boolean;
  expected: string;
  actual?: string;
  error?: string;
}

export interface SessionTestResult {
  passed: number;
  total: number;
  results: TestResultItem[];
}

export interface SessionReport {
  sessionId: string;
  generatedAt: string;
  sessionType: "dsa" | "hld" | "lld";
  experience: string;
  problem: {
    id: string;
    title: string;
    topic: string;
    difficulty: string;
    leetcodeNumber: number;
  };
  score: {
    overall: number;
    breakdown: {
      correctness: number;
      efficiency: number;
      clarity: number;
      completeness: number;
    };
  };
  strengths: string[];
  issues: string[];
  improvements: string[];
  missing: string[];
  optimalApproach: {
    summary: string;
    code?: string;
    pseudocode?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    keyInsights: string[];
  };
  recommendation: {
    shouldRetry: boolean;
    suggestedTopics: string[];
    nextDifficulty: "easy" | "medium" | "hard";
  };
  reference?: {
    url: string;
    label: string;
  };
}

export interface SessionStartPayload {
  type: "dsa" | "hld" | "lld";
  experience: string;
  problemId?: string;
}

export interface SessionStartResponse {
  sessionId: string;
  problem?: Problem;
  scenario?: HLDScenario;
  lldScenario?: LLDScenario;
  startedAt: string;
  duration: number;
}

export interface HLDFormData {
  functionalReqs: string;
  nonFunctionalReqs: string;
  entities: string;
  apiDesign: string;
  nfrPlan: string;
}

export interface HLDScenario {
  id: string;
  title: string;
  prompt: string;
  requirements: string[];
  difficulty: "easy" | "medium" | "hard";
  referenceUrl?: string;
  referenceLabel?: string;
  companies?: string[];
}

export interface LLDScenario {
  id: string;
  title: string;
  prompt: string;
  requirements: string[];
  difficulty: "easy" | "medium" | "hard";
  referenceUrl?: string;
  referenceLabel?: string;
}

export interface Topics {
  rotation: string[];
  currentIndex: number;
  lastAdvancedDate: string;
  coverage: Record<string, number>;
}

export interface DailyProblem {
  date: string;
  topic: string;
  problem: Problem;
}

export interface DsaRoundQuestion {
  index: number;
  problem: Problem;
  allocatedMinutes: number;
  status: "pending" | "in-progress" | "completed" | "skipped";
  result?: "solved" | "partial" | "stuck";
  code?: string;
  language?: string;
  timeTakenMinutes?: number;
  testPassed?: number;
  testTotal?: number;
  score?: number;
}

export interface DsaRound {
  roundId: string;
  experience: string;
  questions: DsaRoundQuestion[];
  startedAt: string;
  status: "in-progress" | "completed";
}

export interface FollowUp {
  question: string;
  difficulty: "easy" | "medium" | "hard";
  hint: string;
}

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface WeaknessEntry {
  topic: string;
  score: number;
  date: string;
  problemTitle: string;
}

export interface QuestionFeedback {
  score: number;
  feedback: string;
  strengths?: string[];
  issues?: string[];
}

export interface DsaRoundReport extends SessionReport {
  questions: DsaRoundQuestion[];
  totalAllocatedMinutes: number;
  totalTimeTakenMinutes: number;
  followUps?: Record<string, FollowUp[]>;
  weakTopics?: string[];
  questionFeedback?: Record<number, QuestionFeedback>;
}
