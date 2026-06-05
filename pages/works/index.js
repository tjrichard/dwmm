import React from "react";
import Meta from "../../components/meta.js";
import { FigmaResourceLayout } from "../../components/figma/FigmaResourceLayout.js";
import { getPublishedPosts } from "../../lib/notion.js";
import { normalizeNotionPosts } from "../../lib/workspace.js";
import { generatedEssays } from "../../data/workspace/generatedEssays.js";

export async function getStaticProps() {
  const [notionResult] = await Promise.allSettled([getPublishedPosts()]);
  const notionEssays = notionResult.status === "fulfilled" ? normalizeNotionPosts(notionResult.value) : [];
  const essays = notionEssays.length > 0 ? notionEssays : generatedEssays;

  return {
    props: {
      title: "DWMM | Essays",
      description: "Notion-sourced essays inside Ryan's product design workspace.",
      essays,
      error: null,
    },
    revalidate: 60,
  };
}

export default function Works({ title, description, essays, error }) {
  return (
    <>
      <Meta title={title} description={description} />
      <FigmaResourceLayout
        titleLines={["Things,", "Worth Sharing"]}
        eyebrow="Notion CMS"
        description="Essays and working notes about B2B SaaS product design, workflow judgment, and AI-assisted design practice."
        items={essays}
        cardHref={(essay) => `/works/${essay.slug}`}
        realtimeRoom="dwmm-works"
        emptyState={
          <p className="figma-empty">
            {error || "No published essays are available from Notion yet."}
          </p>
        }
      />
    </>
  );
}
