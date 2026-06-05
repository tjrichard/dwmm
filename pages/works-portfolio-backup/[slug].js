import React from "react";
import Meta from "../../components/meta";
import { FigmaDetailLayout } from "../../components/figma/FigmaResourceLayout";
import { generatedEssays } from "../../data/workspace/generatedEssays";

export default function PortfolioBackupDetail({ post }) {
  return (
    <>
      <Meta title={post.title} description={post.summary || post.excerpt || post.title} image={post.thumbnail} />
      <FigmaDetailLayout
        post={post}
        metaRows={[
          ["Source", "Backup compatibility route"],
          ["Canonical", `/works/${post.slug}`],
          ["Read time", post.readTime || "5 min"],
        ]}
      >
        {post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </FigmaDetailLayout>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: generatedEssays.map((essay) => ({ params: { slug: essay.slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const post = generatedEssays.find((essay) => essay.slug === params.slug) || generatedEssays[0];
  return {
    props: { post },
    revalidate: 3600,
  };
}
