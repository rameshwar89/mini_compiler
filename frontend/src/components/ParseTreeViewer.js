'use client';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const NODE_META_KEYS = new Set(['type', 'value', 'name', 'operator', 'line', 'position']);

function PrimitiveValue({ value }) {
  return <span className="text-green-400">{String(value)}</span>;
}

function NodeHeader({ node }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-blue-400 font-semibold">{node.type || 'Node'}</span>
      {node.name !== undefined && <span className="text-purple-400">name={String(node.name)}</span>}
      {node.value !== undefined && <span className="text-green-400">value={String(node.value)}</span>}
      {node.operator !== undefined && <span className="text-orange-400">op={String(node.operator)}</span>}
      {node.line !== undefined && node.position !== undefined && (
        <span className="text-gray-500 text-xs">@ {node.line}:{node.position}</span>
      )}
    </div>
  );
}

function RenderTree({ label, node, path = 'root', depth = 0 }) {
  const marginLeft = depth * 16;

  if (Array.isArray(node)) {
    return (
      <div className="my-1" style={{ marginLeft }}>
        {label && <div className="text-gray-400 text-xs uppercase mb-1">{label}</div>}
        {node.length === 0 ? (
          <div className="text-gray-500 text-xs">(empty)</div>
        ) : (
          node.map((item, index) => (
            <RenderTree
              key={`${path}[${index}]`}
              label={`[${index}]`}
              node={item}
              path={`${path}[${index}]`}
              depth={depth + 1}
            />
          ))
        )}
      </div>
    );
  }

  if (!isObject(node)) {
    return (
      <div className="my-1" style={{ marginLeft }}>
        {label && <span className="text-gray-400 text-xs uppercase mr-2">{label}:</span>}
        <PrimitiveValue value={node} />
      </div>
    );
  }

  const childEntries = Object.entries(node).filter(([key]) => !NODE_META_KEYS.has(key));

  return (
    <div className="my-1" style={{ marginLeft }}>
      {label && <div className="text-gray-400 text-xs uppercase mb-1">{label}</div>}
      <NodeHeader node={node} />
      {childEntries.map(([key, value]) => (
        <RenderTree key={`${path}.${key}`} label={key} node={value} path={`${path}.${key}`} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ParseTreeViewer({ parseTree }) {
  if (!parseTree) {
    return (
      <div className="text-gray-500 italic text-sm">
        No parse tree yet. Click "Compile & Run" to see results.
      </div>
    );
  }

  return (
    <div className="font-mono text-sm h-full overflow-auto bg-gray-900/50 p-4 rounded">
      <RenderTree node={parseTree} />
    </div>
  );
}
