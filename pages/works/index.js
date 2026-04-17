import React from "react";
import Meta from "../../components/meta.js";
import WorkspaceShell from "../../components/workspace/WorkspaceShell.js";
import { getPublishedPosts } from "../../lib/notion.js";
import { normalizeNotionPosts } from "../../lib/workspace.js";
import { getPublicResources } from "../../lib/publicResources.js";

export async function getStaticProps() {
  const [notionResult, resourceResult] = await Promise.allSettled([
    getPublishedPosts(),
    getPublicResources(),
  ]);
  const essays = notionResult.status === "fulfilled" ? normalizeNotionPosts(notionResult.value) : [];
  const resources = resourceResult.status === "fulfilled" ? resourceResult.value : [];

  return {
    props: {
      title: "DWMM | Essays",
      description: "Notion-sourced essays inside Ryan's product design workspace.",
      essays,
      resources,
      error: null,
    },
    revalidate: 60,
  };
}

export default function Works({ title, description, essays, resources, error }) {
  return (
    <>
      <Meta title={title} description={description} />
      <WorkspaceShell essays={essays} resources={resources} selectedNodeId="essays" pageError={error} />
    </>
  );
}
