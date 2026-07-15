'use client';

import { useMemo, useState } from 'react';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const NODE_META_KEYS = new Set(['type', 'value', 'name', 'operator', 'line', 'position']);

function PrimitiveValue({ value }) {
  return <span className="text-emerald-300">{String(value)}</span>;
}

function nodeTitle(node) {
  if (Array.isArray(node)) return 'List';
  if (!isObject(node)) return 'Literal';
  return node.type || 'Node';
}

function nodeMeta(node) {
  if (!isObject(node)) return [];

  const meta = [];
  if (node.name !== undefined) meta.push({ key: 'name', value: String(node.name), tone: 'violet' });
  if (node.value !== undefined) meta.push({ key: 'value', value: String(node.value), tone: 'emerald' });
  if (node.operator !== undefined) meta.push({ key: 'op', value: String(node.operator), tone: 'amber' });
  if (node.line !== undefined && node.position !== undefined) {
    meta.push({ key: 'at', value: `${node.line}:${node.position}`, tone: 'slate' });
  }

  return meta;
}

function getChildren(node, path) {
  if (Array.isArray(node)) {
    return node.map((item, index) => ({
      label: `[${index}]`,
      value: item,
      path: `${path}[${index}]`
    }));
  }

  if (!isObject(node)) {
    return [];
  }

  return Object.entries(node)
    .filter(([key]) => !NODE_META_KEYS.has(key))
    .map(([key, value]) => ({
      label: key,
      value,
      path: `${path}.${key}`
    }));
}

function buildTextTree(node, label = null, prefix = '', isLast = true) {
  const title = nodeTitle(node);
  const labelPrefix = label ? `${label}: ` : '';

  let nodeValuePart = '';
  if (!Array.isArray(node) && !isObject(node)) {
    nodeValuePart = ` = ${String(node)}`;
  } else if (isObject(node)) {
    const meta = [];
    if (node.name !== undefined) meta.push(`name=${String(node.name)}`);
    if (node.value !== undefined) meta.push(`value=${String(node.value)}`);
    if (node.operator !== undefined) meta.push(`op=${String(node.operator)}`);
    if (node.line !== undefined && node.position !== undefined) meta.push(`at=${node.line}:${node.position}`);
    if (meta.length > 0) {
      nodeValuePart = ` (${meta.join(', ')})`;
    }
  }

  const connector = prefix ? (isLast ? '└── ' : '├── ') : '';
  const currentLine = `${prefix}${connector}${labelPrefix}${title}${nodeValuePart}`;

  const children = getChildren(node, 'text');
  if (children.length === 0) {
    return currentLine;
  }

  const childPrefix = prefix ? `${prefix}${isLast ? '    ' : '│   '}` : '';
  const childLines = children.map((child, index) =>
    buildTextTree(child.value, child.label, childPrefix, index === children.length - 1)
  );

  return [currentLine, ...childLines].join('\n');
}

function TreeNode({ label, node, path, collapsed, onToggle, isRoot = false }) {
  const children = useMemo(() => getChildren(node, path), [node, path]);
  const hasChildren = children.length > 0;
  const isCollapsed = collapsed.has(path);
  const isLiteral = !Array.isArray(node) && !isObject(node);

  return (
    <li className={`parse-tree-item ${isRoot ? 'is-root' : ''}`}>
      <div className="parse-tree-row">
        <button
          type="button"
          onClick={() => hasChildren && onToggle(path)}
          className={`parse-tree-caret ${hasChildren ? 'is-clickable' : 'is-spacer'}`}
          aria-label={hasChildren ? (isCollapsed ? 'Expand node' : 'Collapse node') : 'Leaf node'}
        >
          {hasChildren ? (isCollapsed ? '▸' : '▾') : '•'}
        </button>

        {label && <span className="parse-tree-label">{label}</span>}

        <div className="parse-tree-node-card">
          <span className="parse-tree-title">{nodeTitle(node)}</span>

          {isLiteral ? (
            <span className="parse-tree-meta-pill tone-emerald">
              <PrimitiveValue value={node} />
            </span>
          ) : (
            <>
              {nodeMeta(node).map((entry) => (
                <span key={`${path}-${entry.key}-${entry.value}`} className={`parse-tree-meta-pill tone-${entry.tone}`}>
                  {entry.key}={entry.value}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        <ul className="parse-tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.path}
              label={child.label}
              node={child.value}
              path={child.path}
              collapsed={collapsed}
              onToggle={onToggle}
              isRoot={false}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ParseTreeViewer({ parseTree }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const textTree = useMemo(() => buildTextTree(parseTree), [parseTree]);

  const toggleCollapse = (path) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (!parseTree) {
    return (
      <div className="text-gray-500 italic text-sm">
        No parse tree yet. Click "Compile & Run" to see results.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto space-y-4">
      <div className="parse-tree-viewer rounded-lg border border-slate-700/80 bg-slate-950/70 p-4 font-mono text-sm">
        <ul className="parse-tree-root">
          <TreeNode node={parseTree} path="root" collapsed={collapsed} onToggle={toggleCollapse} isRoot />
        </ul>
      </div>

      <div className="rounded-lg border border-slate-700/80 bg-slate-950/70 p-4">
        <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Exact Tree (Text)</h3>
        <pre className="text-xs text-slate-200 font-mono whitespace-pre overflow-x-auto">{textTree}</pre>
      </div>
    </div>
  );
}
