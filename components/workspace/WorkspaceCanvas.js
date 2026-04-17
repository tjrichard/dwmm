import React, { useMemo } from "react";
import Link from "next/link";
import NotionBlockRenderer from "../NotionBlockRenderer";
import { getNodeAccent, getNodeRoute } from "../../lib/workspace";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function MetricRail({ items }) {
  return (
    <div className="workspace-metric-rail">
      {items.map((item) => (
        <div key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewCanvas({ workspace }) {
  return (
    <main className="workspace-canvas" data-accent="path">
      <section className="workspace-hero-canvas">
        <p className="workspace-kicker">Product Design Workspace</p>
        <h1>B2B SaaS product design, mapped like a system.</h1>
        <p>
          A public workspace for case studies, AI-assisted workflows, design-system thinking, essays,
          and resources for product teams that operate at enterprise complexity.
        </p>
        <MetricRail
          items={[
            { label: "case files", value: workspace.caseStudies.length },
            { label: "AI workflows", value: workspace.aiWorkflows.length },
            { label: "essays", value: workspace.essays.length },
            { label: "resources", value: workspace.resources.length },
          ]}
        />
      </section>

      <section className="workspace-topology">
        {[
          ["Input", "VOC, tickets, calls, product constraints"],
          ["Synthesis", "AI clustering, opportunity maps, IA alternatives"],
          ["Design", "Flows, states, system rules, prototypes"],
          ["Judgment", "Tradeoffs, rejected paths, product rationale"],
        ].map(([title, body]) => (
          <article key={title}>
            <span>{title}</span>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function SectionCanvas({ workspace, selectedNode }) {
  const items = workspace.nodes.filter((node) => {
    if (selectedNode.sectionType === "case-study") return node.type === "case-study";
    if (selectedNode.sectionType === "ai-workflow") return node.type === "ai-workflow";
    if (selectedNode.sectionType === "design-system") return node.type === "design-system";
    if (selectedNode.sectionType === "essay") return node.type === "essay";
    if (selectedNode.sectionType === "resource") return node.type === "resource";
    return false;
  });

  return (
    <main className="workspace-canvas" data-accent={getNodeAccent(selectedNode.sectionType)}>
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">{selectedNode.type.toUpperCase()}</p>
        <h1>{selectedNode.title}</h1>
        <p>{selectedNode.summary}</p>
      </div>
      <div className="workspace-file-grid">
        {items.map((item) => (
          <Link href={getNodeRoute(item)} className="workspace-file-card" data-accent={getNodeAccent(item.type)} key={item.id}>
            <span>{item.path}</span>
            <h2>{item.title}</h2>
            <p>{item.summary || item.description || item.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

function CaseCanvas({ node }) {
  return (
    <main className="workspace-canvas" data-accent="case">
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">CASE STUDY CANVAS</p>
        <h1>{node.title}</h1>
        <p>{node.summary}</p>
      </div>
      <div className="blueprint-map">
        <article className="blueprint-panel blueprint-panel--wide">
          <span>Problem Space</span>
          <p>{node.problem}</p>
        </article>
        <article className="blueprint-panel">
          <span>Constraints</span>
          <ul>{node.constraints?.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="blueprint-panel">
          <span>Signals</span>
          <ul>{node.signals?.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="blueprint-panel blueprint-panel--wide">
          <span>Design Decisions</span>
          <ol>{node.decisions?.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article className="blueprint-panel">
          <span>System States</span>
          <div className="workspace-token-list">{node.systemStates?.map((item) => <em key={item}>{item}</em>)}</div>
        </article>
        <article className="blueprint-panel">
          <span>Reflection</span>
          <p>{node.reflection}</p>
        </article>
      </div>
    </main>
  );
}

function AiWorkflowCanvas({ node }) {
  const steps = [
    ["Input", node.input],
    ["Synthesis", node.synthesis],
    ["Design Draft", node.designDraft],
    ["Human Judgment", node.humanJudgment],
    ["Output", node.output],
  ];
  return (
    <main className="workspace-canvas" data-accent="ai">
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">AI WORKFLOW PIPELINE</p>
        <h1>{node.title}</h1>
        <p>{node.summary}</p>
      </div>
      <div className="pipeline-canvas">
        {steps.map(([label, values], index) => (
          <article className="pipeline-node" key={label} style={{ "--step-index": index }}>
            <span>{label}</span>
            <ul>{values?.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ))}
      </div>
    </main>
  );
}

function DesignSystemCanvas({ node }) {
  return (
    <main className="workspace-canvas" data-accent="system">
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">DESIGN SYSTEM MATRIX</p>
        <h1>{node.title}</h1>
        <p>{node.summary}</p>
      </div>
      <div className="system-matrix">
        {node.matrix?.map((row, index) => (
          <div className={index === 0 ? "is-heading" : ""} key={row.join("-")}>
            {row.map((cell) => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
      <div className="workspace-token-list">
        {node.governance?.map((item) => <em key={item}>{item}</em>)}
      </div>
    </main>
  );
}

function EssayCanvas({ node, notionContent }) {
  return (
    <main className="workspace-canvas workspace-canvas--essay" data-accent="essay">
      <article className="workspace-essay">
        <header>
          <p className="workspace-kicker">ESSAY READING MODE</p>
          <h1>{node.title}</h1>
          <p>{node.excerpt || node.summary}</p>
          <div className="workspace-token-list">
            <em>{node.category}</em>
            {node.created_at && <em>{formatDate(node.created_at)}</em>}
            {node.tags?.map((tag) => <em key={tag}>#{tag}</em>)}
          </div>
        </header>
        {notionContent ? (
          <div className="workspace-essay__body">
            <NotionBlockRenderer content={notionContent} />
          </div>
        ) : (
          <p className="workspace-empty-copy">Open an essay file to read the Notion-sourced body.</p>
        )}
      </article>
    </main>
  );
}

function ResourceCanvas({ workspace, node, resourceQuery }) {
  const query = String(resourceQuery || "").trim().toLowerCase();
  const resources = useMemo(() => {
    if (node.type === "resource") return [node];
    return workspace.resources.filter((resource) => {
      if (!query) return true;
      const values = [
        resource.title,
        resource.description,
        resource.category,
        ...(resource.tags || []),
      ].map((value) => String(value || "").toLowerCase());

      if (query.length <= 2) {
        return values.some((value) =>
          value
            .split(/[^a-z0-9가-힣]+/i)
            .filter(Boolean)
            .includes(query)
        );
      }

      return values.some((value) => value.includes(query));
    });
  }, [node, query, workspace.resources]);

  return (
    <main className="workspace-canvas" data-accent="resource">
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">RESOURCE DIRECTORY</p>
        <h1>{node.type === "resource" ? node.title : "Public resources for B2B designers"}</h1>
        <p>{node.description || node.summary || "Filter resources through the workspace tree or command bar."}</p>
      </div>
      <div className="resource-console">
        {resources.length > 0 ? (
          resources.map((resource) => {
            const body = (
              <>
                <span>{String(resource.category || "RESOURCE").toUpperCase()}</span>
                <strong>{resource.title}</strong>
                <p>{resource.description}</p>
                <em>{resource.tags?.slice(0, 4).join(" / ")}</em>
              </>
            );
            return String(resource.original_link || "").startsWith("/") ? (
              <Link href={resource.original_link} className="resource-row" key={resource.id}>
                {body}
              </Link>
            ) : (
              <a href={resource.original_link} target="_blank" rel="noreferrer" className="resource-row" key={resource.id}>
                {body}
              </a>
            );
          })
        ) : (
          <p className="workspace-empty-copy">No matching resources. Try the command bar with another filter.</p>
        )}
      </div>
    </main>
  );
}

function AboutCanvas({ node }) {
  return (
    <main className="workspace-canvas" data-accent="about">
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">{node.eyebrow}</p>
        <h1>{node.statement}</h1>
        <p>{node.summary}</p>
      </div>
      <div className="profile-dossier">
        <section>
          <span>Working principles</span>
          <ul>{node.principles.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <span>AI stack</span>
          <div className="workspace-token-list">{node.aiStack.map((item) => <em key={item}>{item}</em>)}</div>
        </section>
      </div>
    </main>
  );
}

function ArtifactCanvas({ node }) {
  return (
    <main className="workspace-canvas" data-accent="artifact">
      <div className="workspace-canvas__header">
        <p className="workspace-kicker">ARTIFACT PREVIEW</p>
        <h1>{node.title}</h1>
        <p>{node.summary}</p>
      </div>
      <div className="workspace-file-card workspace-file-card--large">
        <span>{node.path}</span>
        <div className="workspace-token-list">{node.fields?.map((field) => <em key={field}>{field}</em>)}</div>
      </div>
    </main>
  );
}

function WorkspaceCanvas({ workspace, selectedNode, notionContent, resourceQuery, pageError }) {
  if (pageError) {
    return (
      <main className="workspace-canvas">
        <div className="workspace-canvas__header">
          <p className="workspace-kicker">LOAD ERROR</p>
          <h1>Workspace data could not be loaded.</h1>
          <p>{pageError}</p>
        </div>
      </main>
    );
  }

  if (selectedNode.id === "overview") return <OverviewCanvas workspace={workspace} />;
  if (selectedNode.id === "resources") {
    return <ResourceCanvas workspace={workspace} node={selectedNode} resourceQuery={resourceQuery} />;
  }
  if (selectedNode.type === "section") return <SectionCanvas workspace={workspace} selectedNode={selectedNode} />;
  if (selectedNode.type === "case-study") return <CaseCanvas node={selectedNode} />;
  if (selectedNode.type === "ai-workflow") return <AiWorkflowCanvas node={selectedNode} />;
  if (selectedNode.type === "design-system") return <DesignSystemCanvas node={selectedNode} />;
  if (selectedNode.type === "essay") return <EssayCanvas node={selectedNode} notionContent={notionContent} />;
  if (selectedNode.type === "resource") return <ResourceCanvas workspace={workspace} node={selectedNode} resourceQuery={resourceQuery} />;
  if (selectedNode.type === "about") return <AboutCanvas node={selectedNode} />;
  if (selectedNode.type === "artifact") return <ArtifactCanvas node={selectedNode} />;
  return <OverviewCanvas workspace={workspace} />;
}

export default WorkspaceCanvas;
