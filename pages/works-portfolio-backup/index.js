import React from "react";
import Meta from "../../components/meta";
import { FigmaResourceLayout } from "../../components/figma/FigmaResourceLayout";
import { generatedEssays } from "../../data/workspace/generatedEssays";

export default function PortfolioBackupIndex() {
  return (
    <>
      <Meta title="DWMM | Portfolio Backup" description="Archived DWMM work links in the current visual system." />
      <FigmaResourceLayout
        titleLines={["Archived,", "Work Notes"]}
        eyebrow="Backup route"
        description="A compatibility route for older portfolio links, rendered with the same current DWMM visual system."
        items={generatedEssays}
        cardHref={(item) => `/works/${item.slug}`}
        realtimeRoom="dwmm-portfolio-backup"
      />
    </>
  );
}
