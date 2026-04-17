import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import WebsiteRequestForm from "../bookmark/WebsiteRequestForm";
import { getNodeRoute } from "../../lib/workspace";

function FloatingCommandBar({
  workspace,
  selectedNode,
  theme,
  onThemeChange,
  isContextCollapsed = false,
  onToggleContext = () => {},
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);

  const shortcuts = useMemo(
    () => [
      { label: "Go to case studies", hint: "Open the case-study folder", command: "go case studies", keys: "G C" },
      { label: "Go to bookmarks", hint: "Open public resource bookmarks", command: "go bookmarks", keys: "G B" },
      { label: "Ask current file", hint: "Ask against the selected node", command: "ask current file", keys: "A" },
      {
        label: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
        hint: "Toggle blueprint IDE theme",
        command: "toggle theme",
        keys: "T",
      },
      { label: "Filter AI resources", hint: "Show AI-related bookmarks", command: "filter resources ai", keys: "F A" },
      { label: "Suggest resource", hint: "Submit a public resource URL", command: "suggest https://...", keys: "S" },
    ],
    [theme]
  );

  const visibleNodes = useMemo(() => {
    const query = command.toLowerCase().trim();
    return workspace.nodes
      .filter((node) => {
        if (!query) return true;
        return `${node.title} ${node.path} ${node.type}`.toLowerCase().includes(query);
      })
      .slice(0, 8);
  }, [command, workspace.nodes]);

  useEffect(() => {
    const handleKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        setSuggestOpen(false);
      }
    };
    const handleExternal = () => setOpen(true);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("workspace:command", handleExternal);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("workspace:command", handleExternal);
    };
  }, []);

  function resetCommand() {
    setOpen(false);
    setCommand("");
  }

  function navigate(route) {
    resetCommand();
    router.push(route);
  }

  function executeCommand(rawCommand = command) {
    const value = rawCommand.trim();
    const lower = value.toLowerCase();
    if (!value) return;

    if (lower === "theme dark" || lower === "theme light" || lower === "toggle theme" || lower === "theme toggle") {
      onThemeChange(lower.endsWith("dark") ? "dark" : lower.endsWith("light") ? "light" : theme === "dark" ? "light" : "dark");
      resetCommand();
      return;
    }

    if (lower.startsWith("go ") || lower === "bookmarks" || lower === "bookmark") {
      const target = lower.startsWith("go ") ? lower.replace("go ", "").trim() : lower;
      const routeMap = {
        "case studies": "/?node=case-studies",
        "cases": "/?node=case-studies",
        "ai workflows": "/?node=ai-workflows",
        "ai": "/?node=ai-workflows",
        "design systems": "/?node=design-systems",
        "essays": "/works",
        "resources": "/?node=resources",
        "bookmarks": "/?node=resources",
        "bookmark": "/?node=resources",
        "about": "/?node=about-ryan",
      };
      navigate(routeMap[target] || "/");
      return;
    }

    if (lower.startsWith("filter resources")) {
      const query = value.replace(/filter resources/i, "").trim();
      navigate(`/?node=resources&resourceQuery=${encodeURIComponent(query)}`);
      return;
    }

    if (lower.startsWith("ask")) {
      const question =
        value.replace(/^ask\s*/i, "").trim() ||
        `Explain ${selectedNode.title} in the context of Ryan's B2B SaaS product design work.`;
      window.dispatchEvent(new CustomEvent("workspace:ask", { detail: { question } }));
      resetCommand();
      return;
    }

    if (lower.startsWith("suggest")) {
      const possibleUrl = value.replace(/^suggest\s*/i, "").trim();
      setSuggestOpen(true);
      setOpen(false);
      setCommand(possibleUrl);
      return;
    }

    window.dispatchEvent(new CustomEvent("workspace:ask", { detail: { question: value } }));
    resetCommand();
  }

  return (
    <>
      <div className="workspace-status-command" role="toolbar" aria-label="Workspace status and command bar">
        <button type="button" onClick={() => setOpen(true)} className="workspace-status-command__path">
          <span>main</span>
          <strong>{selectedNode.path || getNodeRoute(selectedNode)}</strong>
        </button>
        <button type="button" onClick={() => setOpen(true)}>
          type:{selectedNode.type}
        </button>
        <button type="button" onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}>
          theme:{theme}
        </button>
        <button type="button" onClick={onToggleContext}>
          context:{isContextCollapsed ? "closed" : "open"}
        </button>
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("workspace:ask", { detail: { question: "" } }))}>
          ask archive
        </button>
        <button type="button" onClick={() => setOpen(true)}>
          Cmd K
        </button>
      </div>

      {open && (
        <div className="command-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="command-palette" onClick={(event) => event.stopPropagation()}>
            <div className="command-palette__header">
              <span>Command Menu</span>
              <button type="button" onClick={() => setOpen(false)}>Esc</button>
            </div>
            <form
              className="command-palette__search"
              onSubmit={(event) => {
                event.preventDefault();
                executeCommand();
              }}
            >
              <span>⌘K</span>
              <input
                id="workspace-command"
                autoFocus
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Search or type a command..."
              />
            </form>
            <div className="command-palette__section">
              <span>Suggestions</span>
            </div>
            <div className="command-palette__shortcuts">
              {shortcuts.map((item) => (
                <button type="button" className="command-action" key={item.command} onClick={() => executeCommand(item.command)}>
                  <strong>{item.label}</strong>
                  <em>{item.hint}</em>
                  <kbd>{item.keys}</kbd>
                </button>
              ))}
            </div>
            <div className="command-palette__section">
              <span>Workspace</span>
            </div>
            <div className="command-palette__files">
              {visibleNodes.map((node) => (
                <button type="button" className="command-action" key={node.id} onClick={() => navigate(getNodeRoute(node))}>
                  <strong>{node.title}</strong>
                  <em>{node.path}</em>
                  <kbd>{node.type}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {suggestOpen && (
        <div className="command-overlay" role="dialog" aria-modal="true" onClick={() => setSuggestOpen(false)}>
          <div className="command-palette command-palette--suggest" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="command-palette__close" onClick={() => setSuggestOpen(false)}>
              Close
            </button>
            <WebsiteRequestForm onComplete={() => setSuggestOpen(false)} fromSuggest />
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingCommandBar;
