export const workspaceProfile = {
  id: "about-ryan",
  type: "about",
  title: "Ryan Kim",
  eyebrow: "B2B SaaS Product Designer",
  path: "/06_about/profile.md",
  summary:
    "A product design workspace for complex B2B SaaS workflows, AI-assisted synthesis, and system-level product judgment.",
  statement:
    "I turn messy workflows, stakeholder context, and customer signals into structured product experiences.",
  principles: [
    "Map roles, permissions, states, and ownership before drawing the first screen.",
    "Use AI for synthesis, critique, and speed, while keeping product judgment human.",
    "Treat B2B UI as an operating system for teams, not a sequence of isolated pages.",
    "Make implementation constraints visible early so design decisions survive handoff.",
  ],
  aiStack: [
    "Research synthesis",
    "VOC clustering",
    "Prompted IA alternatives",
    "Prototype critique",
    "Copy and empty-state QA",
    "Design-to-code collaboration",
  ],
  inspector: {
    role: "Product designer",
    domains: ["B2B SaaS", "Workflow design", "Design systems", "AI-assisted product work"],
    collaboration: ["PM", "Engineering", "CS", "Sales", "Leadership"],
  },
  askSummary:
    "Ryan is positioned as a B2B SaaS product designer focused on workflow architecture, design systems, AI-assisted synthesis, and product judgment.",
};

export const caseStudies = [
  {
    id: "case-enterprise-onboarding",
    type: "case-study",
    title: "Enterprise onboarding architecture",
    path: "/01_case-studies/enterprise-onboarding.case",
    summary:
      "A case-study draft for structuring onboarding across admins, operators, and invited teammates in a B2B SaaS product.",
    status: "Draft content model",
    role: "Product design lead for workflow framing, IA, state design, and product narrative.",
    problem:
      "Enterprise onboarding breaks when setup, permission, billing, and team education are treated as separate surfaces.",
    constraints: [
      "Multiple user roles enter the product with different jobs.",
      "Setup steps depend on business context, integrations, and permissions.",
      "CS needs visibility into progress without creating another manual workflow.",
    ],
    stakeholders: ["Admin", "Operator", "Invited teammate", "CS", "PM", "Engineering"],
    signals: ["Support tickets", "Sales handoff notes", "Activation drop-off points", "Customer onboarding calls"],
    decisions: [
      "Separate account setup from teammate activation.",
      "Expose progress as system state instead of checklist-only UI.",
      "Make skipped setup steps recoverable from the workspace.",
    ],
    systemStates: ["Not started", "Blocked", "Ready for review", "Partially configured", "Launched"],
    outcome:
      "Outcome metrics are not yet verified in this public draft, so the UI should focus on design rationale and decision quality.",
    reflection:
      "The key product move is making onboarding observable to the team, not merely shorter for one user.",
    askSummary:
      "This case study is about enterprise onboarding architecture for B2B SaaS. It emphasizes roles, permissions, setup states, CS visibility, and workflow observability. No verified metrics are provided.",
  },
  {
    id: "case-permission-model",
    type: "case-study",
    title: "Permission model and admin workflow",
    path: "/01_case-studies/permission-model.case",
    summary:
      "A system-level exploration of permission UI, role governance, and admin confidence in B2B SaaS.",
    status: "Draft content model",
    role: "Product designer mapping roles, edge cases, copy, and implementation states.",
    problem:
      "Permission screens often fail because they show capabilities without explaining ownership, risk, or reversibility.",
    constraints: [
      "Permission changes can affect revenue-critical workflows.",
      "Admins need confidence before applying broad changes.",
      "Engineering needs a stable model that can grow with product surface area.",
    ],
    stakeholders: ["Workspace owner", "Admin", "Member", "Security reviewer", "Engineering"],
    signals: ["Admin questions", "Permission-related support cases", "Internal QA edge cases"],
    decisions: [
      "Group permissions by job area, not internal feature names.",
      "Show impact preview before saving sensitive changes.",
      "Use empty/error/loading states as part of the permission contract.",
    ],
    systemStates: ["Default role", "Custom role", "Unsaved changes", "Conflict", "Inherited access"],
    outcome:
      "Public draft omits unverifiable outcomes and highlights the design system implications instead.",
    reflection:
      "Permission design is a trust interface. The UI must clarify consequences before it optimizes speed.",
    askSummary:
      "This case study is about B2B SaaS permission modeling. It focuses on admin trust, role grouping, previewing impact, governance, and states. It does not include verified performance metrics.",
  },
  {
    id: "case-si-request-triage",
    type: "case-study",
    title: "SI request triage for product scalability",
    path: "/01_case-studies/si-request-triage.case",
    summary:
      "A framework for handling customer-specific SI requests without letting the product lose coherence.",
    status: "Draft content model",
    role: "Product designer translating customer requests into reusable product patterns.",
    problem:
      "B2B SaaS teams often receive one-off SI requests that solve one deal but create long-term product debt.",
    constraints: [
      "Enterprise customers ask for context-specific workflows.",
      "Sales urgency can exceed product validation speed.",
      "Design must identify reusable patterns without dismissing real customer pain.",
    ],
    stakeholders: ["Customer", "Sales", "CS", "PM", "Product design", "Engineering"],
    signals: ["Customer requests", "Sales notes", "Existing workflow patterns", "Support frequency"],
    decisions: [
      "Tag requests by underlying job, not requested UI.",
      "Separate productizable patterns from implementation exceptions.",
      "Document tradeoffs in a decision log visible to PM and engineering.",
    ],
    systemStates: ["Request intake", "Pattern matched", "Needs discovery", "Exception accepted", "Rejected"],
    outcome:
      "The public version should present this as a decision framework unless verified project outcomes are added.",
    reflection:
      "The design opportunity is not saying yes or no faster. It is making product judgment inspectable.",
    askSummary:
      "This case study draft covers SI request triage in B2B SaaS. It focuses on product scalability, reusable patterns, customer-specific requests, and visible decision logs.",
  },
];

export const aiWorkflows = [
  {
    id: "ai-voc-synthesis",
    type: "ai-workflow",
    title: "VOC to opportunity map",
    path: "/02_ai-workflows/voc-to-opportunity.pipeline",
    summary:
      "An AI-assisted workflow for turning customer calls, support tickets, and sales notes into product opportunity maps.",
    input: ["Customer call notes", "Support tickets", "Sales handoff notes", "Existing product taxonomy"],
    synthesis: ["Cluster recurring jobs", "Extract friction patterns", "Separate symptoms from root causes"],
    designDraft: ["IA alternatives", "Problem statements", "Research questions", "Opportunity map"],
    humanJudgment: [
      "Reject clusters that only mirror loud customer language.",
      "Check whether insights map to product strategy.",
      "Confirm evidence before shaping roadmap recommendations.",
    ],
    output: ["Opportunity map", "Research brief", "Design hypotheses", "Related case-study links"],
    askSummary:
      "This AI workflow uses AI for VOC clustering and synthesis, then relies on human judgment to validate evidence and product relevance.",
  },
  {
    id: "ai-prototype-critique",
    type: "ai-workflow",
    title: "Prototype critique loop",
    path: "/02_ai-workflows/prototype-critique.pipeline",
    summary:
      "A critique workflow that uses AI to pressure-test flows, copy, missing states, and role-specific edge cases before design review.",
    input: ["Prototype screens", "User role definitions", "Acceptance criteria", "Known edge cases"],
    synthesis: ["Find missing states", "Check copy clarity", "List role conflicts", "Surface risky assumptions"],
    designDraft: ["Revision checklist", "Alternative microcopy", "State matrix", "Review agenda"],
    humanJudgment: [
      "Keep AI critique as a second reviewer, not a final authority.",
      "Prioritize issues by product risk and implementation cost.",
      "Document rejected suggestions with rationale.",
    ],
    output: ["Design QA checklist", "State coverage map", "Review notes", "Handoff-ready risks"],
    askSummary:
      "This workflow uses AI as a prototype reviewer for missing states, role conflicts, copy clarity, and risk surfacing.",
  },
  {
    id: "ai-prompt-to-ia",
    type: "ai-workflow",
    title: "Prompt to IA alternatives",
    path: "/02_ai-workflows/prompt-to-ia.pipeline",
    summary:
      "A structured prompt workflow for generating multiple IA directions, then narrowing them with B2B product constraints.",
    input: ["Problem statement", "User roles", "Feature inventory", "Constraint list"],
    synthesis: ["Generate IA variants", "Label tradeoffs", "Compare mental models", "Identify naming risks"],
    designDraft: ["Navigation candidates", "Entity hierarchy", "Content model", "Open questions"],
    humanJudgment: [
      "Do not accept IA that optimizes only for elegance.",
      "Test against operational workflows and admin responsibilities.",
      "Prefer learnable structure over clever naming.",
    ],
    output: ["IA comparison", "Recommendation memo", "Prototype plan", "Validation checklist"],
    askSummary:
      "This AI workflow generates IA alternatives, compares tradeoffs, and uses B2B constraints to select a recommended structure.",
  },
];

export const designSystems = [
  {
    id: "system-state-matrix",
    type: "design-system",
    title: "State matrix for B2B UI",
    path: "/03_design-systems/state-matrix.system",
    summary:
      "A design-system layer for empty, loading, error, permission, and partially configured states.",
    matrix: [
      ["State", "Design responsibility", "Engineering contract"],
      ["Empty", "Explain next useful action", "Return entity counts and intent"],
      ["Loading", "Preserve layout stability", "Expose predictable pending states"],
      ["Error", "Clarify recovery path", "Provide actionable error reason"],
      ["Permission", "Explain missing capability", "Return user role and access reason"],
      ["Partial", "Show remaining setup", "Expose completion status"],
    ],
    governance: ["State naming", "QA checklist", "Component variants", "Documentation examples"],
    askSummary:
      "This design system node covers B2B UI states: empty, loading, error, permission, and partial configuration states with design and engineering responsibilities.",
  },
  {
    id: "system-handoff-protocol",
    type: "design-system",
    title: "Design-to-engineering handoff protocol",
    path: "/03_design-systems/handoff-protocol.system",
    summary:
      "A handoff protocol that makes decisions, constraints, and unresolved risks visible to engineering.",
    matrix: [
      ["Artifact", "Purpose", "Review owner"],
      ["Flow map", "Sequence and branching", "PM + Engineering"],
      ["State table", "Coverage and edge cases", "Design + QA"],
      ["Copy notes", "Error and empty-state language", "Design"],
      ["Decision log", "Tradeoffs and rejected options", "PM"],
      ["Implementation notes", "Constraints and dependencies", "Engineering"],
    ],
    governance: ["Decision ownership", "Versioning", "Review cadence", "Post-release notes"],
    askSummary:
      "This design system node describes design-to-engineering handoff, including flow maps, state tables, copy notes, decision logs, and implementation constraints.",
  },
];

export const artifacts = [
  {
    id: "artifact-decision-log",
    type: "artifact",
    title: "Decision log template",
    path: "/05_artifacts/decision-log.template",
    summary:
      "A lightweight format for documenting product design tradeoffs, rejected options, and confidence level.",
    fields: ["Decision", "Context", "Options", "Selected path", "Rejected paths", "Confidence", "Follow-up"],
    askSummary:
      "The decision log template captures design tradeoffs, rejected options, confidence, and follow-up questions.",
  },
  {
    id: "artifact-prompt-brief",
    type: "artifact",
    title: "AI prompt brief",
    path: "/05_artifacts/ai-prompt-brief.template",
    summary:
      "A prompt setup for asking AI to synthesize research while preserving evidence boundaries.",
    fields: ["Goal", "Inputs", "Non-goals", "Evidence boundaries", "Output format", "Review checklist"],
    askSummary:
      "The AI prompt brief is a reusable artifact for evidence-aware AI synthesis and structured output.",
  },
];

export const curatedResources = [
  {
    id: "resource-service-blueprints",
    type: "resource",
    title: "Service blueprinting for workflow diagnosis",
    path: "/05_resources/service-blueprinting.resource",
    summary:
      "A reference for mapping frontstage actions, backstage work, systems, and operational breaks in complex services.",
    description:
      "Useful when a B2B SaaS problem is really an operating model problem across teams, permissions, and handoffs.",
    original_link: "https://www.nngroup.com/articles/service-blueprints-definition/",
    category: "Research ops",
    tags: ["workflow", "service blueprint", "research", "operations"],
    whyItMatters:
      "It gives product design a structural lens before the team jumps into screens or component choices.",
    askSummary:
      "Service blueprinting is included as a resource for mapping customer actions, backstage operations, system dependencies, and workflow breaks.",
  },
  {
    id: "resource-shape-up",
    type: "resource",
    title: "Shape Up for scoped product bets",
    path: "/05_resources/shape-up.resource",
    summary:
      "A product framing resource for shaping appetite, boundaries, risks, and solution direction before execution.",
    description:
      "Relevant to Ryan's decision-log style because it keeps design work tied to appetite, constraints, and tradeoffs.",
    original_link: "https://basecamp.com/shapeup",
    category: "Product strategy",
    tags: ["scoping", "tradeoffs", "product strategy", "decision log"],
    whyItMatters:
      "It helps convert messy requests into a bounded product bet instead of a loose feature list.",
    askSummary:
      "Shape Up is included as a product strategy reference for scoping product bets, documenting risks, and making tradeoffs explicit.",
  },
  {
    id: "resource-figma-variables",
    type: "resource",
    title: "Figma variables and modes",
    path: "/05_resources/figma-variables.resource",
    summary:
      "A design-system reference for tokens, modes, reusable values, and theme-aware product surfaces.",
    description:
      "Connects to the workspace theme system, syntax accents, state tokens, and design-to-engineering handoff.",
    original_link:
      "https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma",
    category: "Design systems",
    tags: ["figma", "variables", "tokens", "themes"],
    whyItMatters:
      "It supports a design-system vocabulary where decisions can become reusable implementation contracts.",
    askSummary:
      "Figma variables are included as a design-system resource for tokens, modes, reusable values, and theme-aware product surfaces.",
  },
  {
    id: "resource-cursor-themes",
    type: "resource",
    title: "Cursor theme conventions",
    path: "/05_resources/cursor-themes.resource",
    summary:
      "A reference for IDE theme behavior, light/dark switching, and editor-native visual language.",
    description:
      "Used as a visual basis for the blueprint product IDE shell without copying a commercial UI template.",
    original_link: "https://docs.cursor.com/en/configuration/themes",
    category: "Interface systems",
    tags: ["cursor", "theme", "IDE", "syntax"],
    whyItMatters:
      "It keeps the portfolio's terminal feeling grounded in a recognizable interactive product pattern.",
    askSummary:
      "Cursor theme conventions are included as a reference for IDE visual language, theme switching, and editor-native interface behavior.",
  },
  {
    id: "resource-vscode-themes",
    type: "resource",
    title: "VS Code theme system",
    path: "/05_resources/vscode-theme-system.resource",
    summary:
      "A reference for syntax-like color roles, theme selection, and editor interface semantics.",
    description:
      "Useful for keeping blueprint accents sparse: path, selection, node type, metadata, and command state.",
    original_link: "https://code.visualstudio.com/docs/configure/themes",
    category: "Interface systems",
    tags: ["vscode", "theme", "syntax", "accessibility"],
    whyItMatters:
      "It supports a restrained color system where accents carry meaning instead of decoration.",
    askSummary:
      "VS Code themes are included as a reference for syntax-like color roles, selection states, and editor interface semantics.",
  },
  {
    id: "resource-ai-evidence-boundaries",
    type: "resource",
    title: "Evidence boundaries for AI-assisted synthesis",
    path: "/05_resources/ai-evidence-boundaries.resource",
    summary:
      "An internal resource note for keeping AI-generated synthesis separate from verified customer evidence.",
    description:
      "Pairs with the Ask AI assistant and AI workflow pages: AI can cluster and critique, but proof has to stay traceable.",
    original_link: "/?node=ai-voc-synthesis",
    category: "AI workflow",
    tags: ["AI", "research synthesis", "evidence", "judgment"],
    whyItMatters:
      "It makes Ryan's AI-native workflow credible because it shows what AI is not allowed to decide alone.",
    askSummary:
      "Evidence boundaries for AI-assisted synthesis are included as an internal resource note about keeping AI output separate from verified customer proof.",
  },
];

export const workspaceSections = [
  {
    id: "overview",
    type: "overview",
    title: "Workspace Overview",
    path: "/README.workspace",
    summary:
      "A public product design workspace for case studies, AI workflows, design systems, essays, resources, and profile context.",
    askSummary:
      "The workspace overview introduces Ryan's B2B SaaS product design archive and its major sections.",
  },
  {
    id: "case-studies",
    type: "section",
    sectionType: "case-study",
    title: "01_case-studies",
    path: "/01_case-studies",
    summary: "Blueprint case studies for workflow, permissions, onboarding, and product scalability.",
  },
  {
    id: "ai-workflows",
    type: "section",
    sectionType: "ai-workflow",
    title: "02_ai-workflows",
    path: "/02_ai-workflows",
    summary: "AI-assisted design workflows for synthesis, critique, IA, and product judgment.",
  },
  {
    id: "design-systems",
    type: "section",
    sectionType: "design-system",
    title: "03_design-systems",
    path: "/03_design-systems",
    summary: "System-level design notes for states, handoff, governance, and QA.",
  },
  {
    id: "essays",
    type: "section",
    sectionType: "essay",
    title: "04_essays",
    path: "/04_essays",
    summary: "Notion-sourced writing on B2B product design and product thinking.",
  },
  {
    id: "resources",
    type: "section",
    sectionType: "resource",
    title: "05_resources",
    path: "/05_resources",
    summary: "Public resource directory for B2B SaaS product designers.",
  },
  workspaceProfile,
];
