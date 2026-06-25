import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";

interface TreeNodeProps {
  name: string;
  node: any;
  path?: string;
  onFileClick?: (path: string) => void;
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "code";
    case "css":
      return "css";
    case "json":
      return "data_object";
    case "md":
      return "description";
    default:
      return "description";
  }
}

export default function TreeNode({
  name,
  node,
  path = "",
  onFileClick,
}: TreeNodeProps) {
  const [open, setOpen] = useState(false);
  const { activeTab } = useProjectStore();

  const isFolder = node !== null;
  const currentPath = path ? `${path}/${name}` : name;
  const isActive = !isFolder && activeTab && activeTab.endsWith(currentPath);

  return (
    <div>
      <div
        className={`
          flex items-center gap-1.5
          px-3 py-0.5
          text-[12px]
          cursor-pointer
          select-none
          transition-colors duration-150
          ${
            isActive 
              ? "bg-outline/20 text-primary border-l border-primary" 
              : "text-on-surface-variant hover:text-on-surface hover:bg-outline/10"
          }
        `}
        onClick={() => {
          if (isFolder) {
            setOpen(!open);
          } else {
            onFileClick?.(currentPath);
          }
        }}
      >
        {isFolder ? (
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/70">
            {open ? "expand_more" : "chevron_right"}
          </span>
        ) : (
          <span className={`material-symbols-outlined text-[14px] ${isActive ? 'text-primary' : 'text-on-surface-variant/80'}`}>
            {getFileIcon(name)}
          </span>
        )}

        <span className="truncate flex-1 font-mono">{name}</span>
      </div>

      {open && isFolder && (
        <div className="pl-3 border-l border-outline/25 mt-0.5">
          {Object.entries(node).map(([key, value]) => (
            <TreeNode
              key={key}
              name={key}
              node={value}
              path={currentPath}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}