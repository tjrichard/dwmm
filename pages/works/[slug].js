import React from "react";
import { useRouter } from "next/router";
import Meta from "../../components/meta";
import SkeletonLoader from "../../components/skeletonLoader";
import WorkspaceShell from "../../components/workspace/WorkspaceShell";
import { getPublishedPosts, getPostBySlug, getPostContent } from "../../lib/notion";
import { normalizeNotionPosts } from "../../lib/workspace";
import { getPublicResources } from "../../lib/publicResources";

export default function WorkDetailPage({ essays, resources, post, content, error }) {
  const router = useRouter();

  if (router.isFallback) {
    return <SkeletonLoader variant="blogPost" />;
  }

  if (error) {
    return (
      <WorkspaceShell
        essays={essays || []}
        resources={resources || []}
        selectedEssaySlug={router.query.slug}
        pageError={error}
      />
    );
  }

  return (
    <>
      <Meta title={post?.title || "DWMM Essay"} description={post?.excerpt || post?.summary || ""} image={post?.thumbnail} />
      <WorkspaceShell
        essays={essays || []}
        resources={resources || []}
        selectedEssaySlug={post?.slug || router.query.slug}
        notionContent={content}
      />
    </>
  );
}

export async function getStaticPaths() {
  try {
    const posts = await getPublishedPosts();
    const essays = normalizeNotionPosts(posts);
    return {
      paths: essays.map((essay) => ({ params: { slug: essay.slug } })),
      fallback: "blocking",
    };
  } catch (error) {
    return {
      paths: [],
      fallback: "blocking",
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const [allPosts, postData, resourceResult] = await Promise.all([
      getPublishedPosts(),
      getPostBySlug(params.slug),
      getPublicResources().catch(() => []),
    ]);

    if (!postData) {
      return { notFound: true };
    }

    const essays = normalizeNotionPosts(allPosts);
    const [post] = normalizeNotionPosts([postData]);
    const content = await getPostContent(postData.id);

    return {
      props: {
        essays,
        resources: resourceResult,
        post,
        content,
        error: null,
      },
      revalidate: 60,
    };
  } catch (error) {
    return {
      props: {
        essays: [],
        resources: [],
        post: null,
        content: null,
        error: error.message || "Failed to fetch post data.",
      },
      revalidate: 60,
    };
  }
}
