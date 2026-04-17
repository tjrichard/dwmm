import React, { useEffect, useMemo, useRef, useState } from "react";
import { getNodeAccent } from "../../lib/workspace";

const suggestedByType = {
  "case-study": [
    "What product judgment does this case show?",
    "What constraints shaped the solution?",
    "How would this scale in B2B SaaS?",
  ],
  "ai-workflow": [
    "How is AI used without replacing judgment?",
    "What inputs does this workflow need?",
    "What should be rejected from AI output?",
  ],
  "design-system": [
    "How does this help engineering?",
    "Which states matter most for B2B SaaS?",
    "How should this be governed?",
  ],
  essay: [
    "Summarize the core thesis.",
    "Which case studies relate to this essay?",
    "What does this reveal about Ryan's design thinking?",
  ],
  resource: [
    "Why is this resource useful?",
    "Which workspace files relate to this?",
    "How should a B2B designer use it?",
  ],
  about: [
    "What kind of product designer is Ryan?",
    "How does Ryan use AI?",
    "What strengths show up across the archive?",
  ],
};

function getInspectorRows(node) {
  if (!node) return [];
  if (node.type === "case-study") {
    return [
      ["Type", "Case Study"],
      ["Role", node.role],
      ["Status", node.status],
      ["Stakeholders", node.stakeholders?.join(", ")],
      ["Signals", node.signals?.join(", ")],
      ["Outcome", node.outcome],
    ];
  }
  if (node.type === "ai-workflow") {
    return [
      ["Type", "AI Workflow"],
      ["Input", node.input?.join(", ")],
      ["Synthesis", node.synthesis?.join(", ")],
      ["Human judgment", node.humanJudgment?.join(", ")],
      ["Output", node.output?.join(", ")],
    ];
  }
  if (node.type === "design-system") {
    return [
      ["Type", "Design System"],
      ["Governance", node.governance?.join(", ")],
      ["Matrix rows", node.matrix ? String(Math.max(0, node.matrix.length - 1)) : "0"],
    ];
  }
  if (node.type === "essay") {
    return [
      ["Type", "Notion Essay"],
      ["Category", node.category],
      ["Tags", node.tags?.join(", ")],
      ["Published", node.created_at || ""],
    ];
  }
  if (node.type === "resource") {
    const rows = [
      ["Type", "Resource"],
      ["Category", node.category],
      ["Tags", node.tags?.join(", ")],
      ["Why it matters", node.whyItMatters],
      ["Public link", node.original_link],
    ];
    if (node.rawId || node.vote_count || node.click_count) {
      rows.push(["Public engagement", `${node.vote_count || 0} votes / ${node.click_count || 0} clicks`]);
    }
    return rows;
  }
  if (node.type === "about") {
    return [
      ["Type", "Profile"],
      ["Role", node.inspector?.role],
      ["Domains", node.inspector?.domains?.join(", ")],
      ["Collaboration", node.inspector?.collaboration?.join(", ")],
    ];
  }
  return [
    ["Type", node.type],
    ["Path", node.path],
    ["Summary", node.summary],
  ];
}

function WorkspaceInspector({
  workspace,
  selectedNode,
  askSeed,
  isInspectorOpen = false,
  onToggleInspector = () => {},
  isContextCollapsed = false,
  onToggleContext = () => {},
}) {
  const editorRef = useRef(null);
  const [activeTab, setActiveTab] = useState("context");
  const [question, setQuestion] = useState("");
  const [scopeChips, setScopeChips] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rows = useMemo(() => getInspectorRows(selectedNode).filter(([, value]) => value), [selectedNode]);
  const suggestions = suggestedByType[selectedNode?.type] || suggestedByType.about;

  useEffect(() => {
    if (selectedNode?.id) {
      setScopeChips([{ id: selectedNode.id, label: selectedNode.title || selectedNode.path }]);
      setMessages([]);
      setError("");
      setActiveTab("context");
    }
  }, [selectedNode?.id, selectedNode?.title, selectedNode?.path]);

  useEffect(() => {
    if (askSeed?.id) {
      setActiveTab("ask");
      setQuestion(askSeed.question || "");
      if (editorRef.current) {
        editorRef.current.textContent = askSeed.question || "";
      }
      setTimeout(() => editorRef.current?.focus(), 0);
    }
  }, [askSeed?.id, askSeed?.question]);

  async function submitAsk(nextQuestion = question) {
    const trimmed = String(nextQuestion || "").trim();
    if (!trimmed || loading) return;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((items) => [...items, userMessage]);
    setQuestion("");
    if (editorRef.current) editorRef.current.textContent = "";
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ask-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          scopes: scopeChips.map((chip) => chip.id),
          currentNode: selectedNode,
          workspaceContext: workspace.nodes.map((node) => ({
            id: node.id,
            title: node.title,
            type: node.type,
            path: node.path,
            summary: node.askSummary || node.summary || node.description || node.excerpt || "",
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ask AI failed");
      setMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          citations: data.citations || [],
          resolvedScope: data.resolvedScope || [],
        },
      ]);
    } catch (err) {
      const message = err.message || "Ask AI failed";
      setError(message);
      setMessages((items) => [
        ...items,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: message,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={`workspace-inspector${isInspectorOpen ? " is-open" : ""}${
        isContextCollapsed ? " is-collapsed" : ""
      }`}
      data-accent={getNodeAccent(selectedNode?.type)}
      aria-label="Context inspector"
    >
      <button type="button" className="workspace-inspector__mobile-toggle" onClick={onToggleInspector}>
        {isInspectorOpen ? "Close inspector" : "Inspector / Ask AI"}
      </button>

      <div className="workspace-inspector__tabs" role="tablist" aria-label="Inspector modes">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "context"}
          className={activeTab === "context" ? "is-active" : ""}
          onClick={() => setActiveTab("context")}
        >
          Context
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ask"}
          className={activeTab === "ask" ? "is-active" : ""}
          onClick={() => setActiveTab("ask")}
        >
          Ask
        </button>
        <button type="button" className="workspace-inspector__collapse" onClick={onToggleContext}>
          Collapse
        </button>
      </div>

      {activeTab === "context" && (
        <div className="inspector-tab-panel" role="tabpanel">
          <section className="inspector-block inspector-block--selected">
            <span className="workspace-kicker">CONTEXT INFO</span>
            <h2>{selectedNode?.title}</h2>
            <p>{selectedNode?.summary || selectedNode?.description || selectedNode?.excerpt}</p>
          </section>

          <section className="inspector-block">
            <span className="workspace-kicker">PROPERTIES</span>
            <div className="inspector-table">
              {rows.map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "ask" && (
        <section className="inspector-tab-panel inspector-ask" role="tabpanel">
          <span className="workspace-kicker">ASK RYAN'S ARCHIVE</span>
          <div className="scope-chip-row" aria-label="Ask AI context scopes">
            {scopeChips.length > 0 ? (
              scopeChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setScopeChips((chips) => chips.filter((item) => item.id !== chip.id))}
                  aria-label={`Remove ${chip.label} scope`}
                >
                  {chip.label}
                  <span>×</span>
                </button>
              ))
            ) : (
              <em>all public workspace context</em>
            )}
          </div>

          <div className="ask-thread" aria-live="polite">
            {messages.length === 0 && (
              <p className="ask-empty">Ask against the selected file, or remove the scope chip to query the full public workspace.</p>
            )}
            {messages.map((message) => (
              <article className={`ask-message ask-message--${message.role}${message.isError ? " is-error" : ""}`} key={message.id}>
                <span>{message.role === "user" ? "You" : "Archive"}</span>
                <p>{message.content}</p>
                {message.citations?.length > 0 && (
                  <div className="ask-citations">
                    {message.citations.map((citation) => (
                      <em key={citation.id}>{citation.title}</em>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {loading && (
              <article className="ask-message ask-message--assistant">
                <span>Archive</span>
                <p>Reading scoped files...</p>
              </article>
            )}
          </div>

          <div className="ask-suggestions">
            <span>Templates</span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuestion(item);
                  if (editorRef.current) editorRef.current.textContent = item;
                  editorRef.current?.focus();
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <form
            className="ask-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitAsk();
            }}
          >
            <div
              id="workspace-ask-input"
              ref={editorRef}
              className="ask-editor"
              contentEditable
              role="textbox"
              aria-multiline="true"
              data-placeholder="Ask about this workspace..."
              onInput={(event) => setQuestion(event.currentTarget.textContent || "")}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submitAsk(event.currentTarget.textContent || "");
                }
              }}
            />
            <button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Thinking" : "Ask"}
            </button>
          </form>

          {error && <p className="ask-error">{error}</p>}
        </section>
      )}
    </aside>
  );
}

export default WorkspaceInspector;
