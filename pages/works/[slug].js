import React from "react";
import { useRouter } from "next/router";
import Meta from "../../components/meta";
import SkeletonLoader from "../../components/skeletonLoader";
import NotionBlockRenderer from "../../components/NotionBlockRenderer";
import { FigmaDetailLayout } from "../../components/figma/FigmaResourceLayout";
import { getPublishedPosts, getPostBySlug, getPostContent } from "../../lib/notion";
import { normalizeNotionPosts } from "../../lib/workspace";
import { getPublicResources } from "../../lib/publicResources";
import { generatedEssays } from "../../data/workspace/generatedEssays";

export default function WorkDetailPage({ relatedResourceCount = 0, post, content, error }) {
  const router = useRouter();

  if (router.isFallback) {
    return <SkeletonLoader variant="blogPost" />;
  }

  if (error) {
    return (
      <FigmaDetailLayout
        post={{ title: "Essay unavailable", summary: error, category: "Error" }}
        metaRows={[["Slug", router.query.slug || "unknown"]]}
      >
        <p>{error}</p>
      </FigmaDetailLayout>
    );
  }

  return (
    <>
      <Meta title={post?.title || "DWMM Essay"} description={post?.excerpt || post?.summary || ""} image={post?.thumbnail} />
      <FigmaDetailLayout
        post={post}
        metaRows={[
          ["Source", postDataSource(post)],
          ["Slug", post?.slug || router.query.slug],
          ["Related resources", String(relatedResourceCount)],
        ]}
      >
        {content ? (
          <NotionBlockRenderer content={content} />
        ) : Array.isArray(post?.body) ? (
          post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        ) : (
          <p>No body content is available.</p>
        )}
      </FigmaDetailLayout>
    </>
  );
}

function postDataSource(post) {
  return String(post?.id || "").startsWith("essay-") && generatedEssays.some((essay) => essay.id === post.id)
    ? "Generated workspace note"
    : "Notion CMS";
}

export async function getStaticPaths() {
  try {
    const posts = await getPublishedPosts();
    const essays = normalizeNotionPosts(posts);
    const pathsBySlug = new Set([...essays, ...generatedEssays].map((essay) => essay.slug).filter(Boolean));
    return {
      paths: Array.from(pathsBySlug).map((slug) => ({ params: { slug } })),
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
    const [postDataResult, resourceResult] = await Promise.allSettled([
      getPostBySlug(params.slug),
      getPublicResources({ limit: 12 }),
    ]);
    const postData = postDataResult.status === "fulfilled" ? postDataResult.value : null;
    const relatedResourceCount = resourceResult.status === "fulfilled" ? resourceResult.value.length : 0;
    const generatedPost = generatedEssays.find((essay) => essay.slug === params.slug);

    if (!postData && !generatedPost) {
      return { notFound: true };
    }

    const [notionPost] = postData ? normalizeNotionPosts([postData]) : [];
    const post = notionPost || generatedPost;
    const content = postData ? await getPostContent(postData.id) : null;

    return {
      props: {
        relatedResourceCount,
        post,
        content,
        error: null,
      },
      revalidate: 60,
    };
  } catch (error) {
    return {
      props: {
        relatedResourceCount: 0,
        post: null,
        content: null,
        error: error.message || "Failed to fetch post data.",
      },
      revalidate: 60,
    };
  }
}
