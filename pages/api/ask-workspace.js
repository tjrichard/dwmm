import {
  aiWorkflows,
  artifacts,
  caseStudies,
  curatedResources,
  designSystems,
  workspaceProfile,
  workspaceSections,
} from "../../data/workspace/workspaceContent";

const staticDocs = [
  ...workspaceSections,
  ...caseStudies,
  ...aiWorkflows,
  ...designSystems,
  ...artifacts,
  ...curatedResources,
  workspaceProfile,
];

function normalizeDoc(doc) {
  return {
    id: doc.id,
    title: doc.title,
    type: doc.type,
    path: doc.path,
    summary: doc.askSummary || doc.summary || doc.description || doc.excerpt || "",
  };
}

function scoreDoc(question, doc) {
  const haystack = `${doc.title} ${doc.type} ${doc.path} ${doc.summary}`.toLowerCase();
  const tokens = String(question || "")
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((token) => token.length > 1);
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function buildFallbackAnswer(question, docs, resolvedScope) {
  const docList = docs.slice(0, 4);
  const core = docList
    .map((doc) => `${doc.title}: ${doc.summary}`)
    .join(" ");

  return {
    answer:
      core ||
      "The public workspace is structured around B2B SaaS case studies, AI-assisted workflows, design systems, essays, resources, and Ryan's product design profile.",
    citations: docList.map((doc) => ({ id: doc.id, title: doc.title, path: doc.path })),
    resolvedScope,
    suggestedQuestions: [
      "How does Ryan use AI in product design?",
      "Which files best show B2B SaaS judgment?",
      "What should I read first?",
    ],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question = "", scopes = [], currentNode = null, workspaceContext = [] } = req.body || {};
  const trimmedQuestion = String(question || "").trim();
  if (!trimmedQuestion) {
    return res.status(400).json({ error: "Question is required" });
  }

  const docs = [
    ...staticDocs.map(normalizeDoc),
    ...(Array.isArray(workspaceContext) ? workspaceContext.map(normalizeDoc) : []),
    currentNode ? normalizeDoc(currentNode) : null,
  ]
    .filter(Boolean)
    .filter((doc, index, list) => list.findIndex((item) => item.id === doc.id) === index);

  const scopedDocs = Array.isArray(scopes) && scopes.length > 0
    ? docs.filter((doc) => scopes.includes(doc.id))
    : docs;

  const rankedDocs = [...scopedDocs]
    .map((doc) => ({ ...doc, score: scoreDoc(trimmedQuestion, doc) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const resolvedScope = Array.isArray(scopes) && scopes.length > 0 ? scopes : ["all-public-workspace"];
  const fallback = buildFallbackAnswer(trimmedQuestion, rankedDocs, resolvedScope);
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return res.status(200).json(fallback);
  }

  try {
    const context = rankedDocs
      .map((doc, index) => `[${index + 1}] ${doc.title} (${doc.type})\nPath: ${doc.path}\n${doc.summary}`)
      .join("\n\n");
    const prompt = `You are the contextual assistant for Ryan's public B2B SaaS product design workspace.
Answer using only the provided context. Do not invent metrics, clients, employment details, or outcomes. If proof is missing, say it is not verified in the public workspace.
Return concise plain text.

Question:
${trimmedQuestion}

Context:
${context}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      return res.status(200).json(fallback);
    }

    const result = await response.json();
    const answer = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) {
      return res.status(200).json(fallback);
    }

    return res.status(200).json({
      ...fallback,
      answer,
    });
  } catch (error) {
    return res.status(200).json(fallback);
  }
}
