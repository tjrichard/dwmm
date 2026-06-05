export const generatedEssays = [
  {
    id: "essay-workflow-operating-system",
    type: "essay",
    title: "Workflow UI is an operating system",
    slug: "workflow-ui-operating-system",
    path: "/04_essays/workflow-ui-operating-system.md",
    category: "Product design",
    tags: ["workflow", "B2B SaaS", "systems"],
    thumbnail:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
    summary:
      "A note on designing B2B SaaS screens as shared operating surfaces rather than isolated feature pages.",
    excerpt:
      "B2B products become clearer when the interface exposes ownership, status, and the next responsible action.",
    created_at: "2026-05-30",
    readTime: "5 min",
    body: [
      "A workflow screen is rarely just a page. It is where a team sees what happened, what is blocked, who owns the next move, and which decision is still reversible.",
      "That is why I treat B2B UI as an operating system for work. The design job is not to make every object visually equal. It is to make the state of the work legible enough that different roles can act without asking another team for translation.",
      "The most useful screen often starts with three questions: what changed, who is responsible, and what can safely happen next. Navigation, labels, and empty states should all answer those questions before they decorate the product.",
    ],
    askSummary:
      "This generated essay frames B2B SaaS workflow UI as an operating system for shared work, emphasizing ownership, state, and next action.",
  },
  {
    id: "essay-ai-judgment-boundaries",
    type: "essay",
    title: "AI can draft, but judgment has to stay visible",
    slug: "ai-judgment-boundaries",
    path: "/04_essays/ai-judgment-boundaries.md",
    category: "AI workflow",
    tags: ["AI", "judgment", "research synthesis"],
    thumbnail:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
    summary:
      "A design note on using AI for synthesis and critique without hiding evidence boundaries or product responsibility.",
    excerpt:
      "The useful role of AI in product design is acceleration with traceability, not anonymous certainty.",
    created_at: "2026-05-30",
    readTime: "6 min",
    body: [
      "AI is good at making a first map. It can cluster call notes, draft naming options, and pressure-test flows for missing states. But the product decision still needs a visible owner.",
      "When AI output enters a design workflow, I want the interface or artifact to preserve three boundaries: source evidence, confidence level, and rejected paths. Without those, speed becomes a liability because the team cannot inspect why a recommendation exists.",
      "The best AI-assisted workflow does not ask the model to replace critique. It asks the model to make critique cheaper, broader, and easier to repeat before a human designer commits to a product direction.",
    ],
    askSummary:
      "This generated essay explains AI-assisted design as synthesis and critique support with visible evidence boundaries, confidence, and human judgment.",
  },
  {
    id: "essay-permission-copy",
    type: "essay",
    title: "Permission copy is product architecture",
    slug: "permission-copy-product-architecture",
    path: "/04_essays/permission-copy-product-architecture.md",
    category: "Design systems",
    tags: ["permissions", "copy", "system states"],
    thumbnail:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    summary:
      "A short argument for treating permission labels, empty states, and impact previews as part of the product model.",
    excerpt:
      "In admin workflows, copy is not a final polish layer. It is how the product explains authority and consequence.",
    created_at: "2026-05-30",
    readTime: "4 min",
    body: [
      "Permission UI fails when labels only mirror implementation. A checkbox called Manage workspace can be technically accurate and still fail to explain who loses access, what changes immediately, and how to recover.",
      "For admin surfaces, copy is part of the architecture. Role names, impact previews, inherited access labels, and error states are all ways the product makes authority understandable.",
      "A design system for B2B SaaS should therefore include permission language as a governed component family. The contract is not just visual consistency. It is user confidence before a risky action.",
    ],
    askSummary:
      "This generated essay treats permission copy as product architecture for admin confidence, impact previews, inherited access, and governed system states.",
  },
];

export const profileNotes = {
  id: "about-ryan",
  title: "Ryan Kim",
  role: "B2B SaaS Product Designer",
  summary:
    "I turn messy workflows, stakeholder context, and customer signals into structured product experiences.",
  body: [
    "My work sits between product judgment and interface systems. I map roles, ownership, permissions, states, and operational constraints before I treat the screen as a composition problem.",
    "I use AI as a synthesis and critique layer: clustering VOC, generating IA alternatives, checking missing states, and stress-testing copy. The final decision still needs evidence, constraints, and a human owner.",
    "The portfolio is organized like a public workspace because B2B product design is rarely a single polished artifact. It is a trail of decisions, rejected options, state models, and implementation contracts.",
  ],
  details: [
    ["Domain", "B2B SaaS, workflow design, admin systems"],
    ["Practice", "IA, state modeling, design systems, AI-assisted synthesis"],
    ["Collaborators", "PM, engineering, CS, sales, leadership"],
    ["Mode", "Evidence-led, systems-minded, implementation-aware"],
  ],
};
