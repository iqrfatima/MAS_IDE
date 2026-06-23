import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
} from "lucide-react";

interface TreeNodeProps {
  name: string;
  node: any;
  path?: string;
  onFileClick?: (path: string) => void;
}

export default function TreeNode({
  name,
  node,
  path = "",
  onFileClick,
}: TreeNodeProps) {
  const [open, setOpen] = useState(false);

  const isFolder = node !== null;

  const currentPath = path ? `${path}/${name}` : name;

  return (
    <div>
      <div
        className="
          flex items-center gap-1
          px-2 py-1
          text-sm
          text-zinc-300
          hover:bg-zinc-800
          rounded
          cursor-pointer
          select-none
        "
        onClick={() => {
          if (isFolder) {
            setOpen(!open);
          } else {
            onFileClick?.(currentPath);
          }
        }}
      >
        {isFolder ? (
          <>
            {open ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}

            {open ? (
              <FolderOpen size={14} />
            ) : (
              <Folder size={14} />
            )}
          </>
        ) : (
          <>
            <span className="w-[14px]" />
            <File size={14} />
          </>
        )}

        <span className="truncate">{name}</span>
      </div>

      {open && isFolder && (
        <div className="ml-4 border-l border-zinc-800">
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