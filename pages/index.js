import React from "react";
import { useRouter } from "next/router";
import Meta from "../components/meta.js";
import WorkspaceShell from "../components/workspace/WorkspaceShell.js";
import { getPublicResources } from "../lib/publicResources.js";
import { getPublishedPosts } from "../lib/notion.js";
import { normalizeNotionPosts } from "../lib/workspace.js";

export async function getStaticProps() {
  const [resourceResult, notionResult] = await Promise.allSettled([
    getPublicResources(),
    getPublishedPosts(),
  ]);
  const resources = resourceResult.status === "fulfilled" ? resourceResult.value : [];
  const essays = notionResult.status === "fulfilled" ? normalizeNotionPosts(notionResult.value) : [];

  return {
    props: {
      title: "DWMM | Product Design Workspace",
      description: "A public workspace for B2B SaaS product design, AI workflows, essays, and resources.",
      essays,
      resources,
      error: null,
    },
    revalidate: 3600,
  };
}

export default function WorkspaceHome({ title, description, essays, resources, error }) {
  const router = useRouter();
  const selectedNodeId = String(router.query.node || "overview");
  const resourceQuery = String(router.query.resourceQuery || "");

  return (
    <>
      <Meta title={title} description={description} />
      <WorkspaceShell
        essays={essays}
        resources={resources}
        selectedNodeId={selectedNodeId}
        resourceQuery={resourceQuery}
        pageError={error}
      />
    </>
  );
}
