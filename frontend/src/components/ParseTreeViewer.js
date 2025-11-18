'use client';

export default function ParseTreeViewer({ ast }) {
  if (!ast) {
    return (
      <div className="text-gray-500 italic text-sm">
        No parse tree yet. Click "Compile & Run" to see results.
      </div>
    );
  }

  const renderNode = (node, level = 0) => {
    if (!node || typeof node !== 'object') {
      return (
        <div className="ml-6 text-yellow-400 text-sm flex items-center gap-2">
          <span className="text-gray-500">└─→</span>
          {String(node)}
        </div>
      );
    }

    const nodeType = node.type || 'Node';
    const indent = level * 24;

    return (
      <div key={Math.random()} style={{ marginLeft: `${indent}px` }} className="my-1">
        {/* Node Type */}
        <div className="flex items-center gap-2">
          {level > 0 && <span className="text-gray-600">├─→</span>}
          <span className="text-blue-400 font-semibold">{nodeType}</span>
          
          {/* Show simple values inline */}
          {node.value !== undefined && (
            <span className="text-green-400">= {String(node.value)}</span>
          )}
          {node.name !== undefined && (
            <span className="text-purple-400">"{node.name}"</span>
          )}
          {node.op !== undefined && (
            <span className="text-orange-400">"{node.op}"</span>
          )}
        </div>

        {/* Render children and properties */}
        <div className="ml-6">
          {Object.entries(node).map(([key, value]) => {
            if (key === 'type') return null;
            
            // Handle simple inline values
            if (key === 'value' || key === 'name' || key === 'op') return null;
            
            // Handle complex nested objects
            if (value && typeof value === 'object') {
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="my-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">│</span>
                      <span className="text-gray-400 text-xs uppercase">{key}:</span>
                    </div>
                    {value.map((item, idx) => (
                      <div key={idx} className="ml-2">
                        {renderNode(item, level + 1)}
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div key={key} className="my-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">│</span>
                      <span className="text-gray-400 text-xs uppercase">{key}:</span>
                    </div>
                    <div className="ml-2">
                      {renderNode(value, level + 1)}
                    </div>
                  </div>
                );
              }
            }
            
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="font-mono text-sm h-full overflow-auto bg-gray-900/50 p-4 rounded">
      {renderNode(ast)}
    </div>
  );
}
