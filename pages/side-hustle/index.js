import React, { useMemo, useState } from "react";
import Meta from "../../components/meta";
import { FigmaResourceLayout } from "../../components/figma/FigmaResourceLayout";

const sideProjects = [
  {
    id: "side-emoji-translator",
    type: "resource",
    kind: "Prototype",
    title: "Emoji translator",
    summary:
      "A tiny utility prototype for translating plain intent into emoji shortnames without adding an account layer.",
    description:
      "A tiny utility prototype for translating plain intent into emoji shortnames without adding an account layer.",
    category: "Prototype",
    tags: ["utility", "microtool", "play"],
    href: "/side-hustle",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "side-workflow-snippets",
    type: "resource",
    kind: "Note",
    title: "Workflow snippets",
    summary:
      "Small experiments for naming states, ownership, and handoff patterns before they become product-system rules.",
    description:
      "Small experiments for naming states, ownership, and handoff patterns before they become product-system rules.",
    category: "Note",
    tags: ["workflow", "states", "handoff"],
    href: "/works/workflow-ui-operating-system",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  },
];

const emojiDictionary = {
  rocket: "rocket",
  launch: "rocket",
  idea: "bulb",
  light: "bulb",
  design: "art",
  system: "gear",
  workflow: "twisted_rightwards_arrows",
  check: "white_check_mark",
  done: "white_check_mark",
  warning: "warning",
  blocked: "no_entry",
  search: "mag",
};

export async function getStaticProps() {
  return {
    props: {
      title: "DWMM | Side Hustle",
      description: "Small public prototypes and working notes from the DWMM workspace.",
    },
  };
}

export default function SideHustle({ title, description }) {
  const [input, setInput] = useState("");
  const results = useMemo(() => {
    const query = input.trim().toLowerCase();
    if (!query) return [];
    return Object.entries(emojiDictionary)
      .filter(([key, value]) => key.includes(query) || value.includes(query))
      .slice(0, 6)
      .map(([, value]) => `:${value}:`);
  }, [input]);

  return (
    <>
      <Meta title={title} description={description} />
      <FigmaResourceLayout
        titleLines={["Small,", "Useful Things"]}
        eyebrow="Side hustle"
        description="Small prototypes, utilities, and product-design notes that are useful enough to keep public."
        items={sideProjects}
        cardHref={(item) => item.href}
        realtimeRoom="dwmm-side-hustle"
      >
        <section className="figma-side-tool" aria-label="Emoji translator">
          <div>
            <p className="figma-eyebrow">Prototype</p>
            <h2>Emoji translator</h2>
            <p>
              Type a product-work word and get a shortname-style emoji label. This is now local-first so it stays usable
              even when the public Supabase config is unavailable.
            </p>
          </div>
          <label>
            <span>Input</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="workflow, launch, blocked..."
            />
          </label>
          <div className="figma-side-tool__results">
            {(results.length > 0 ? results : [":sparkles:", ":gear:", ":mag:"]).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </FigmaResourceLayout>
    </>
  );
}
