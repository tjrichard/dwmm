import React from "react";
import Meta from "../components/meta.js";
import { FigmaBottomHeader } from "../components/figma/FigmaResourceLayout.js";
import { RealtimeCursors } from "../components/realtime-cursors.tsx";
import { Badge } from "../components/ui/Badge.js";
import { profileNotes } from "../data/workspace/generatedEssays.js";

const capabilityBadges = [
  "B2B SaaS",
  "Workflow architecture",
  "Design systems",
  "AI-assisted synthesis",
  "Product judgment",
  "Implementation contracts",
];

const aboutSections = [
  {
    title: "How I work",
    body:
      "I start from the shape of work: roles, ownership, constraints, state changes, and handoffs. Interface decisions come after the operating model is clear.",
  },
  {
    title: "What I optimize",
    body:
      "I design for repeated use, decision clarity, and fewer translation gaps between product, engineering, customer-facing teams, and leadership.",
  },
  {
    title: "How AI fits",
    body:
      "I use AI to compress synthesis, explore alternatives, and pressure-test missing states while keeping evidence, confidence, and responsibility visible.",
  },
];

export async function getStaticProps() {
  return {
    props: {
      title: "DWMM | About Ryan Kim",
      description: profileNotes.summary,
    },
    revalidate: 3600,
  };
}

export default function About({ title, description }) {
  return (
    <>
      <Meta title={title} description={description} />
      <div className="about-page">
        <div className="figma-cursors">
          <RealtimeCursors roomName="dwmm-about" username="Visitor" />
        </div>

        <main className="about-page__main">
          <section className="about-hero" aria-label="About Ryan Kim">
            <div className="about-hero__portrait" aria-label="Profile image placeholder" />
            <div className="about-hero__content">
              <p className="figma-eyebrow">{profileNotes.role}</p>
              <h1>{profileNotes.title}</h1>
              <p className="about-hero__summary">{profileNotes.summary}</p>
              <div className="about-hero__badges" aria-label="Capabilities">
                {capabilityBadges.map((badge, index) => (
                  <Badge key={badge} tone={index < 2 ? "dark" : "default"}>
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          <section className="about-body" aria-label="Profile narrative">
            <div className="about-body__essay">
              {profileNotes.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="about-body__grid">
              {aboutSections.map((section) => (
                <article key={section.title}>
                  <span>{section.title}</span>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="about-page__side" aria-label="Profile details">
          <section>
            <span>Working profile</span>
            <strong>about-ryan.profile</strong>
            <p>Public note for B2B product design, AI workflows, and system-level design practice.</p>
          </section>
          <section>
            <span>Labels</span>
            {profileNotes.details.map(([label, value]) => (
              <p key={label}>
                <strong>{label}</strong>
                {value}
              </p>
            ))}
          </section>
        </aside>

        <FigmaBottomHeader showSubmit={false} />
      </div>
    </>
  );
}
