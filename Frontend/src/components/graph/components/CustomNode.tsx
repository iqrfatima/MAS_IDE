import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import {
  FileCode2,
  Layers,
  Blocks,
  Cpu,
  Play,
  Terminal,
  Code,
  Type,
  FolderGit,
  Package,
  Box,
  Globe,
  Database,
} from 'lucide-react';
import type { Symbol } from '../types';

export function getSymbolTheme(kind: string) {
  let color = '#3b82f6';
  let Icon = Code;

  switch (kind) {
    case 'project':
      color = '#3b82f6';
      Icon = FolderGit;
      break;
    case 'file':
      color = '#0ea5e9';
      Icon = FileCode2;
      break;
    case 'package':
      color = '#ef4444';
      Icon = Package;
      break;
    case 'module':
      color = '#e2e8f0';
      Icon = Box;
      break;
    case 'class':
      color = '#a855f7';
      Icon = Layers;
      break;
    case 'interface':
      color = '#ec4899';
      Icon = Blocks;
      break;
    case 'struct':
      color = '#14b8a6';
      Icon = Cpu;
      break;
    case 'function':
      color = '#10b981';
      Icon = Play;
      break;
    case 'method':
      color = '#f59e0b';
      Icon = Terminal;
      break;
    case 'variable':
      color = '#f43f5e';
      Icon = Code;
      break;
    case 'type_alias':
      color = '#6366f1';
      Icon = Type;
      break;
    case 'api_route':
      color = '#10b981';
      Icon = Globe;
      break;
    case 'data_model':
      color = '#f59e0b';
      Icon = Database;
      break;
  }

  return { color, Icon };
}

type CustomNodeType = Node<{ label: string; symbol: Symbol }, 'customNode'>;
type FileGroupNodeType = Node<{ label: string; path: string; symbol: Symbol }, 'fileGroup'>;
type ClassGroupNodeType = Node<{ label: string; symbol: Symbol }, 'classGroup'>;

export const CustomNode = React.memo(({ data, selected }: NodeProps<CustomNodeType>) => {
  const symbol = data.symbol;
  const { color } = getSymbolTheme(symbol.kind);

  let size = 10;
  if (symbol.kind === 'file') size = 15;
  else if (symbol.kind === 'class' || symbol.kind === 'interface') size = 12;

  return (
    <div
      className={`fluid-node ${selected ? 'selected' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        border: selected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: selected
          ? `0 0 14px ${color}, 0 0 0 2px #ffffff`
          : `0 0 8px ${color}`,
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: 'none',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: 'none',
        }}
      />

      <span
        style={{
          position: 'absolute',
          left: size + 6,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: selected ? '12px' : '10.5px',
          fontWeight: selected ? 700 : 500,
          color: selected ? '#ffffff' : '#e2e8f0',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.8)',
          pointerEvents: 'none',
        }}
      >
        {data.label}
      </span>
    </div>
  );
});

export const FileGroupNode = React.memo(({ data, selected }: NodeProps<FileGroupNodeType>) => {
  return (
    <div className={`file-group-node ${selected ? 'selected' : ''}`} style={{ border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <FileCode2 size={16} color="#0ea5e9" />
        <span style={{ color: 'white' }}>{data.label}</span>
      </div>
    </div>
  );
});

export const ClassGroupNode = React.memo(({ data, selected }: NodeProps<ClassGroupNodeType>) => {
  const symbol = data.symbol;
  const { color, Icon } = getSymbolTheme(symbol.kind);

  return (
    <div className={`class-group-node ${selected ? 'selected' : ''}`} style={{ borderColor: color, border: '1px solid', padding: '4px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.5)' }}>
      <Handle type="target" position={Position.Left} style={{ background: '#64748b' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color }}>
        <Icon size={14} />
        <span>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#64748b' }} />
    </div>
  );
});
