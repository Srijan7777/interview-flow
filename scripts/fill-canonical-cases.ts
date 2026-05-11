/**
 * Fill canonicalCases for bank entries that have an empty array, by
 * parsing the Example blocks from LeetCode's `content` HTML (already
 * fetched + stored in src/data/leetcode-problems.json).
 *
 * Run: npx tsx scripts/fill-canonical-cases.ts
 */
import fs from "fs";
import path from "path";

const BANK = path.join("src", "lib", "dsa-knowledge-bank.ts");
const LC = path.join("src", "data", "leetcode-problems.json");

type Case = { label: string; input: string; output: string };

function cleanText(s: string): string {
  return s
    .replace(/<\/?(strong|em|sup|sub|code|span|b|i|u)[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCases(content: string): Case[] {
  if (!content) return [];
  // Find every Input/Output pair anywhere in the content.
  // LC format inside <pre>:
  //   <strong>Input:</strong> nums = [...] target = 9
  //   <strong>Output:</strong> [0,1]
  //   <strong>Explanation:</strong> ...   (optional)
  const pairRegex =
    /<strong>\s*Input\s*:?\s*<\/strong>([\s\S]*?)<strong>\s*Output\s*:?\s*<\/strong>([\s\S]*?)(?=<strong>\s*(?:Explanation|Note|Constraint|Input)\s*:?\s*<\/strong>|<\/pre>|<\/p>\s*<p[^>]*>\s*<strong\s+class="example"|$)/gi;
  const cases: Case[] = [];
  let m: RegExpExecArray | null;
  while ((m = pairRegex.exec(content)) !== null && cases.length < 5) {
    const input = cleanText(m[1]);
    const output = cleanText(m[2]);
    if (!input || !output) continue;
    cases.push({
      label: `Example ${cases.length + 1}`,
      input,
      output,
    });
  }
  return cases;
}

function formatCase(c: Case, indent: string): string {
  const inputLit = JSON.stringify(c.input);
  const outputLit = JSON.stringify(c.output);
  const labelLit = JSON.stringify(c.label);
  return `${indent}{ label: ${labelLit}, input: ${inputLit}, output: ${outputLit} },`;
}

function main() {
  const lcRaw = fs.readFileSync(LC, "utf8");
  const lc: Record<string, { content?: string }> = JSON.parse(lcRaw);
  const bankRaw = fs.readFileSync(BANK, "utf8");

  const lines = bankRaw.split(/\r?\n/);
  const newLines: string[] = [];
  let currentLc: number | null = null;
  let filled = 0;
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lcMatch = line.match(/^\s*leetcodeNumber:\s*(\d+),/);
    if (lcMatch) currentLc = parseInt(lcMatch[1], 10);

    const emptyCases = line.match(/^(\s*)canonicalCases:\s*\[\s*\],?\s*$/);
    if (emptyCases && currentLc !== null) {
      const e = lc[String(currentLc)];
      const cases = e ? parseCases(e.content || "") : [];
      if (cases.length > 0) {
        const outerIndent = emptyCases[1];
        const innerIndent = outerIndent + "  ";
        newLines.push(`${outerIndent}canonicalCases: [`);
        for (const c of cases) newLines.push(formatCase(c, innerIndent));
        newLines.push(`${outerIndent}],`);
        filled++;
        currentLc = null;
        continue;
      } else {
        skipped++;
        currentLc = null;
      }
    }
    newLines.push(line);
  }

  const out = newLines.join("\n");
  fs.writeFileSync(BANK, out, "utf8");
  console.log(`filled: ${filled}, skipped (no parsable examples): ${skipped}`);
}

main();
