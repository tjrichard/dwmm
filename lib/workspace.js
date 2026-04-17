import {
  aiWorkflows,
  artifacts,
  caseStudies,
  curatedResources,
  designSystems,
  workspaceProfile,
  workspaceSections,
} from "../data/workspace/workspaceContent";

export function normalizeNotionPosts(notionPosts = []) {
  return notionPosts
    .map((post) => {
      const properties = post.properties || {};
      return {
        _id: post.id,
        id: `essay-${properties.slug?.rich_text?.[0]?.plain_text || post.id}`,
        type: "essay",
        title: properties.title?.title?.[0]?.plain_text || "Untitled essay",
        slug: properties.slug?.rich_text?.[0]?.plain_text || null,
        path: `/04_essays/${properties.slug?.rich_text?.[0]?.plain_text || post.id}.md`,
        summary: properties.summary?.rich_text?.[0]?.plain_text || "",
        excerpt: properties.summary?.rich_text?.[0]?.plain_text || "",
        thumbnail: properties.thumbnail?.url || null,
        category: properties.category?.select?.name || "Essay",
        tags: properties.tags?.multi_select?.map((tag) => tag.name) || [],
        created_at: properties.publishedAt?.date?.start || post.created_time,
        askSummary: [
          properties.title?.title?.[0]?.plain_text || "Untitled essay",
          properties.summary?.rich_text?.[0]?.plain_text || "",
          properties.category?.select?.name ? `Category: ${properties.category.select.name}` : "",
          properties.tags?.multi_select?.length
            ? `Tags: ${properties.tags.multi_select.map((tag) => tag.name).join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(". "),
      };
    })
    .filter((essay) => essay.slug);
}

export function normalizeResources(bookmarks = []) {
  return bookmarks.map((bookmark) => ({
    id: `resource-${bookmark.id}`,
    rawId: bookmark.id,
    type: "resource",
    title: bookmark.title || "Untitled resource",
    path: `/05_resources/${bookmark.id}.resource`,
    summary: bookmark.description || "",
    description: bookmark.description || "",
    original_link: bookmark.original_link || bookmark.url || "",
    category: bookmark.category || "Resource",
    tags: Array.isArray(bookmark.tags) ? bookmark.tags : [],
    vote_count: bookmark.vote_count || 0,
    click_count: bookmark.click_count || 0,
    created_at: bookmark.created_at || null,
    askSummary: `${bookmark.title || "Untitled resource"}. ${bookmark.description || ""} Category: ${
      bookmark.category || "Resource"
    }. Tags: ${Array.isArray(bookmark.tags) ? bookmark.tags.join(", ") : ""}.`,
  }));
}

export function buildWorkspace({ essays = [], resources = [] } = {}) {
  const externalResourceIds = new Set(resources.map((node) => node.id));
  const mergedResources = [
    ...curatedResources.filter((node) => !externalResourceIds.has(node.id)),
    ...resources,
  ];
  const staticNodes = [
    ...workspaceSections,
    ...caseStudies,
    ...aiWorkflows,
    ...designSystems,
    ...artifacts,
  ];
  const allNodes = [...staticNodes, ...essays, ...mergedResources];
  const nodesById = allNodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

  const tree = [
    {
      id: "case-studies",
      label: "01_case-studies",
      type: "folder",
      children: caseStudies.map((node) => node.id),
    },
    {
      id: "ai-workflows",
      label: "02_ai-workflows",
      type: "folder",
      children: aiWorkflows.map((node) => node.id),
    },
    {
      id: "design-systems",
      label: "03_design-systems",
      type: "folder",
      children: designSystems.map((node) => node.id),
    },
    {
      id: "essays",
      label: "04_essays",
      type: "folder",
      children: essays.map((node) => node.id),
    },
    {
      id: "resources",
      label: "05_resources",
      type: "folder",
      children: mergedResources.slice(0, 24).map((node) => node.id),
    },
    {
      id: "about-ryan",
      label: "06_about",
      type: "file",
      children: [],
    },
  ];

  return {
    nodes: allNodes,
    nodesById,
    tree,
    profile: workspaceProfile,
    caseStudies,
    aiWorkflows,
    designSystems,
    artifacts,
    essays,
    resources: mergedResources,
  };
}

export function getNodeRoute(node) {
  if (!node) return "/";
  if (node.type === "essay" && node.slug) return `/works/${node.slug}`;
  if (node.id === "essays") return "/works";
  if (node.id === "overview") return "/";
  return `/?node=${encodeURIComponent(node.id)}`;
}

export function getNodeAccent(type) {
  const map = {
    overview: "path",
    section: "path",
    "case-study": "case",
    "ai-workflow": "ai",
    "design-system": "system",
    essay: "essay",
    resource: "resource",
    artifact: "artifact",
    about: "about",
  };
  return map[type] || "path";
}

export function findSelectedNode({ workspace, selectedNodeId, selectedEssaySlug }) {
  if (selectedEssaySlug) {
    return workspace.essays.find((essay) => essay.slug === selectedEssaySlug) || workspace.nodesById.overview;
  }
  return workspace.nodesById[selectedNodeId] || workspace.nodesById.overview;
}
