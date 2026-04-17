import React, { useEffect, useMemo, useState } from "react";
import { buildWorkspace, findSelectedNode } from "../../lib/workspace";
import WorkspaceTree from "./WorkspaceTree";
import WorkspaceCanvas from "./WorkspaceCanvas";
import WorkspaceInspector from "./WorkspaceInspector";
import FloatingCommandBar from "./FloatingCommandBar";

function WorkspaceShell({
  essays = [],
  resources = [],
  selectedNodeId = "overview",
  selectedEssaySlug = null,
  notionContent = null,
  resourceQuery = "",
  pageError = null,
}) {
  const workspace = useMemo(() => buildWorkspace({ essays, resources }), [essays, resources]);
  const selectedNode = useMemo(
    () => findSelectedNode({ workspace, selectedNodeId, selectedEssaySlug }),
    [workspace, selectedNodeId, selectedEssaySlug]
  );
  const [theme, setTheme] = useState("light");
  const [askSeed, setAskSeed] = useState({ id: 0, question: "" });
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("dwmm-workspace-theme");
    const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.workspaceTheme = theme;
    window.localStorage.setItem("dwmm-workspace-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleAsk = (event) => {
      setAskSeed({ id: Date.now(), question: event.detail?.question || "" });
      setContextCollapsed(false);
      setInspectorOpen(true);
    };
    window.addEventListener("workspace:ask", handleAsk);
    return () => window.removeEventListener("workspace:ask", handleAsk);
  }, []);

  useEffect(() => {
    setInspectorOpen(false);
  }, [selectedNode?.id]);

  return (
    <div className="workspace-shell" data-mode={theme}>
      <div className={`workspace-layout${contextCollapsed ? " is-context-collapsed" : ""}`}>
        <WorkspaceTree workspace={workspace} selectedNode={selectedNode} />
        <WorkspaceCanvas
          workspace={workspace}
          selectedNode={selectedNode}
          notionContent={notionContent}
          resourceQuery={resourceQuery}
          pageError={pageError}
        />
        <WorkspaceInspector
          workspace={workspace}
          selectedNode={selectedNode}
          askSeed={askSeed}
          isInspectorOpen={inspectorOpen}
          onToggleInspector={() => setInspectorOpen((open) => !open)}
          isContextCollapsed={contextCollapsed}
          onToggleContext={() => setContextCollapsed((collapsed) => !collapsed)}
        />
        {contextCollapsed && (
          <button
            type="button"
            className="workspace-context-restore"
            onClick={() => setContextCollapsed(false)}
          >
            Open context
          </button>
        )}
      </div>

      <FloatingCommandBar
        workspace={workspace}
        selectedNode={selectedNode}
        theme={theme}
        onThemeChange={setTheme}
        isContextCollapsed={contextCollapsed}
        onToggleContext={() => setContextCollapsed((collapsed) => !collapsed)}
      />
    </div>
  );
}

export default WorkspaceShell;
