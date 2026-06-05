import React from "react";
import Meta from "../components/meta.js";
import { FigmaProfileLayout } from "../components/figma/FigmaResourceLayout.js";
import { profileNotes } from "../data/workspace/generatedEssays.js";

export async function getStaticProps() {
  return {
    props: {
      title: "DWMM | Ryan Kim",
      description: profileNotes.summary,
      profile: profileNotes,
    },
    revalidate: 3600,
  };
}

export default function Home({ title, description, profile }) {
  return (
    <>
      <Meta title={title} description={description} />
      <FigmaProfileLayout profile={profile} />
    </>
  );
}
