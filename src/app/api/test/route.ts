import { NextRequest } from "next/server";
import { PISTON_TEST_CASES } from "@/lib/problem-stubs";
import { getHarness } from "@/lib/piston-harness";
import { getKnowledgeBankProblemById } from "@/lib/dsa-knowledge-bank";

interface TestRequest {
  code: string;
  language: string;
  problemId: number;
}

interface TestResult {
  passed: number;
  total: number;
  results: {
    testCase: number;
    label: string;
    passed: boolean;
    expected: string;
    actual?: string;
    error?: string;
  }[];
}

// Map languages to Judge0 language IDs
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63,  // JavaScript (Node.js 18.15.0)
  python: 71,      // Python (3.10.0)
  java: 62,        // Java (15.0.2)
  cpp: 54,         // C++ (10.2.0)
};

const JUDGE0_API = "https://ce.judge0.com";

// Poll for execution result with retries
async function pollForResult(token: string, maxAttempts: number = 10): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${JUDGE0_API}/submissions/${token}?base64_encoded=false`);

    if (!response.ok) {
      throw new Error(`Failed to poll Judge0: ${response.statusText}`);
    }

    const result = await response.json();

    // Status 1 = In Queue, 2 = Processing, 3+ = Done
    if (result.status.id > 2) {
      return result;
    }

    // Wait before polling again (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, Math.min(100 * (i + 1), 500)));
  }

  throw new Error("Execution timeout: Judge0 took too long to respond");
}

async function executeWithJudge0(
  languageId: number,
  sourceCode: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; compile_output?: string; status_id: number }> {
  // Submit code for execution
  const submitResponse = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin,
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
  });

  if (!submitResponse.ok) {
    throw new Error(`Judge0 submission failed: ${submitResponse.statusText}`);
  }

  const submitData = await submitResponse.json();
  const token = submitData.token;

  // Poll for result
  const result = await pollForResult(token);

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    compile_output: result.compile_output || "",
    status_id: result.status.id,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json();
    const { code, language, problemId } = body;

    if (!code || !language || !problemId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const testCases = PISTON_TEST_CASES[problemId];
    const languageId = LANGUAGE_MAP[language];
    if (!languageId) {
      return Response.json(
        { error: `Language '${language}' not supported` },
        { status: 400 }
      );
    }

    if (!testCases || testCases.length === 0) {
      const curatedProblem = getKnowledgeBankProblemById(problemId);
      if (!curatedProblem) {
        return Response.json(
          { error: "No test cases found for this problem" },
          { status: 404 }
        );
      }

      if (!curatedProblem.canonicalCases || curatedProblem.canonicalCases.length === 0) {
        return Response.json({
          ok: false,
          draft: true,
          message: "Test cases pending — submit disabled for this problem.",
          passed: 0,
          total: 0,
          results: [],
        });
      }

      // No auto-test harness for this problem yet → compile-only check.
      // Send the code to Judge0 with empty stdin; report any compile error.
      try {
        const compileRun = await executeWithJudge0(languageId, code, "");
        const compileFailed =
          compileRun.status_id === 6 || // 6 = Compilation Error
          !!compileRun.compile_output?.trim();

        if (compileFailed) {
          return Response.json({
            ok: false,
            reviewOnly: true,
            passed: 0,
            total: 1,
            results: [
              {
                testCase: 1,
                label: "Compilation",
                passed: false,
                expected: "Code compiles successfully",
                error: (compileRun.compile_output || compileRun.stderr || "Compilation error").trim(),
              },
            ],
          } as TestResult & { ok: boolean; reviewOnly: boolean });
        }

        // Compiles OK — surface canonical cases as reference, no auto-check.
        return Response.json({
          ok: true,
          reviewOnly: true,
          message:
            "Code compiles. No auto-check available for this problem — AI grades at submit.",
          passed: 0,
          total: curatedProblem.canonicalCases.length,
          results: curatedProblem.canonicalCases.map((testCase, index) => ({
            testCase: index + 1,
            label: testCase.label,
            passed: false,
            expected: testCase.output,
            error: "Compile-only mode — verify manually against sample inputs.",
          })),
        } as TestResult & { ok: boolean; reviewOnly: boolean });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({
          ok: false,
          reviewOnly: true,
          passed: 0,
          total: 1,
          results: [
            {
              testCase: 1,
              label: "Compilation",
              passed: false,
              expected: "Code compiles successfully",
              error: `Compile check failed: ${msg}`,
            },
          ],
        } as TestResult & { ok: boolean; reviewOnly: boolean });
      }
    }

    // Get harness for this language/problem once, outside the loop
    const harness = getHarness(language, problemId);
    if (!harness) {
      return Response.json({
        passed: 0,
        total: testCases.length,
        results: testCases.map((testCase, index) => ({
          testCase: index + 1,
          label: testCase.label,
          passed: false,
          expected: testCase.expected,
          error: "No harness template for this problem",
        })),
      } as TestResult);
    }

    // Inject user code into harness once
    const fullSource = harness.replace("// USER_CODE", code);

    // Execute test cases in parallel
    const testPromises = testCases.map(async (testCase, i) => {
      try {
        // Execute via Judge0 CE
        const execResult = await executeWithJudge0(languageId, fullSource, testCase.stdin);

        // Check for compile errors (status_id 6 = compilation error)
        if (execResult.status_id === 6 && execResult.compile_output) {
          return {
            testCase: i + 1,
            label: testCase.label,
            passed: false,
            expected: testCase.expected,
            error: `Compilation Error:\n${execResult.compile_output}`,
          };
        }

        // Check for runtime errors (status_id 5 = runtime error)
        if (execResult.status_id === 5 && execResult.stderr) {
          return {
            testCase: i + 1,
            label: testCase.label,
            passed: false,
            expected: testCase.expected,
            error: `Runtime Error:\n${execResult.stderr}`,
          };
        }

        // Status 3 = accepted (success)
        if (execResult.status_id !== 3) {
          return {
            testCase: i + 1,
            label: testCase.label,
            passed: false,
            expected: testCase.expected,
            error: `Execution failed with status ${execResult.status_id}`,
          };
        }

        const actual = execResult.stdout.trim();
        const expected = testCase.expected.trim();
        const passed = actual === expected;

        return {
          testCase: i + 1,
          label: testCase.label,
          passed,
          expected,
          actual,
        };
      } catch (err: any) {
        return {
          testCase: i + 1,
          label: testCase.label,
          passed: false,
          expected: testCase.expected,
          error: err.message || "Unknown error",
        };
      }
    });

    const results = await Promise.all(testPromises);
    const passedCount = results.filter((r) => r.passed).length;

    return Response.json({
      passed: passedCount,
      total: testCases.length,
      results,
    } as TestResult);
  } catch (error: any) {
    console.error("Test execution error:", error);
    return Response.json(
      { error: "Failed to run tests: " + error.message },
      { status: 500 }
    );
  }
}
