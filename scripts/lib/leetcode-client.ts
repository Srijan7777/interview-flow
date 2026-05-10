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
