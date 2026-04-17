import React, { useMemo } from "react";
import Link from "next/link";
import { getNodeAccent, getNodeRoute } from "../../lib/workspace";

function FigmaHandles({ x = 0, y = 0 }) {
  return (
    <span className="figma-handles" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <span className="figma-coordinate">x:{x} y:{y}</span>
    </span>
  );
}

function WorkspaceTree({ workspace, selectedNode }) {
  const resourceGroups = useMemo(() => {
    const groups = new Map();
    workspace.resources.forEach((resource) => {
      const key = String(resource.category || "Resource").toUpperCase();
      if (!groups.has(key)) groups.set(key, 0);
      groups.set(key, groups.get(key) + 1);
    });
    return Array.from(groups.entries()).slice(0, 8);
  }, [workspace.resources]);

  return (
    <aside className="workspace-tree" aria-label="Workspace navigation">
      <Link className="workspace-brand workspace-brand--tree" href="/">
        <img src="/logo.svg" alt="DWMM" />
        <span>DWMM.workspace</span>
      </Link>

      <Link
        href="/"
        className={`workspace-tree__item workspace-tree__item--root ${
          selectedNode.id === "overview" ? "is-active" : ""
        }`}
      >
        <span className="workspace-tree__twisty">◇</span>
        <span>README.workspace</span>
        {selectedNode.id === "overview" && <FigmaHandles x={16} y={44} />}
      </Link>

      {workspace.tree.map((group, groupIndex) => {
        const groupNode = workspace.nodesById[group.id];
        const activeGroup =
          selectedNode.id === group.id ||
          group.children.includes(selectedNode.id) ||
          (group.id === "resources" && selectedNode.type === "resource");
        return (
          <section className={`workspace-tree__group ${activeGroup ? "is-open" : ""}`} key={group.id}>
            <Link
              href={getNodeRoute(groupNode)}
              className={`workspace-tree__folder ${activeGroup ? "is-active" : ""}`}
              data-accent={getNodeAccent(groupNode?.sectionType || groupNode?.type)}
            >
              <span className="workspace-tree__twisty">{activeGroup ? "▾" : "▸"}</span>
              <span>{group.label}</span>
              <em>{group.children.length}</em>
              {selectedNode.id === group.id && <FigmaHandles x={16} y={92 + groupIndex * 54} />}
            </Link>

            <div className="workspace-tree__children">
              {group.children.slice(0, group.id === "resources" ? 10 : 20).map((childId, childIndex) => {
                const child = workspace.nodesById[childId];
                if (!child) return null;
                const isActive = selectedNode.id === child.id;
                return (
                  <Link
                    href={getNodeRoute(child)}
                    key={child.id}
                    className={`workspace-tree__item ${isActive ? "is-active" : ""}`}
                    data-accent={getNodeAccent(child.type)}
                  >
                    <span className="workspace-tree__file">●</span>
                    <span>{child.title}</span>
                    {isActive && <FigmaHandles x={36} y={120 + groupIndex * 54 + childIndex * 32} />}
                  </Link>
                );
              })}

              {group.id === "resources" && resourceGroups.length > 0 && (
                <div className="workspace-tree__resource-tags">
                  {resourceGroups.map(([category, count]) => (
                    <Link href={`/?node=resources&resourceQuery=${encodeURIComponent(category)}`} key={category}>
                      {category}
                      <span>{count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </aside>
  );
}

export default WorkspaceTree;
